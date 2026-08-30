window.ForgeFlowLicense=(()=>{
  const STORAGE_KEY="forgeflow_license_v2";
  const FREE_LIMIT=20;
  const STANDARD_LIMIT=1000;

  function parseStored(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      const data=JSON.parse(raw);
      if(!data || data.plan!=="standard" || !data.licenseKey || !data.instanceId) return null;
      return data;
    }catch(e){ return null; }
  }

  function getState(){
    const license=parseStored();
    return license ? {plan:"standard",limit:STANDARD_LIMIT,license} : {plan:"free",limit:FREE_LIMIT,license:null};
  }

  function saveVerifiedLicense(payload){
    const data={
      plan:"standard",
      licenseKey:payload.licenseKey||"",
      instanceId:payload.instanceId||"",
      customerEmail:payload.customerEmail||"",
      verifiedAt:new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    return getState();
  }

  function clearLocal(){
    localStorage.removeItem(STORAGE_KEY);
    return getState();
  }

  function apiUrl(){
    return String(window.FORGEFLOW_LICENSE_API_BASE||"").replace(/\/$/,"");
  }

  async function post(payload){
    const url=apiUrl();
    if(!url) throw new Error("ライセンス認証の接続先が未設定です。");
    const res=await fetch(url,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    let data={};
    try{ data=await res.json(); }catch(e){}
    if(!res.ok || data.ok===false){
      throw new Error(data.error||data.message||"ライセンス認証に失敗しました。");
    }
    return data;
  }

  async function activate(key,email){
    const clean=String(key||"").trim();
    const mail=String(email||"").trim().toLowerCase();
    if(!clean) throw new Error("ライセンスキーを入力してください。");
    if(!mail || !/^\S+@\S+\.\S+$/.test(mail)) throw new Error("購入時のメールアドレスを入力してください。");

    const data=await post({
      action:"activate",
      license_key:clean,
      email:mail
    });
    if(data.plan!=="standard" || !data.instance_id){
      throw new Error(data.error||"無効なライセンスキーです。");
    }
    return saveVerifiedLicense({
      licenseKey:clean,
      instanceId:data.instance_id,
      customerEmail:mail
    });
  }

  async function validate(){
    const current=parseStored();
    if(!current) return getState();
    try{
      const data=await post({
        action:"validate",
        license_key:current.licenseKey,
        instance_id:current.instanceId
      });
      if(!data.valid){
        clearLocal();
        return getState();
      }
      current.verifiedAt=new Date().toISOString();
      localStorage.setItem(STORAGE_KEY,JSON.stringify(current));
      return getState();
    }catch(e){
      // Keep a previously verified license during a temporary network failure.
      return getState();
    }
  }

  async function deactivate(){
    const current=parseStored();
    if(!current) return clearLocal();
    await post({
      action:"deactivate",
      license_key:current.licenseKey,
      instance_id:current.instanceId
    });
    return clearLocal();
  }

  return {FREE_LIMIT,STANDARD_LIMIT,getState,activate,validate,deactivate,clearLocal};
})();
