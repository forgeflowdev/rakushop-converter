(()=>{
  const P=ForgeFlowParser,C=ForgeFlowConverter,U=ForgeFlowUI,$=U.$;
  const state={headers:[],rows:[],mapping:{},output:[],fileName:""};

  function analyze(){
    const r=C.analyze(state.rows,state.headers,state.mapping);
    $("#rowCount").textContent=state.rows.length;
    $("#productCount").textContent=r.productCount;
    $("#issueCount").textContent=r.issues.length;
    U.renderIssues(r.issues);

    const hasFatal=r.issues.some(x=>x[0]==="error");
    $("#convertBtn").disabled=!state.rows.length||!state.mapping.title||hasFatal;
    $("#status").className=hasFatal?"notice bad":"notice info";
    $("#status").textContent=hasFatal
      ?"エラーを修正してから変換してください。"
      :"列の対応を確認して、変換ボタンを押してください。";
  }

  async function loadFile(file){
    try{
      U.setProgress(15,"読み込み中...");
      const buf=await file.arrayBuffer();
      U.setProgress(35,"文字コード判定中...");
      const {text,encoding}=P.decodeBuffer(buf);
      U.setProgress(55,"CSV解析中...");
      const parsed=P.parseCSV(text);

      if(parsed.length<2)throw new Error("データ行が見つかりません。");

      state.headers=parsed[0].map(x=>String(x).trim());
      state.rows=parsed.slice(1);
      state.mapping=C.autoMap(state.headers);
      state.fileName=file.name;

      $("#fileInfo").classList.remove("hidden");
      $("#fileInfo").textContent=`${file.name} / ${encoding} / ${state.headers.length}列`;
      $("#mappingCard").classList.remove("hidden");

      U.buildMapping(state.headers,state.mapping,(k,v)=>{state.mapping[k]=v;analyze()});
      U.setProgress(85,"データチェック中...");
      analyze();
      U.setProgress(100,"解析完了");
    }catch(e){
      $("#status").className="notice bad";
      $("#status").textContent="読み込みエラー: "+e.message;
      U.setProgress(100,"エラー");
    }
  }

  $("#file").addEventListener("change",e=>e.target.files[0]&&loadFile(e.target.files[0]));

  const drop=$("#drop");
  ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag")}));
  ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag")}));
  drop.addEventListener("drop",e=>e.dataTransfer.files[0]&&loadFile(e.dataTransfer.files[0]));

  $("#convertBtn").addEventListener("click",()=>{
    state.output=C.toShopifyRows(state.rows,state.headers,state.mapping,20);
    U.renderPreview(state.output);
    $("#status").className="notice ok";
    $("#status").textContent=`変換完了: ${state.output.length} 行を生成しました。`;
  });

  $("#downloadBtn").addEventListener("click",()=>{
    if(!state.output.length)return;
    U.download((state.fileName||"rakuten").replace(/\.csv$/i,"")+"_shopify.csv",C.toCSV(state.output));
  });

  $("#resetBtn").addEventListener("click",()=>location.reload());
})();