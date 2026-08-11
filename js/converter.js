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
    ["handle","Handle元","商品管理番号|商品番号|handle|商品コード"]
  ];

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

      if(!title){
        issues.push(["error",`行 ${rowNo}: 商品名が空です。`]);
      }

      const p=cleanPrice(rawPrice);
      if(!p.valid){
        issues.push(["error",`行 ${rowNo}: 価格「${rawPrice}」を数値として解釈できません。`]);
      }else if(p.changed){
        issues.push(["fixed",`行 ${rowNo}: 価格「${rawPrice}」→「${p.value}」へ自動補正します。`]);
      }

      const s=cleanStock(rawStock);
      if(!s.valid){
        issues.push(["error",`行 ${rowNo}: 在庫「${rawStock}」を数値として解釈できません。`]);
      }else if(s.changed){
        issues.push(["fixed",`行 ${rowNo}: 在庫「${rawStock}」→「${s.value}」へ自動補正します。`]);
      }

      if(img && !/^https?:\/\//i.test(img)){
        issues.push(["warning",`行 ${rowNo}: 画像URLが http/https で始まっていません。`]);
      }

      if(sku){
        if(skuSeen.has(sku)){
          issues.push(["warning",`SKU重複: ${sku}（行 ${skuSeen.get(sku)} と ${rowNo}）`]);
        }else{
          skuSeen.set(sku,rowNo);
        }
      }
    });

    const set=new Set(rows.map(r=>productKey(r,headers,mapping)).filter(Boolean));
    const productCount=set.size||rows.length;

    if(productCount>20){
      issues.push(["info",`Free版では ${productCount} 商品中、先頭20商品まで出力します。`]);
    }

    return {issues,productCount};
  }

  function slugify(s){
    let x=String(s??"").trim().toLowerCase().normalize("NFKC")
      .replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"");
    return x||"product-"+Math.random().toString(36).slice(2,10);
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
      const optionName=val(r,"optionName",headers,mapping)||"Title";
      const optionValue=val(r,"optionValue",headers,mapping)||"Default Title";

      out.push({
        "Handle":handle,
        "Title":title,
        "Body (HTML)":val(r,"description",headers,mapping),
        "Vendor":val(r,"vendor",headers,mapping),
        "Published":"TRUE",
        "Option1 Name":optionName,
        "Option1 Value":optionValue,
        "Variant SKU":val(r,"sku",headers,mapping),
        "Variant Inventory Tracker":s.value!==""?"shopify":"",
        "Variant Inventory Qty":s.valid?s.value:"",
        "Variant Inventory Policy":"deny",
        "Variant Fulfillment Service":"manual",
        "Variant Price":p.valid?p.value:"",
        "Variant Requires Shipping":"TRUE",
        "Variant Taxable":"TRUE",
        "Image Src":val(r,"image",headers,mapping),
        "Image Alt Text":title,
        "Status":"active"
      });
    }
    return out;
  }

  function csvEscape(v){
    const s=String(v??"");
    return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }

  function toCSV(rows){
    if(!rows.length) return "";
    const hs=Object.keys(rows[0]);
    return hs.map(csvEscape).join(",")+"\r\n"+
      rows.map(r=>hs.map(h=>csvEscape(r[h])).join(",")).join("\r\n");
  }

  return {fields,autoMap,analyze,toShopifyRows,csvEscape,toCSV,cleanPrice,cleanStock};
})();