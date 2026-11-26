import {resolveLink} from './lib/editor-model.js';
import {canvasMarkup,canvasCss,newLayer,clamp,fonts} from './lib/canvas.js';
export function mountCanvasEditor(root,block,project,onChange){
 let selected=(block.layers.find(l=>l.heading===1)||block.layers.find(l=>l.kind==='text')||block.layers[0])?.id,mobile=false,snap=true,undo=[],redo=[];
 root.innerHTML=`<div class="canvas-tools"><strong>Freeform design</strong><span>Drag to move · corner to resize · double-click text to edit</span><div data-adds></div><div class="row"><button type="button" data-mode="desktop">Desktop canvas</button><button type="button" data-mode="mobile">Custom phone canvas</button><button type="button" data-undo>Undo</button><button type="button" data-redo>Redo</button></div></div><div class="canvas-workspace"><div><div class="canvas-scroll"><div data-stage></div></div><p class="hint">Arrow keys move the selected layer; Shift moves five times as far. Text is escaped on export. Phone stacking follows layer order and omits decorative shapes.</p></div><aside class="canvas-inspector"><div data-canvas-settings></div><label>Layers (front first)<select data-layers aria-label="Select canvas layer"></select></label><div data-properties></div></aside></div><input type="file" data-upload accept="image/png,image/jpeg,image/webp" hidden><style>${canvasCss}</style>`;
 const stageRoot=root.querySelector('[data-stage]'),props=root.querySelector('[data-properties]'),list=root.querySelector('[data-layers]');
 const current=()=>block.layers.find(l=>l.id===selected);
 const geometry=l=>mobile?(l.mobile||l):l;
 const snapshot=()=>{undo.push(JSON.stringify(block));if(undo.length>40)undo.shift();redo=[];};
 const commit=()=>{onChange();root.querySelector('[data-undo]').disabled=!undo.length;root.querySelector('[data-redo]').disabled=!redo.length;};
 function restore(data){const saved=JSON.parse(data);for(const key of Object.keys(block))delete block[key];Object.assign(block,saved);selected=block.layers[0]?.id;paint();settings();commit();}
 function change(fn,repaint=true){snapshot();fn();if(repaint)paint();commit();}
 function control(parent,label,value,fn,type='text',options){
  const l=document.createElement('label');l.textContent=label;const input=document.createElement(type==='textarea'?'textarea':type==='select'?'select':'input');
  if(type==='select'){for(const [v,t]of options)input.add(new Option(t,v));}else if(type!=='textarea')input.type=type;
  if(type==='checkbox')input.checked=value;else input.value=value??'';
  input.onchange=()=>change(()=>fn(type==='checkbox'?input.checked:input.value));l.append(input);parent.append(l);return input;
 }
 function settings(){const box=root.querySelector('[data-canvas-settings]');box.replaceChildren();control(box,'Canvas background',block.background,v=>block.background=v,'color');control(box,'Desktop canvas height',block.height,v=>block.height=clamp(v,300,2000),'number');control(box,'Phone behavior',block.mobileMode,v=>block.mobileMode=v,'select',[['stack','Automatic readable stack'],['custom','Separate phone positions']]);control(box,'Snap to 1% grid',snap,v=>snap=v,'checkbox');}
 function properties(){
  props.replaceChildren();const l=current();if(!l)return;const g=geometry(l);
  const title=document.createElement('h3');title.textContent=l.kind+' layer';props.append(title);
  if(['text','button'].includes(l.kind))control(props,'Layer text',l.text,v=>l.text=v,'textarea');
  if(l.kind==='text')control(props,'Text meaning',l.heading||0,v=>l.heading=Number(v),'select',[[0,'Paragraph'],[1,'Page heading'],[2,'Section heading'],[3,'Subheading']]);
  if(l.kind==='image'){
   control(props,'Image URL',l.src,v=>l.src=v);control(props,'Image alt text',l.alt,v=>l.alt=v);
   const upload=document.createElement('button');upload.textContent='Upload / replace photo';upload.onclick=()=>root.querySelector('[data-upload]').click();props.append(upload);
   control(props,'Image fit',l.fit,v=>l.fit=v,'select',[['cover','Crop to fill'],['contain','Show whole image']]);
  }
  if(l.kind!=='shape'){control(props,'Destination',l.action==='donate'?'Organization donation link':resolveLink(l.href,project),v=>{l.href=v;delete l.action;});const donate=document.createElement('button');donate.textContent=l.action==='donate'?'✓ Uses organization donation link':'Use organization donation link';donate.onclick=()=>change(()=>{l.action='donate';l.href='';});props.append(donate);}
  for(const key of ['x','y','w','h']){const name={x:'Left (%)',y:'Top (%)',w:'Width (%)',h:'Height (%)'}[key];control(props,name,g[key],v=>{const n=Number(v);if(key==='x')g.x=clamp(n,0,100-g.w);if(key==='y')g.y=clamp(n,0,100-g.h);if(key==='w')g.w=clamp(n,2,100-g.x);if(key==='h')g.h=clamp(n,2,100-g.y);},'number');}
  if(l.kind==='text'||l.kind==='button'){
   control(props,'Text size',l.fontSize,v=>l.fontSize=clamp(v,8,240),'number');control(props,'Font',l.font,v=>l.font=v,'select',Object.keys(fonts).map(k=>[k,k]));control(props,'Text alignment',l.align,v=>l.align=v,'select',[['left','Left'],['center','Center'],['right','Right']]);control(props,'Bold',l.bold,v=>l.bold=v,'checkbox');control(props,'Text color',l.color,v=>l.color=v,'color');
  }
  control(props,'Solid background',l.opaque,v=>l.opaque=v,'checkbox');control(props,'Background color',l.background,v=>l.background=v,'color');control(props,'Rotation (degrees)',l.rotation,v=>l.rotation=clamp(v,-180,180),'number');control(props,'Opacity (0–1)',l.opacity,v=>l.opacity=clamp(v,0,1),'number');control(props,'Rounded corners',l.radius,v=>l.radius=clamp(v,0,100),'number');
  const buttons=document.createElement('div');buttons.className='layer-actions';
  for(const [label,fn]of [
   ['Bring to front',()=>{const i=block.layers.indexOf(l);block.layers.push(block.layers.splice(i,1)[0]);}],
   ['Send to back',()=>{const i=block.layers.indexOf(l);block.layers.unshift(block.layers.splice(i,1)[0]);}],
   ['Duplicate',()=>{if(block.layers.length>=80)return;const c=structuredClone(l);c.id=crypto.randomUUID();c.x=clamp(c.x+2,0,100-c.w);c.y=clamp(c.y+2,0,100-c.h);block.layers.push(c);selected=c.id;}],
   ['Delete layer',()=>{block.layers.splice(block.layers.indexOf(l),1);selected=block.layers.at(-1)?.id;}]
  ]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>change(fn);buttons.append(b);}props.append(buttons);
 }
 function paint(){
  stageRoot.innerHTML=canvasMarkup(block,project,true);const stage=stageRoot.firstElementChild;
  stage.classList.toggle('phone-edit',mobile);if(mobile){stage.style.maxWidth='390px';stage.style.aspectRatio='2/3';}
  list.replaceChildren(...[...block.layers].reverse().map(l=>new Option(l.kind+' · '+(l.text||l.alt||'Decoration').slice(0,30),l.id)));list.value=selected||'';
  stage.querySelectorAll('[data-layer-id]').forEach(el=>{
   const l=block.layers.find(l=>l.id===el.dataset.layerId);if(!l)return;const g=geometry(l);
   Object.assign(el.style,{left:g.x+'%',top:g.y+'%',width:g.w+'%',height:g.h+'%'});el.classList.toggle('selected',l.id===selected);
   el.onfocus=()=>{if(selected!==l.id){selected=l.id;stage.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');list.value=selected;properties();}};
   el.onclick=()=>{selected=l.id;stage.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');list.value=selected;properties();};
   el.onkeydown=e=>{if(e.target!==el||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();change(()=>{const g=geometry(l),s=e.shiftKey?5:1;g.x=clamp(g.x+(e.key==='ArrowRight'?s:e.key==='ArrowLeft'?-s:0),0,100-g.w);g.y=clamp(g.y+(e.key==='ArrowDown'?s:e.key==='ArrowUp'?-s:0),0,100-g.h);});};
   el.ondblclick=e=>{if(!['text','button'].includes(l.kind))return;e.preventDefault();const text=el.querySelector('span');snapshot();text.contentEditable='true';text.setAttribute('role','textbox');text.setAttribute('aria-label','Edit canvas text');text.focus();text.oninput=()=>{l.text=text.innerText;commit();};text.onblur=()=>{text.contentEditable='false';properties();commit();};};
   el.onpointerdown=e=>{
    if(e.target.closest('[contenteditable="true"]')||e.detail>1)return;e.preventDefault();selected=l.id;const resize=!!e.target.closest('.layer-grip'),g=geometry(l),start={...g},bounds=stage.getBoundingClientRect(),sx=e.clientX,sy=e.clientY;snapshot();el.focus();list.value=selected;stage.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');el.setPointerCapture(e.pointerId);
    const round=n=>snap?Math.round(n):Math.round(n*10)/10;
    el.onpointermove=p=>{const dx=(p.clientX-sx)/bounds.width*100,dy=(p.clientY-sy)/bounds.height*100;if(resize){g.w=clamp(round(start.w+dx),2,100-g.x);g.h=clamp(round(start.h+dy),2,100-g.y);}else{g.x=clamp(round(start.x+dx),0,100-g.w);g.y=clamp(round(start.y+dy),0,100-g.h);}Object.assign(el.style,{left:g.x+'%',top:g.y+'%',width:g.w+'%',height:g.h+'%'});};
    el.onpointerup=el.onpointercancel=()=>{el.onpointermove=null;properties();commit();};
   };
  });properties();root.querySelector('[data-undo]').disabled=!undo.length;root.querySelector('[data-redo]').disabled=!redo.length;
 }
 list.onchange=()=>{selected=list.value;paint();};
 for(const [label,kind,extra]of [['＋ Text','text',{}],['＋ Photo','image',{}],['＋ Shape','shape',{}],['＋ Button','button',{color:'#ffffff'}],['＋ Donation button','button',{text:'Donate securely',color:'#ffffff',action:'donate'}]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>change(()=>{if(block.layers.length>=80)return;const l=newLayer(kind,extra);block.layers.push(l);selected=l.id;});root.querySelector('[data-adds]').append(b);}
 root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mobile=b.dataset.mode==='mobile';if(mobile){if(block.mobileMode!=='custom'){mobile=false;alert('Phone previews use automatic stacking. To design a separate phone canvas, first choose Separate phone positions under Phone behavior.');return;}if(block.layers.some(l=>!l.mobile)){snapshot();block.layers.forEach(l=>l.mobile??={x:l.x,y:l.y,w:l.w,h:l.h});commit();}}paint();settings();});
 root.querySelector('[data-undo]').onclick=()=>{if(undo.length){redo.push(JSON.stringify(block));restore(undo.pop());}};
 root.querySelector('[data-redo]').onclick=()=>{if(redo.length){undo.push(JSON.stringify(block));restore(redo.pop());}};
 root.querySelector('[data-upload]').onchange=async e=>{
  const file=e.target.files[0],l=current();if(!file||!l)return;
  try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000)throw Error('Choose a PNG, JPEG, or WebP under 20 MB.');const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>30000000){bitmap.close();throw Error('Choose an image smaller than 30 megapixels.');}const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let src=canvas.toDataURL('image/webp',.78);if(src.length>340000)src=canvas.toDataURL('image/webp',.45);if(src.length>340000)throw Error('Image is still too large. Crop or resize it before uploading.');change(()=>{l.src=src;l.alt=l.alt||file.name.replace(/\.[^.]+$/,'');});}catch(error){alert(error.message);}e.target.value='';
 };
 settings();paint();
}
