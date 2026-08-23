window.ForgeFlowLicense=(()=>{
  const STORAGE_KEY="forgeflow_license_v1";
  const FREE_LIMIT=20;
  const STANDARD_LIMIT=1000;

  function parseStored(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      const data=JSON.parse(raw);
      if(!data || data.plan!=="standard" || !data.expiresAt) return null;
      if(Date.now()>=new Date(data.expiresAt).getTime()){
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    }catch(e){
      return null;
    }
  }

  function getState(){
    const license=parseStored();
    return license
      ? {plan:"standard",limit:STANDARD_LIMIT,license}
      : {plan:"free",limit:FREE_LIMIT,license:null};
  }

  function saveVerifiedLicense(payload){
    // IMPORTANT: only call this after a trusted server-side verification response.
    const data={
      plan:"standard",
      licenseKey:payload.licenseKey||"",
      expiresAt:payload.expiresAt,
      verifiedAt:new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    return getState();
  }

  function clear(){
    localStorage.removeItem(STORAGE_KEY);
    return getState();
  }

  async function activate(key){
    const clean=String(key||"").trim();
    if(!clean) throw new Error("ライセンスキーを入力してください。");

    // Placeholder until Lemon Squeezy approval + Cloudflare Worker are ready.
    // The Worker will validate the key server-side and return:
    // { valid: true, plan: "standard", expiresAt: "..." }
    const apiBase=window.FORGEFLOW_LICENSE_API_BASE||"";
    if(!apiBase){
      throw new Error("ライセンス認証は現在準備中です。Lemon Squeezy承認後に利用可能になります。");
    }

    const res=await fetch(apiBase.replace(/\/$/,"")+"/license/activate",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({licenseKey:clean})
    });

    if(!res.ok) throw new Error("ライセンス認証に失敗しました。");
    const data=await res.json();
    if(!data.valid || data.plan!=="standard" || !data.expiresAt){
      throw new Error(data.message||"無効なライセンスキーです。");
    }

    return saveVerifiedLicense({
      licenseKey:clean,
      expiresAt:data.expiresAt
    });
  }

  return {FREE_LIMIT,STANDARD_LIMIT,getState,activate,clear,saveVerifiedLicense};
})();