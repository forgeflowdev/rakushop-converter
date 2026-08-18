window.ForgeFlowConverter=(()=>{
  const fields=[
    ["title","商品名","商品名|商品名称|name|title"],
    ["description","商品説明","PC用商品説明文|スマートフォン用商品説明文|商品説明|description|body|説明"],
    ["price","販売価格","販売価格|商品価格|価格|price"],
    ["sku","SKU","システム連携用SKU番号|SKU|SKU管理番号|商品番号|商品管理番号|商品コード"],
    ["stock","在庫数","在庫数|在庫|stock|quantity"],
    ["image","画像URL","SKU画像パス|商品画像パス1|画像URL|商品画像URL|image|image url"],
    ["vendor","販売元 / Vendor","ショップ名|店舗名|vendor|brand"],
    ["optionName","選択肢名","バリエーション項目名1|選択肢項目名|option name"],
    ["optionValue","選択肢値","バリエーション項目選択肢1|選択肢値|option value"],
    ["optionName2","選択肢名2","バリエーション項目名2|option2 name"],
    ["optionValue2","選択肢値2","バリエーション項目選択肢2|option2 value"],
    ["optionName3","選択肢名3","バリエーション項目名3|option3 name"],
    ["optionValue3","選択肢値3","バリエーション項目選択肢3|option3 value"],
    ["handle","Handle元","商品管理番号（商品URL）|商品管理番号|商品番号|商品コード|handle"]
  ];

  const shopifyHeaders=["Title", "URL handle", "Description", "Vendor", "Product category", "Type", "Tags", "Published on online store", "Status", "SKU", "Barcode", "Option1 name", "Option1 value", "Option1 Linked To", "Option2 name", "Option2 value", "Option2 Linked To", "Option3 name", "Option3 value", "Option3 Linked To", "Price", "Compare-at price", "Cost per item", "Charge tax", "Tax code", "Unit price total measure", "Unit price total measure unit", "Unit price base measure", "Unit price base measure unit", "Inventory tracker", "Inventory quantity", "Continue selling when out of stock", "Weight value (grams)", "Weight unit for display", "Requires shipping", "Fulfillment service", "Product image URL", "Image position", "Image alt text", "Variant image URL", "Gift card", "SEO title", "SEO description", "Color (product.metafields.shopify.color-pattern)", "Google Shopping / Google product category", "Google Shopping / Gender", "Google Shopping / Age group", "Google Shopping / Manufacturer part number (MPN)", "Google Shopping / Ad group name", "Google Shopping / Ads labels", "Google Shopping / Condition", "Google Shopping / Custom product", "Google Shopping / Custom label 0", "Google Shopping / Custom label 1", "Google Shopping / Custom label 2", "Google Shopping / Custom label 3", "Google Shopping / Custom label 4"];

  const norm=s=>String(s??"").trim().toLowerCase().replace(/[\s_\-（）()【】\[\]]/g,"");

  function autoMap(headers){
    const map={};
    const exactPriority={
      title:["商品名","商品名称","title","name"],
      description:["PC用商品説明文","スマートフォン用商品説明文","商品説明","description","body"],
      price:["販売価格","商品価格","価格","price"],
      sku:["システム連携用SKU番号","SKU","sku","SKU管理番号"],
      stock:["在庫数","在庫","stock","quantity"],
      image:["SKU画像パス","商品画像パス1","商品画像URL","画像URL","image url","image"],
      vendor:["ショップ名","店舗名","vendor","brand"],
      optionName:["バリエーション項目名1","選択肢項目名","option name"],
      optionValue:["バリエーション項目選択肢1","選択肢値","option value"],
      optionName2:["バリエーション項目名2","option2 name"],
      optionValue2:["バリエーション項目選択肢2","option2 value"],
      optionName3:["バリエーション項目名3","option3 name"],
      optionValue3:["バリエーション項目選択肢3","option3 value"],
      handle:["商品管理番号（商品URL）","商品管理番号","商品番号","商品コード","handle"]
    };

    for(const [key,candidates] of Object.entries(exactPriority)){
      // Candidate order is the priority order.
      // Example for RMS SKU:
      // システム連携用SKU番号 -> SKU -> SKU管理番号
      let idx=-1;
      for(const candidate of candidates){
        idx=headers.findIndex(h=>norm(h)===norm(candidate));
        if(idx>=0) break;
      }
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
      const rmsImages=collectRmsImages(r,headers);

      if(!title) issues.push(["error",`行 ${rowNo}: 商品名が空です。`]);

      const p=cleanPrice(rawPrice);
      if(!p.valid) issues.push(["error",`行 ${rowNo}: 価格「${rawPrice}」を数値として解釈できません。`]);
      else if(p.changed) issues.push(["fixed",`行 ${rowNo}: 価格「${rawPrice}」→「${p.value}」へ自動補正します。`]);

      const s=cleanStock(rawStock);
      if(!s.valid) issues.push(["error",`行 ${rowNo}: 在庫「${rawStock}」を数値として解釈できません。`]);
      else if(s.changed) issues.push(["fixed",`行 ${rowNo}: 在庫「${rawStock}」→「${s.value}」へ自動補正します。`]);

      if(img && !isHttpUrl(img)){
        issues.push(["warning",`行 ${rowNo}: 画像URLが http/https で始まっていません。`]);
      }

      const seenImageWarnings=new Set();
      for(const url of [...rmsImages.productImages,rmsImages.skuImage]){
        if(!url || isHttpUrl(url)) continue;
        if(seenImageWarnings.has(url)) continue;
        seenImageWarnings.add(url);
        issues.push(["warning",`行 ${rowNo}: 画像URL「${url}」が http/https で始まっていません。`]);
      }

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

    // v3.7.6 TEST: additional abnormal-data checks
    const col=(name)=>headers.indexOf(name);
    const hi=col("商品管理番号（商品URL）"), ti=col("商品名"), si=col("在庫数");
    const o1ni=col("バリエーション項目名1"), o1vi=col("バリエーション項目選択肢1");
    const o2ni=col("バリエーション項目名2"), o2vi=col("バリエーション項目選択肢2");
    const seenHandleTitle=new Map();
    rows.forEach((r,i)=>{
      const rowNo=i+2, get=(x)=>x>=0?String(r[x]??"").trim():"";
      const handle=get(hi), title=get(ti), stock=get(si);
      if(hi>=0 && !handle) issues.push(["error",`行 ${rowNo}: 商品管理番号（商品URL）が空です。`]);
      if(si>=0 && /^-\d+(?:\.\d+)?$/.test(stock))
        issues.push(["error",`行 ${rowNo}: 在庫「${stock}」はマイナス値です。0以上の数値にしてください。`]);
      [[o1ni,o1vi],[o2ni,o2vi]].forEach(([ni,vi])=>{
        const n=get(ni), v=get(vi);
        if(n && !v) issues.push(["error",`行 ${rowNo}: 選択肢名「${n}」に対する選択肢値が空です。`]);
      });
      if(handle && title){
        if(!seenHandleTitle.has(handle)) seenHandleTitle.set(handle,{title,rowNo});
        else {
          const first=seenHandleTitle.get(handle);
          if(first.title!==title) issues.push(["warning",
            `同一商品管理番号「${handle}」で商品名が一致しません（行 ${first.rowNo}:「${first.title}」 / 行 ${rowNo}:「${title}」）。`]);
        }
      }
    });

    // v3.7.7 TEST: boundary-value warnings
    const ffPriceIdx = headers.indexOf("販売価格");
    const ffStockIdx2 = headers.indexOf("在庫数");

    rows.forEach((r,i)=>{
      const rowNo=i+2;
      const priceRaw=ffPriceIdx>=0?String(r[ffPriceIdx]??"").trim():"";
      const stockRaw=ffStockIdx2>=0?String(r[ffStockIdx2]??"").trim():"";

      if(ffPriceIdx>=0){
        const normalizedPrice=priceRaw.replace(/[￥¥円,\s]/g,"");
        if(normalizedPrice==="0" || normalizedPrice==="0.0" || normalizedPrice==="0.00"){
          issues.push(["warning",`行 ${rowNo}: 価格が0です。意図した無料商品か確認してください。`]);
        }
      }

      if(ffStockIdx2>=0 && stockRaw===""){
        issues.push(["warning",`行 ${rowNo}: 在庫数が空欄です。Shopify側で在庫設定を確認してください。`]);
      }
    });

    const set=new Set(rows.map(r=>productKey(r,headers,mapping)).filter(Boolean));
    const productCount=set.size||rows.length;
    // TEST build: product export limit disabled.

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

  function collectShopifyOptions(row,headers,mapping){
    const direct=[
      [val(row,"optionName",headers,mapping),val(row,"optionValue",headers,mapping)],
      [val(row,"optionName2",headers,mapping),val(row,"optionValue2",headers,mapping)],
      [val(row,"optionName3",headers,mapping),val(row,"optionValue3",headers,mapping)]
    ].filter(([n,v])=>String(n||"").trim()||String(v||"").trim());

    // RMS SKU CSV already provides separate variation columns.
    if(direct.length>1){
      return direct.slice(0,3).map(([n,v])=>({
        name:sanitizeOptionText(n)||"Title",
        value:sanitizeOptionText(v)||"Default Title"
      }));
    }

    // Legacy/simple input may combine "カラー / サイズ" + "ブラック / M".
    if(direct.length===1){
      return splitShopifyOptions(direct[0][0],direct[0][1]);
    }

    return [{name:"Title",value:"Default Title"}];
  }

  function splitShopifyOptions(rawName, rawValue){
    const name=sanitizeOptionText(rawName);
    const value=sanitizeOptionText(rawValue);
    if(!name && !value) return [{name:"Title",value:"Default Title"}];

    const split=(x)=>String(x||"").split(/[・|｜]/).map(v=>v.trim()).filter(Boolean);
    const names=split(name);
    const values=split(value);

    if(names.length>=2 && names.length<=3 && names.length===values.length){
      return names.map((n,i)=>({name:n,value:values[i]}));
    }
    return [{name:name||"Title",value:value||"Default Title"}];
  }

  function getRmsImageColumns(headers){
    const productImageCols=headers
      .map((h,i)=>({h,i}))
      .filter(x=>/^商品画像パス\d+$/u.test(String(x.h).trim()))
      .sort((a,b)=>{
        const na=parseInt(String(a.h).match(/\d+/)?.[0]||"0",10);
        const nb=parseInt(String(b.h).match(/\d+/)?.[0]||"0",10);
        return na-nb;
      });

    const skuImageIdx=headers.indexOf("SKU画像パス");
    return {productImageCols,skuImageIdx};
  }

  function collectRmsImages(row,headers){
    const {productImageCols,skuImageIdx}=getRmsImageColumns(headers);

    const productImages=[];
    for(const col of productImageCols){
      const v=String(row[col.i]??"").trim();
      if(v) productImages.push(v);
    }

    const skuImage=skuImageIdx>=0?String(row[skuImageIdx]??"").trim():"";
    return {productImages,skuImage};
  }

  function isHttpUrl(v){
    return /^https?:\/\//i.test(String(v||"").trim());
  }

  function toShopifyRows(rows,headers,mapping,limit=1000){
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
    const productImageRowsAdded=new Set();

    for(const r of allowed){
      const title=val(r,"title",headers,mapping);
      const product=productKey(r,headers,mapping);

      let handle=handleMap.get(product);
      if(!handle){
        handle=slugify(val(r,"handle",headers,mapping)||title);
        handleMap.set(product,handle);
      }

      const p=cleanPrice(val(r,"price",headers,mapping));
      const sQty=cleanStock(val(r,"stock",headers,mapping));
      const options=collectShopifyOptions(r,headers,mapping);

      const optionName=options[0]?.name||"Title";
      const optionValue=options[0]?.value||"Default Title";

      const rmsImages=collectRmsImages(r,headers);
      const mappedImage=val(r,"image",headers,mapping);
      const validProductImages=rmsImages.productImages.filter(isHttpUrl);
      const validSkuImage=isHttpUrl(rmsImages.skuImage)?String(rmsImages.skuImage).trim():"";
      const fallbackMappedImage=isHttpUrl(mappedImage)?String(mappedImage).trim():"";

      // For product image #1: product image wins, then mapped image, then SKU image.
      const primaryImage=validProductImages[0] || fallbackMappedImage || validSkuImage;

      const o=makeEmptyShopifyRow();

      assignIfPresent(o,["URL handle","Handle"],handle);
      assignIfPresent(o,["Title"],title);
      assignIfPresent(o,["Description","Body (HTML)"],val(r,"description",headers,mapping));
      assignIfPresent(o,["Vendor"],val(r,"vendor",headers,mapping));
      assignIfPresent(o,["Published on online store","Published"],"FALSE");
      assignIfPresent(o,["Status"],"draft");

      assignIfPresent(o,["Option1 name","Option1 Name"],optionName);
      assignIfPresent(o,["Option1 value","Option1 Value"],optionValue);

      if(options[1]){
        assignIfPresent(o,["Option2 name","Option2 Name"],options[1].name);
        assignIfPresent(o,["Option2 value","Option2 Value"],options[1].value);
      }
      if(options[2]){
        assignIfPresent(o,["Option3 name","Option3 Name"],options[2].name);
        assignIfPresent(o,["Option3 value","Option3 Value"],options[2].value);
      }

      assignIfPresent(o,["SKU","Variant SKU"],val(r,"sku",headers,mapping));
      assignIfPresent(o,["Inventory tracker","Variant Inventory Tracker"],sQty.value!==""?"shopify":"");
      assignIfPresent(o,["Inventory quantity","Variant Inventory Qty"],sQty.valid?sQty.value:"");
      assignIfPresent(o,["Continue selling when out of stock","Inventory policy","Variant Inventory Policy"],"DENY");
      assignIfPresent(o,["Fulfillment service","Variant Fulfillment Service"],"manual");
      assignIfPresent(o,["Price","Variant Price"],p.valid?p.value:"");
      assignIfPresent(o,["Requires shipping","Variant Requires Shipping"],"TRUE");
      assignIfPresent(o,["Charge tax","Variant Taxable"],"TRUE");

      if(primaryImage){
        assignIfPresent(o,["Product image URL","Image Src"],primaryImage);
        assignIfPresent(o,["Image position"],"1");
        assignIfPresent(o,["Image alt text","Image Alt Text"],title);
      }

      if(validSkuImage){
        assignIfPresent(o,["Variant image URL","Variant Image"],validSkuImage);
      }

      assignIfPresent(o,["Gift card"],"FALSE");
      assignIfPresent(o,["Weight value (grams)","Variant Grams"],"0");
      assignIfPresent(o,["Weight unit for display"],"g");

      out.push(o);

      // Add extra product image rows only once per product.
      // Additional rows share the same handle but leave variant fields empty.
      if(!productImageRowsAdded.has(handle)){
        productImageRowsAdded.add(handle);

        const extraImages = validProductImages.slice(1);
        extraImages.forEach((url,idx)=>{
          const imgRow=makeEmptyShopifyRow();
          assignIfPresent(imgRow,["URL handle","Handle"],handle);
          assignIfPresent(imgRow,["Product image URL","Image Src"],url);
          assignIfPresent(imgRow,["Image position"],String(idx+2));
          assignIfPresent(imgRow,["Image alt text","Image Alt Text"],title);
          out.push(imgRow);
        });
      }
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