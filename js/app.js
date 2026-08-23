(()=>{
  const P=ForgeFlowParser,C=ForgeFlowConverter,U=ForgeFlowUI,$=U.$;

  const state={
    headers:[],
    rows:[],
    mapping:{},
    output:[],
    fileName:"",
    lastAnalysis:null
  };

  function hideOutput(){
    $("#reviewCard").classList.add("hidden");
    $("#previewCard").classList.add("hidden");
    state.output=[];
  }

  function analyze(){
    const r=C.analyze(state.rows,state.headers,state.mapping);
    state.lastAnalysis=r;

    $("#rowCount").textContent=state.rows.length;
    $("#productCount").textContent=r.productCount;
    $("#issueCount").textContent=r.issues.length;
    U.renderIssues(r.issues);

    const hasFatal=r.issues.some(x=>x[0]==="error");

    $("#status").className=hasFatal?"notice bad":"notice ok";
    $("#status").textContent=hasFatal
      ?"エラーを修正してからShopify CSVを作成してください。"
      :"データチェックを通過しました。下の「Shopify CSVを確認」へ進めます。";

    $("#reviewCard").classList.toggle("hidden",hasFatal || !state.rows.length);

    if(hasFatal){
      $("#previewCard").classList.add("hidden");
      state.output=[];
    }
  }

  async function loadFile(file){
    try{
      hideOutput();
      U.setProgress(15,"読み込み中...");

      const buf=await file.arrayBuffer();
      U.setProgress(35,"文字コード判定中...");

      const {text,encoding}=P.decodeBuffer(buf);
      U.setProgress(55,"CSV解析中...");

      const parsed=P.parseCSV(text);
      if(parsed.length<2) throw new Error("データ行が見つかりません。");

      state.headers=parsed[0].map(x=>String(x).trim());
      state.rows=parsed.slice(1);
      state.mapping=C.autoMap(state.headers);
      state.fileName=file.name;

      $("#fileInfo").classList.remove("hidden");
      $("#fileInfo").textContent=`${file.name} / ${encoding} / ${state.headers.length}列`;

      $("#mappingCard").classList.remove("hidden");

      U.buildMapping(state.headers,state.mapping,(k,v)=>{
        state.mapping[k]=v;
        $("#previewCard").classList.add("hidden");
        state.output=[];
        analyze();
      });

      U.setProgress(85,"データチェック中...");
      analyze();
      U.setProgress(100,"解析完了");

    }catch(e){
      $("#status").className="notice bad";
      $("#status").textContent="読み込みエラー: "+e.message;
      hideOutput();
      U.setProgress(100,"エラー");
    }
  }

  function buildPreview(){
    if(!state.lastAnalysis) return;

    const hasFatal=state.lastAnalysis.issues.some(x=>x[0]==="error");
    if(hasFatal){
      $("#status").className="notice bad";
      $("#status").textContent="エラーが残っているためプレビューを作成できません。";
      return;
    }

    state.output=C.toShopifyRows(state.rows,state.headers,state.mapping,ForgeFlowLicense.getState().limit);

    U.renderPreview(state.output);
    $("#previewCount").textContent=`${state.output.length} 行`;
    $("#status").className="notice ok";
    const freeLimitReached=state.lastAnalysis.productCount>20;
    $("#status").textContent=freeLimitReached
      ? `Free版では先頭20商品を出力しています（読み込み: ${state.lastAnalysis.productCount}商品）。Standardは最大1,000商品に対応予定です。`
      : `Shopify CSVプレビューを作成しました（${state.output.length} 行）。`;

    setTimeout(()=>{
      $("#previewCard").scrollIntoView({behavior:"smooth",block:"start"});
    },100);
  }

  $("#file").addEventListener("change",e=>{
    if(e.target.files[0]) loadFile(e.target.files[0]);
  });

  const drop=$("#drop");

  ["dragenter","dragover"].forEach(ev=>{
    drop.addEventListener(ev,e=>{
      e.preventDefault();
      drop.classList.add("drag");
    });
  });

  ["dragleave","drop"].forEach(ev=>{
    drop.addEventListener(ev,e=>{
      e.preventDefault();
      drop.classList.remove("drag");
    });
  });

  drop.addEventListener("drop",e=>{
    if(e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });

  $("#reviewBtn").addEventListener("click",buildPreview);

  $("#downloadBtn").addEventListener("click",()=>{
    if(!state.output.length) return;
    U.download(
      (state.fileName||"rakuten").replace(/\.csv$/i,"")+"_shopify.csv",
      C.toCSV(state.output)
    );
  });

  $("#resetBtn").addEventListener("click",()=>location.reload());

  $("#sampleBtn").addEventListener("click",()=>{
    const s=[
      ["商品管理番号","商品名","商品説明","販売価格","SKU","在庫数","商品画像URL","ショップ名"],
      ["rakuten-001","サンプルTシャツ","説明","2980","TS-001","15","https://example.com/1.jpg","サンプルショップ"]
    ].map(r=>r.map(C.csvEscape).join(",")).join("\r\n");

    U.download("rakushop_sample.csv",s);
  });

  // ---------- License UI ----------
  function renderLicenseState(){
    const state=ForgeFlowLicense.getState();
    const badge=document.querySelector("#planBadge");
    const freeBox=document.querySelector("#licenseFreeState");
    const stdBox=document.querySelector("#licenseStandardState");
    const expiry=document.querySelector("#licenseExpiryText");

    if(!badge || !freeBox || !stdBox) return;

    if(state.plan==="standard"){
      badge.textContent="Standard";
      badge.className="plan-badge standard";
      freeBox.classList.add("hidden");
      stdBox.classList.remove("hidden");
      if(expiry && state.license?.expiresAt){
        const d=new Date(state.license.expiresAt);
        expiry.textContent=`（有効期限: ${d.toLocaleDateString("ja-JP")}）`;
      }
    }else{
      badge.textContent="Free";
      badge.className="plan-badge free";
      freeBox.classList.remove("hidden");
      stdBox.classList.add("hidden");
    }
  }

  const activateBtn=document.querySelector("#activateLicenseBtn");
  if(activateBtn){
    activateBtn.addEventListener("click",async()=>{
      const input=document.querySelector("#licenseKeyInput");
      const msg=document.querySelector("#licenseMessage");
      activateBtn.disabled=true;
      if(msg) msg.textContent="ライセンスを確認しています...";
      try{
        await ForgeFlowLicense.activate(input?.value||"");
        if(msg) msg.textContent="Standardを有効化しました。";
        renderLicenseState();
      }catch(e){
        if(msg) msg.textContent=e.message;
      }finally{
        activateBtn.disabled=false;
      }
    });
  }

  const deactivateBtn=document.querySelector("#deactivateLicenseBtn");
  if(deactivateBtn){
    deactivateBtn.addEventListener("click",()=>{
      ForgeFlowLicense.clear();
      renderLicenseState();
      location.reload();
    });
  }

  renderLicenseState();

})();