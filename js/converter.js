window.ForgeFlowConverter=(()=>{
  const fields=[
    ["title","商品名","商品名|商品名称|name|title"],
    ["description","商品説明","商品説明|PC用商品説明文|スマートフォン用商品説明文|description|body|説明"],
    ["price","販売価格","販売価格|商品価格|価格|price"],
    ["sku","SKU","SKU|商品管理番号|商品番号|商品コード"],
    ["stock","在庫数","在庫数|在庫|stock|quantity"],
    ["image","画像URL","画像URL|商品画像URL|image|image url"],
    ["vendor","販売元 / Vendor","ショップ名|店舗名|vendor|brand"],
    ["optionName","選択肢名","選択肢項目名|option name"],
    ["optionValue","選択肢値","選択肢値|option value"],
    ["handle","Handle元","商品管理番号|商品番号|商品コード|handle"]
  ];

  const shopifyHeaders=["Title", "URL handle", "Description", "Vendor", "Product category", "Type", "Tags", "Published on online store", "Status", "SKU", "Barcode", "Option1 name", "Option1 value", "Option1 Linked To", "Option2 name", "Option2 value", "Option2 Linked To", "Option3 name", "Option3 value", "Option3 Linked To", "Price", "Compare-at price", "Cost per item", "Charge tax", "Tax code", "Unit price total measure", "Unit price total measure unit", "Unit price base measure", "Unit price base measure unit", "Inventory tracker", "Inventory quantity", "Continue selling when out of stock", "Weight value (grams)", "Weight unit for display", "Requires shipping", "Fulfillment service", "Product image URL", "Image position", "Image alt text", "Variant image URL", "Gift card", "SEO title", "SEO description", "Color (product.metafields.shopify.color-pattern)", "Google Shopping / Google product category", "Google Shopping / Gender", "Google Shopping / Age group", "Google Shopping / Manufacturer part number (MPN)", "Google Shopping / Ad group name", "Google Shopping / Ads labels", "Google Shopping / Condition", "Google Shopping / Custom product", "Google Shopping / Custom label 0", "Google Shopping / Custom label 1", "Google Shopping / Custom label 2", "Google Shopping / Custom label 3", "Google Shopping / Custom label 4"];

  const norm=s=>String(s??"").trim().toLowerCase().replace(/[\s_\-（）()【】\[\]]/g,"");

  function autoMap(headers){
    const map={};
    const exactPriority={
      title:["商品名","商品名称","title","name"],
      description:["商品説明","PC用商品説明文","スマートフォン用商品説明文","description","body"],
      price:["販売価格","商品価格","価格","price"],
      sku:["SKU","sku"],
      stock:["在庫数","在庫","stock","quantity"],
      image:["商品画像URL","画像URL","image url","image"],
      vendor:["ショップ名","店舗名","vendor","brand"],
      optionName:["選択肢項目名","option name"],
      optionValue:["選択肢値","option value"],
      handle:["商品管理番号","商品番号","商品コード","handle"]
    };

    for(const [key,candidates] of Object.entries(exactPriority)){
      const idx=headers.findIndex(h=>candidates.some(c=>norm(h)===norm(c)));
      if(idx>=0) map[key]=headers[idx];
    }

    for(const[key,label,aliases]of fields){
      if(map[key]) continue;
      const opts=aliases.split("|").map(norm);
      let idx=headers.findIndex(h=>opts.includes(norm(h)));
      if(idx<0){
        idx=headers.findIndex(h=>{
          const hn=norm(h);
          return opts.some(a=>hn.includes(a)||a.includes(hn));
        });
      }
      map[key]=idx>=0?headers[idx]:"";
    }

    return map;
  }

  function val(row,key,headers,mapping){
    const h=mapping[key];
    if(!h) return "";
    const i=headers.indexOf(h);
    return i>=0?String(row[i]??"").trim():"";
  }

  function productKey(r,h,m){
    return val(r,"handle",h,m)||val(r,"title",h,m);
  }

  function cleanPrice(raw){
    const original=String(raw??"").trim();
    if(!original) return {value:"",changed:false,valid:true};
    const cleaned=original.replace(/[￥¥円,\s]/g,"");
    if(/^\d+(?:\.\d+)?$/.test(cleaned)){
      return {value:cleaned,changed:cleaned!==original,valid:true};
    }
    return {value:original,changed:false,valid:false};
  }

  function cleanStock(raw){
    const original=String(raw??"").trim();
    if(!original) return {value:"",changed:false,valid:true};
    const cleaned=original.replace(/,/g,"");
    if(/^-?\d+$/.test(cleaned)){
      return {value:cleaned,changed:cleaned!==original,valid:true};
    }
    return {value:original,changed:false,valid:false};
  }

  function analyze(rows,headers,mapping){
    const issues=[];
    if(!mapping.title) issues.push(["error","商品名の列を特定できません。"]);
    if(!mapping.price) issues.push(["warning","価格の列を特定できません。"]);

    const skuSeen=new Map();

    rows.forEach((r,i)=>{
      const rowNo=i+2;
      const title=val(r,"title",headers,mapping);
      const rawPrice=val(r,"price",headers,mapping);
      const sku=val(r,"sku",headers,mapping);
      const rawStock=val(r,"stock",headers,mapping);
      const img=val(r,"image",headers,mapping);

      if(!title) issues.push(["error",`行 ${rowNo}: 商品名が空です。`]);

      const p=cleanPrice(rawPrice);
      if(!p.valid) issues.push(["error",`行 ${rowNo}: 価格「${rawPrice}」を数値として解釈できません。`]);
      else if(p.changed) issues.push(["fixed",`行 ${rowNo}: 価格「${rawPrice}」→「${p.value}」へ自動補正します。`]);

      const s=cleanStock(rawStock);
      if(!s.valid) issues.push(["error",`行 ${rowNo}: 在庫「${rawStock}」を数値として解釈できません。`]);
      else if(s.changed) issues.push(["fixed",`行 ${rowNo}: 在庫「${rawStock}」→「${s.value}」へ自動補正します。`]);

      if(img && !/^https?:\/\//i.test(img)) issues.push(["warning",`行 ${rowNo}: 画像URLが http/https で始まっていません。`]);

      const rawOptionName=val(r,"optionName",headers,mapping);
      const rawOptionValue=val(r,"optionValue",headers,mapping);
      const safeOptionName=sanitizeOptionText(rawOptionName);
      const safeOptionValue=sanitizeOptionText(rawOptionValue);

      if(rawOptionName && safeOptionName!==rawOptionName){
        issues.push(["fixed",`行 ${rowNo}: 選択肢名「${rawOptionName}」→「${safeOptionName}」へ自動補正します。`]);
      }
      if(rawOptionValue && safeOptionValue!==rawOptionValue){
        issues.push(["fixed",`行 ${rowNo}: 選択肢値「${rawOptionValue}」→「${safeOptionValue}」へ自動補正します。`]);
      }

      if(sku){
        if(skuSeen.has(sku)) issues.push(["warning",`SKU重複: ${sku}（行 ${skuSeen.get(sku)} と ${rowNo}）`]);
        else skuSeen.set(sku,rowNo);
      }
    });

    const set=new Set(rows.map(r=>productKey(r,headers,mapping)).filter(Boolean));
    const productCount=set.size||rows.length;
    if(productCount>20) issues.push(["info",`Free版では ${productCount} 商品中、先頭20商品まで出力します。`]);

    return {issues,productCount};
  }

  function slugify(s){
    let x=String(s??"").trim().toLowerCase().normalize("NFKC")
      .replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"");
    return x||"product-"+Math.random().toString(36).slice(2,10);
  }

  function makeEmptyShopifyRow(){
    const obj={};
    for(const h of shopifyHeaders) obj[h]="";
    return obj;
  }

  function assignIfPresent(obj, candidates, value){
    for(const name of candidates){
      if(Object.prototype.hasOwnProperty.call(obj,name)){
        obj[name]=value;
        return true;
      }
    }
    return false;
  }

  function sanitizeOptionText(raw){
    let s=String(raw??"").trim();
    if(!s) return "";
    // Shopify rejects certain name sequences such as " / ".
    s=s.replace(/\s*\/\s*/g,"・");
    s=s.replace(/\s{2,}/g," ");
    return s.trim();
  }

  function toShopifyRows(rows,headers,mapping,limit=20){
    const out=[],allowed=[],seenProducts=new Set();
    for(const r of rows){
      const key=productKey(r,headers,mapping)||("row-"+allowed.length);
      if(!seenProducts.has(key)){
        if(seenProducts.size>=limit) continue;
        seenProducts.add(key);
      }
      allowed.push(r);
    }

    const handleMap=new Map();

    for(const r of allowed){
      const title=val(r,"title",headers,mapping);
      const product=productKey(r,headers,mapping);

      let handle=handleMap.get(product);
      if(!handle){
        handle=slugify(val(r,"handle",headers,mapping)||title);
        handleMap.set(product,handle);
      }

      const p=cleanPrice(val(r,"price",headers,mapping));
      const s=cleanStock(val(r,"stock",headers,mapping));
      const optionName=sanitizeOptionText(val(r,"optionName",headers,mapping))||"Title";
      const optionValue=sanitizeOptionText(val(r,"optionValue",headers,mapping))||"Default Title";

      const o=makeEmptyShopifyRow();

      assignIfPresent(o,["URL handle","Handle"],handle);
      assignIfPresent(o,["Title"],title);
      assignIfPresent(o,["Description","Body (HTML)"],val(r,"description",headers,mapping));
      assignIfPresent(o,["Vendor"],val(r,"vendor",headers,mapping));
      assignIfPresent(o,["Published on online store","Published"],"TRUE");

      assignIfPresent(o,["Option1 name","Option1 Name"],optionName);
      assignIfPresent(o,["Option1 value","Option1 Value"],optionValue);

      assignIfPresent(o,["SKU","Variant SKU"],val(r,"sku",headers,mapping));
      assignIfPresent(o,["Inventory tracker","Variant Inventory Tracker"],s.value!==""?"shopify":"");
      assignIfPresent(o,["Inventory quantity","Variant Inventory Qty"],s.valid?s.value:"");
      assignIfPresent(o,["Continue selling when out of stock","Inventory policy","Variant Inventory Policy"],"DENY");
      assignIfPresent(o,["Fulfillment service","Variant Fulfillment Service"],"manual");
      assignIfPresent(o,["Price","Variant Price"],p.valid?p.value:"");
      assignIfPresent(o,["Requires shipping","Variant Requires Shipping"],"TRUE");
      assignIfPresent(o,["Charge tax","Variant Taxable"],"TRUE");

      assignIfPresent(o,["Product image URL","Image Src"],val(r,"image",headers,mapping));
      assignIfPresent(o,["Image alt text","Image Alt Text"],title);

      assignIfPresent(o,["Status"],"active");

      // Safe defaults for columns present in current Shopify templates.
      assignIfPresent(o,["Gift card"],"FALSE");
      assignIfPresent(o,["Weight value (grams)","Variant Grams"],"0");
      assignIfPresent(o,["Weight unit for display"],"g");

      out.push(o);
    }
    return out;
  }

  function csvEscape(v){
    const s=String(v??"");
    return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }

  function toCSV(rows){
    if(!rows.length) return "";
    const hs=shopifyHeaders;
    return hs.map(csvEscape).join(",")+"\r\n"+
      rows.map(r=>hs.map(h=>csvEscape(r[h]??"")).join(",")).join("\r\n");
  }

  return {
    fields,shopifyHeaders,autoMap,analyze,toShopifyRows,csvEscape,toCSV,cleanPrice,cleanStock,sanitizeOptionText
  };
})();