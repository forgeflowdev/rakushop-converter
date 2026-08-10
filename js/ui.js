window.ForgeFlowUI=(()=>{
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function setProgress(p,l){
    $("#progressWrap").classList.remove("hidden");
    $("#progressBar").style.width=p+"%";
    $("#progressValue").textContent=p+"%";
    $("#progressLabel").textContent=l;
    if(p>=100)setTimeout(()=>$("#progressWrap").classList.add("hidden"),500);
  }

  function buildMapping(headers,mapping,onChange){
    const box=$("#mapping"); box.innerHTML="";
    for(const[key,label]of ForgeFlowConverter.fields){
      const d=document.createElement("div");
      d.innerHTML=`<label>${esc(label)}<select data-key="${key}">
        <option value="">未使用</option>
        ${headers.map(h=>`<option value="${esc(h)}"${mapping[key]===h?" selected":""}>${esc(h)}</option>`).join("")}
      </select></label>`;
      box.appendChild(d);
    }
    box.querySelectorAll("select").forEach(s=>s.addEventListener("change",()=>onChange(s.dataset.key,s.value)));
  }

  function renderIssues(issues){
    $("#issuesCard").classList.remove("hidden");

    const counts={error:0,warning:0,fixed:0,info:0};
    issues.forEach(x=>counts[x[0]]=(counts[x[0]]||0)+1);

    const summary=`<div class="issueSummary">
      <span class="pill pillError">エラー ${counts.error}</span>
      <span class="pill pillWarning">警告 ${counts.warning}</span>
      <span class="pill pillFixed">自動修正 ${counts.fixed}</span>
      <span class="pill pillInfo">情報 ${counts.info}</span>
    </div>`;

    const body=issues.length
      ? issues.map(x=>{
          const cls={error:"issueError",warning:"issueWarning",fixed:"issueFixed",info:"issueInfo"}[x[0]]||"issueInfo";
          const label={error:"エラー",warning:"警告",fixed:"自動修正",info:"情報"}[x[0]]||"情報";
          return `<div class="issue ${cls}"><b>${label}</b> ${esc(x[1])}</div>`;
        }).join("")
      : `<div class="notice ok">大きな問題は見つかりませんでした。</div>`;

    $("#issues").innerHTML=summary+body;
  }

  function renderPreview(rows){
    const hs=Object.keys(rows[0]||{});
    $("#preview").innerHTML=`<thead><tr>${hs.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.slice(0,30).map(r=>`<tr>${hs.map(h=>`<td>${esc(r[h])}</td>`).join("")}</tr>`).join("")}</tbody>`;
    $("#previewCard").classList.remove("hidden");
  }

  function download(name,content){
    const blob=new Blob(["\uFEFF",content],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  return{$,setProgress,buildMapping,renderIssues,renderPreview,download};
})();