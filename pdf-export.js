(() => {
  'use strict';
  const A4_W_PT = 595.28, A4_H_PT = 841.89;
  const bytesFromString = str => new TextEncoder().encode(str);
  function concatBytes(parts){const total=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(total);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
  function dataUrlToBytes(dataUrl){const b64=dataUrl.slice(dataUrl.indexOf(',')+1),bin=atob(b64),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
  function makePdfFromJpegs(images){
    const pageCount=images.length,objectCount=2+pageCount*3,offsets=new Array(objectCount+1).fill(0),chunks=[];let cursor=0;
    const push=part=>{const b=typeof part==='string'?bytesFromString(part):part;chunks.push(b);cursor+=b.length;};
    push(new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34,0x0a,0x25,0xe2,0xe3,0xcf,0xd3,0x0a]));
    const write=(num,parts)=>{offsets[num]=cursor;push(`${num} 0 obj\n`);parts.forEach(push);push('\nendobj\n');};
    write(1,['<< /Type /Catalog /Pages 2 0 R >>']);
    const kids=Array.from({length:pageCount},(_,i)=>`${3+i*3} 0 R`).join(' ');write(2,[`<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>`]);
    images.forEach((img,i)=>{const page=3+i*3,image=page+1,content=page+2;write(page,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W_PT} ${A4_H_PT}] /Resources << /XObject << /Im${i+1} ${image} 0 R >> >> /Contents ${content} 0 R >>`]);offsets[image]=cursor;push(`${image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`);push(img.bytes);push('\nendstream\nendobj\n');const stream=bytesFromString(`q\n${A4_W_PT} 0 0 ${A4_H_PT} 0 0 cm\n/Im${i+1} Do\nQ\n`);write(content,[`<< /Length ${stream.length} >>\nstream\n`,stream,'endstream']);});
    const xref=cursor;push(`xref\n0 ${objectCount+1}\n0000000000 65535 f \n`);for(let i=1;i<=objectCount;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);push(`trailer\n<< /Size ${objectCount+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return concatBytes(chunks);
  }
  function createPage(options={}){const width=options.width||794,height=options.height||1123,scale=options.scale||2.25,canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('PDF canvas unavailable.');ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle=options.background||'#fff';ctx.fillRect(0,0,width,height);ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.lineCap='round';return{canvas,ctx,width,height,scale};}
  function roundRect(ctx,x,y,w,h,r,fill,stroke,lineWidth=1){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);ctx.lineTo(x+rr,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rr);ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
  function linesForText(ctx,text,maxWidth){const out=[];for(const para of String(text??'').split(/\n/)){const words=para.trim().split(/\s+/).filter(Boolean);if(!words.length){out.push('');continue;}let line=words[0];for(let i=1;i<words.length;i++){const t=`${line} ${words[i]}`;if(ctx.measureText(t).width<=maxWidth)line=t;else{out.push(line);line=words[i];}}out.push(line);}return out;}
  function wrappedText(ctx,textValue,x,y,maxWidth,opt={}){const size=opt.size||10,lineHeight=opt.lineHeight||size*1.35,weight=opt.weight||400,family=opt.family||'Arial, sans-serif';ctx.font=`${weight} ${size}px ${family}`;ctx.fillStyle=opt.color||'#13233a';ctx.textAlign=opt.align||'left';let lines=linesForText(ctx,textValue,maxWidth);if(opt.maxLines&&lines.length>opt.maxLines){lines=lines.slice(0,opt.maxLines);let last=lines[lines.length-1];while(last&&ctx.measureText(`${last}...`).width>maxWidth)last=last.slice(0,-1);lines[lines.length-1]=`${last}...`;}lines.forEach((ln,i)=>ctx.fillText(ln,x,y+i*lineHeight));return y+Math.max(0,lines.length-1)*lineHeight;}
  function text(ctx,value,x,y,opt={}){const size=opt.size||10,weight=opt.weight||400,family=opt.family||'Arial, sans-serif';ctx.font=`${weight} ${size}px ${family}`;ctx.fillStyle=opt.color||'#13233a';ctx.textAlign=opt.align||'left';ctx.fillText(String(value??''),x,y);}
  function line(ctx,x1,y1,x2,y2,color='#dce4ea',width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function inlineSvgStyles(source,clone){
    const props=['fill','fill-opacity','stroke','stroke-opacity','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','font-family','font-size','font-style','font-weight','letter-spacing','text-anchor','dominant-baseline'];
    const srcNodes=[source,...source.querySelectorAll('*')],cloneNodes=[clone,...clone.querySelectorAll('*')];
    srcNodes.forEach((node,i)=>{
      const target=cloneNodes[i]; if(!target||!(node instanceof Element))return;
      const cs=getComputedStyle(node);
      props.forEach(prop=>{const val=cs.getPropertyValue(prop);if(val)target.style.setProperty(prop,val);});
    });
  }
  async function drawSvgElement(ctx,svg,x,y,w,h){
    if(!svg)return;
    const clone=svg.cloneNode(true);
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
    inlineSvgStyles(svg,clone);
    const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
    try{
      const img=new Image();
      await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('Could not render report chart.'));img.src=url;});
      ctx.drawImage(img,x,y,w,h);
    }finally{URL.revokeObjectURL(url);}
  }
  function canvasToJpeg(canvas,q=.94){return{bytes:dataUrlToBytes(canvas.toDataURL('image/jpeg',q)),width:canvas.width,height:canvas.height};}
  function triggerDownload(bytes,filename){const blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename.endsWith('.pdf')?filename:`${filename}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  async function downloadCanvases(canvases,opt={}){const images=canvases.map(c=>canvasToJpeg(c,opt.quality||.94)),pdf=makePdfFromJpegs(images);triggerDownload(pdf,opt.filename||'carrowmont-report.pdf');return pdf;}
  window.CarrowmontPdfExport={createPage,roundRect,wrappedText,text,line,drawSvgElement,downloadCanvases,makePdfFromJpegs};
})();
