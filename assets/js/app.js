let S = { products:[], stores:[], entries:[], theme:'light' };
let M = { discounts:[], discType:'flat', discMode:'additive', editId:null };
const STORE_KEY = 'pricelens_v5';

function load(){ try{ const d=localStorage.getItem(STORE_KEY); if(d) S=Object.assign({},S,JSON.parse(d)); }catch(e){} }
function save(){ try{ localStorage.setItem(STORE_KEY,JSON.stringify(S)); }catch(e){} }
const uid  = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const fmt  = n=>(isNaN(n)||n===null)?'0':Math.round(n).toLocaleString('en-IN');
const fmtD = n=>(isNaN(n)||n===null)?'0.00':Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const esc  = s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function setTheme(t){ S.theme=t; applyTheme(); save(); }
function toggleTheme(){ setTheme(S.theme==='dark'?'light':'dark'); }
function applyTheme(){
  document.documentElement.setAttribute('data-theme',S.theme);
  const isDark=S.theme==='dark';
  document.getElementById('theme-btn').textContent=isDark?'🌙':'🌤';
  document.getElementById('theme-btn').title=isDark?'Switch to light (T)':'Switch to dark (T)';
  const lb=document.getElementById('theme-light-btn'), db=document.getElementById('theme-dark-btn');
  if(lb){ lb.classList.toggle('on',!isDark); db.classList.toggle('on',isDark); }
}

function updateNavCounts(){
  const set=(id,n)=>{ const el=document.getElementById('nc-'+id); if(!el) return; el.textContent=n; el.classList.toggle('show',n>0); };
  set('products',S.products.length); set('stores',S.stores.length); set('entries',S.entries.length);

  const setDot=(id,n)=>{ const el=document.getElementById('bnd-'+id); if(!el) return; el.classList.toggle('show',n>0); };
  setDot('products',S.products.length); setDot('stores',S.stores.length); setDot('entries',S.entries.length);
}

const TABS=['dashboard','products','stores','entries','settings'];
function go(tab){
  document.querySelectorAll('.tab-pane').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('#main-nav button').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  const navBtn=document.querySelectorAll('#main-nav button')[TABS.indexOf(tab)];
  if(navBtn) navBtn.classList.add('active');
  const bnavBtn=document.getElementById('bnav-'+tab);
  if(bnavBtn) bnavBtn.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(tab==='dashboard') renderDashboard();
  if(tab==='products')  renderProducts();
  if(tab==='stores')    renderStores();
  if(tab==='entries')   renderEntries();
  if(tab==='settings')  renderSettings();
}

function openModal(type,editId=null){
  M.editId=editId;
  document.getElementById('overlay').style.display='flex';
  ['product','store','entry'].forEach(t=>document.getElementById('m-'+t).style.display='none');
  document.getElementById('m-'+type).style.display='block';
  if(type==='entry') initEntryModal(editId);
  setTimeout(()=>{ const inp=document.querySelector('#m-'+type+' input[type=text]'); if(inp) inp.focus(); },100);
}
function closeModal(){ document.getElementById('overlay').style.display='none'; }
function overlayClick(e){ if(e.target===document.getElementById('overlay')) closeModal(); }

function editProduct(id){
  const p=S.products.find(x=>x.id===id); if(!p) return;
  openModal('product');
  document.getElementById('p-name').value=p.name;
  document.getElementById('p-cat').value=p.cat;
  document.getElementById('p-gst').value=p.gst;
  document.getElementById('m-product').dataset.editId=id;
  document.querySelector('#m-product .modal-title').textContent='Edit product';
  document.querySelector('#m-product .btn-primary').textContent='Update product';
}
function addProduct(){
  const name=document.getElementById('p-name').value.trim();
  if(!name){ toast('Please enter a product name','err'); return; }
  const editId=document.getElementById('m-product').dataset.editId||'';
  if(editId){
    const idx=S.products.findIndex(p=>p.id===editId);
    if(idx>=0) S.products[idx]={...S.products[idx],name,cat:document.getElementById('p-cat').value,gst:+document.getElementById('p-gst').value};
    delete document.getElementById('m-product').dataset.editId;
    toast('Product updated');
  } else {
    S.products.push({id:uid(),name,cat:document.getElementById('p-cat').value,gst:+document.getElementById('p-gst').value});
    toast('Product added');
  }
  save(); closeModal();
  document.getElementById('p-name').value='';
  document.querySelector('#m-product .modal-title').textContent='Add a product';
  document.querySelector('#m-product .btn-primary').textContent='Save product';
  updateNavCounts(); renderProducts(); renderDashboard();
}
function delProduct(id){
  confirm2('Remove product?','This will also remove all price entries for this product. Cannot be undone.',()=>{
    S.products=S.products.filter(p=>p.id!==id);
    S.entries=S.entries.filter(e=>e.pid!==id);
    save(); updateNavCounts(); renderProducts(); renderEntries(); renderDashboard(); toast('Product removed');
  });
}
function renderProducts(){
  const n=S.products.length;
  document.getElementById('pc').textContent=n+' tracked';
  const el=document.getElementById('products-list');
  if(!n){ el.innerHTML=emptyState('📦','No products yet','Add laptops, tablets, phones or any device you want to track and compare across stores.',`<button class="btn btn-primary" onclick="openModal('product')">Add your first product</button>`); return; }
  el.innerHTML=S.products.map(p=>{
    const ec=S.entries.filter(e=>e.pid===p.id).length;
    return `<div class="list-item">
      <div style="min-width:0">
        <div class="list-item-name">${esc(p.name)}</div>
        <div class="tags"><span class="tag">${esc(p.cat)}</span><span class="tag tag-amber">GST ${p.gst}%</span><span class="tag-dim">${ec} price entr${ec===1?'y':'ies'}</span></div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-danger" onclick="delProduct('${p.id}')">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function editStore(id){
  const s=S.stores.find(x=>x.id===id); if(!s) return;
  openModal('store');
  document.getElementById('s-name').value=s.name;
  document.getElementById('s-type').value=s.type;
  document.getElementById('m-store').dataset.editId=id;
  document.querySelector('#m-store .modal-title').textContent='Edit store';
  document.querySelector('#m-store .btn-primary').textContent='Update store';
}
function addStore(){
  const name=document.getElementById('s-name').value.trim();
  if(!name){ toast('Please enter a store name','err'); return; }
  const editId=document.getElementById('m-store').dataset.editId||'';
  if(editId){
    const idx=S.stores.findIndex(s=>s.id===editId);
    if(idx>=0) S.stores[idx]={...S.stores[idx],name,type:document.getElementById('s-type').value};
    delete document.getElementById('m-store').dataset.editId;
    toast('Store updated');
  } else {
    S.stores.push({id:uid(),name,type:document.getElementById('s-type').value});
    toast('Store added');
  }
  save(); closeModal();
  document.getElementById('s-name').value='';
  document.querySelector('#m-store .modal-title').textContent='Add a store';
  document.querySelector('#m-store .btn-primary').textContent='Save store';
  updateNavCounts(); renderStores(); renderDashboard();
}
function delStore(id){
  confirm2('Remove store?','This will also remove all price entries for this store. Cannot be undone.',()=>{
    S.stores=S.stores.filter(s=>s.id!==id);
    S.entries=S.entries.filter(e=>e.sid!==id);
    save(); updateNavCounts(); renderStores(); renderEntries(); renderDashboard(); toast('Store removed');
  });
}
function renderStores(){
  const n=S.stores.length;
  document.getElementById('sc').textContent=n+' tracked';
  const el=document.getElementById('stores-list');
  if(!n){ el.innerHTML=emptyState('🏪','No stores yet','Add Amazon India, Flipkart, Croma, Vijay Sales, Apple Store or any seller you want to compare.',`<button class="btn btn-primary" onclick="openModal('store')">Add your first store</button>`); return; }
  el.innerHTML=S.stores.map(s=>{
    const ec=S.entries.filter(e=>e.sid===s.id).length;
    return `<div class="list-item">
      <div>
        <div class="list-item-name">${esc(s.name)}</div>
        <div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag-dim">${ec} price entr${ec===1?'y':'ies'}</span></div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="editStore('${s.id}')">Edit</button>
        <button class="btn btn-danger" onclick="delStore('${s.id}')">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function initEntryModal(editId){
  M.discounts=[]; M.discType='flat'; M.discMode='additive';
  const ps=document.getElementById('e-prod'), ss=document.getElementById('e-store');
  ps.innerHTML='<option value="">Choose product…</option>'+S.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  ss.innerHTML='<option value="">Choose store…</option>'+S.stores.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  document.getElementById('e-mrp').value='';
  document.getElementById('e-base').value='';
  document.getElementById('e-note').value='';
  document.getElementById('e-gst').checked=false;
  document.getElementById('gst-extra').style.display='none';
  if(editId){
    const e=S.entries.find(x=>x.id===editId);
    if(e){
      document.getElementById('modal-entry-title').textContent='Edit price entry';
      document.getElementById('save-entry-btn').textContent='Update entry';
      ps.value=e.pid; ss.value=e.sid;
      document.getElementById('e-mrp').value=e.mrp||'';
      document.getElementById('e-base').value=e.base;
      document.getElementById('e-note').value=e.note||'';
      M.discounts=JSON.parse(JSON.stringify(e.discounts||[]));
      M.discMode=e.discMode||'additive';
      document.getElementById('e-gst').checked=e.gst;
      document.getElementById('e-grate').value=e.grate||18;
      document.getElementById('gst-extra').style.display=e.gst?'block':'none';
    }
  } else {
    document.getElementById('modal-entry-title').textContent='Add price entry';
    document.getElementById('save-entry-btn').textContent='Save entry';
  }
  document.getElementById('d-name').value='';
  document.getElementById('d-val').value='';
  document.getElementById('d-note').value='';
  applyDiscType(); applyDiscMode(); renderDiscList();
  document.getElementById('preview-box').style.display='none';
  recalc();
}

function setDiscType(t){ M.discType=t; applyDiscType(); }
function applyDiscType(){
  document.querySelectorAll('#d-type-toggle button').forEach((b,i)=>b.classList.toggle('on',i===(M.discType==='flat'?0:1)));
  document.getElementById('d-val-lbl').textContent=M.discType==='flat'?'Amount (₹)':'Percentage (%)';
}
function setDiscMode(m){ M.discMode=m; applyDiscMode(); recalc(); }
function applyDiscMode(){
  const isAdd=M.discMode==='additive';
  document.getElementById('dm-add').classList.toggle('on',isAdd);
  document.getElementById('dm-seq').classList.toggle('on',!isAdd);
  const hint=document.getElementById('disc-mode-hint');
  if(M.discounts.length<2){ hint.textContent=''; return; }
  hint.textContent=isAdd
    ?'Additive: all % discounts summed and applied together. 10% + 5% = 15% off.'
    :'Sequential: each discount on the running price. 10% then 5% = 14.5% total (10% of ₹1,000=₹900, then 5% of ₹900=₹855).';
}
function moveDisc(id,dir){
  const idx=M.discounts.findIndex(d=>d.id===id), to=idx+dir;
  if(to<0||to>=M.discounts.length) return;
  [M.discounts[idx],M.discounts[to]]=[M.discounts[to],M.discounts[idx]];
  renderDiscList(); recalc();
}
function addDisc(){
  const val=parseFloat(document.getElementById('d-val').value)||0;
  if(val<=0){ toast('Enter a discount value','warn'); return; }
  M.discounts.push({id:uid(),name:document.getElementById('d-name').value.trim()||(M.discType==='flat'?'Flat Discount':'% Discount'),type:M.discType,val,note:document.getElementById('d-note').value.trim()});
  document.getElementById('d-name').value=''; document.getElementById('d-val').value=''; document.getElementById('d-note').value='';
  renderDiscList(); applyDiscMode(); recalc();
}
function removeDisc(id){ M.discounts=M.discounts.filter(d=>d.id!==id); renderDiscList(); applyDiscMode(); recalc(); }
function renderDiscList(){
  const el=document.getElementById('disc-list');
  const badge=document.getElementById('disc-count-badge');
  if(!M.discounts.length){ el.innerHTML=''; badge.style.display='none'; return; }
  badge.style.display='inline'; badge.textContent=M.discounts.length;
  const n=M.discounts.length;
  el.innerHTML=M.discounts.map((d,i)=>`
    <div class="disc-item">
      <div class="disc-item-main">
        <div class="disc-reorder">
          <button class="btn-reorder" onclick="moveDisc('${d.id}',-1)" ${i===0?'disabled':''}>▲</button>
          <button class="btn-reorder" onclick="moveDisc('${d.id}',1)" ${i===n-1?'disabled':''}>▼</button>
        </div>
        <div class="disc-name">${esc(d.name)}</div>
        <div class="disc-step">${M.discMode==='sequential'?`step ${i+1}`:(d.type==='flat'?'flat':'%')}</div>
        <div class="disc-val">${d.type==='flat'?'−₹'+fmt(d.val):'−'+d.val+'%'}</div>
        <button class="btn-disc-rm" onclick="removeDisc('${d.id}')" title="Remove">✕</button>
      </div>
      ${d.note?`<div class="disc-item-note">${esc(d.note)}</div>`:''}
    </div>`).join('');
}

function onProdSel(){
  const p=S.products.find(p=>p.id===document.getElementById('e-prod').value);
  if(p&&document.getElementById('e-gst').checked) document.getElementById('e-grate').value=p.gst;
  recalc();
}
function toggleGST(){
  const on=document.getElementById('e-gst').checked;
  document.getElementById('gst-extra').style.display=on?'block':'none';
  if(on){ const p=S.products.find(p=>p.id===document.getElementById('e-prod').value); if(p) document.getElementById('e-grate').value=p.gst; }
  recalc();
}

function calc(entry){
  const base=entry.base||0, discs=entry.discounts||[], gst=entry.gst, grate=entry.grate||0;
  const mode=entry.discMode||'additive';
  const mrp=entry.mrp||0;
  let price=base; const steps=[];

  if(mode==='additive'){
    let totalPct=0, totalFlat=0;
    discs.forEach(d=>{ if(d.type==='pct') totalPct+=d.val||0; else totalFlat+=d.val||0; });
    const afterPct=totalPct>0?Math.max(0,base*(1-totalPct/100)):base;
    price=Math.max(0,afterPct-totalFlat);
    if(totalPct>0) steps.push({name:`${totalPct}% combined`,type:'pct',val:totalPct,before:base,after:afterPct,amount:base-afterPct});
    if(totalFlat>0) steps.push({name:`₹${fmt(totalFlat)} flat off`,type:'flat',val:totalFlat,before:afterPct,after:price,amount:Math.min(totalFlat,afterPct)});
  } else {
    for(const d of discs){
      const before=price;
      price=d.type==='flat'?Math.max(0,price-(d.val||0)):Math.max(0,price*(1-(d.val||0)/100));
      steps.push({...d,before,after:price,amount:before-price});
    }
  }

  const afterDiscs=price, totalDiscAmt=base-afterDiscs;
  let exGST=afterDiscs, gstAmt=0;
  if(gst&&grate>0){ exGST=afterDiscs/(1+grate/100); gstAmt=afterDiscs-exGST; }
  const eff=gst?exGST:afterDiscs;
  const savedVsBase=base-eff;
  const savedVsMRP=mrp>0?mrp-eff:null;
  const discSavingAmt=totalDiscAmt;
  const gstSavingAmt=gstAmt;
  return {steps,afterDiscs,gstAmt,exGST,eff,savedVsBase,savedVsMRP,discSavingAmt,gstSavingAmt,totalDiscAmt,mode};
}

function recalc(){
  const base=parseFloat(document.getElementById('e-base').value)||0;
  const mrp=parseFloat(document.getElementById('e-mrp').value)||0;
  const gstOn=document.getElementById('e-gst').checked;
  const grate=parseFloat(document.getElementById('e-grate').value)||18;
  if(!base){ document.getElementById('preview-box').style.display='none'; return; }
  const r=calc({base,mrp,discounts:M.discounts,gst:gstOn,grate,discMode:M.discMode});
  document.getElementById('preview-box').style.display='block';
  let inner='<div class="preview-grid">';
  if(mrp>0) inner+=`<div><div class="pv-l">MRP</div><div class="pv-v" style="text-decoration:line-through;color:var(--ink3)">₹${fmt(mrp)}</div></div>`;
  inner+=`<div><div class="pv-l">Listed price</div><div class="pv-v">₹${fmt(base)}</div></div>`;
  if(mrp>0&&mrp>base) inner+=`<div><div class="pv-l">Already off MRP</div><div class="pv-v c-amber">−₹${fmt(mrp-base)} (${(((mrp-base)/mrp)*100).toFixed(1)}%)</div></div>`;
  if(r.steps.length){
    r.steps.forEach((s,i)=>{ inner+=`<div><div class="pv-l">${esc(s.name)}${M.discMode==='sequential'?' (step '+(i+1)+')':''}</div><div class="pv-v c-ruby">−₹${fmt(s.amount)}</div></div>`; });
    inner+=`<div><div class="pv-l">After discounts</div><div class="pv-v c-amber">₹${fmt(r.afterDiscs)}</div></div>`;
  }
  if(gstOn){
    inner+=`<div><div class="pv-l">GST ${grate}% removed</div><div class="pv-v c-sky">−₹${fmt(r.gstAmt)}</div></div>`;
    inner+=`<div><div class="pv-l">Price ex-GST</div><div class="pv-v c-emerald">₹${fmt(r.exGST)}</div></div>`;
  }
  inner+='<div class="pv-rule"></div>';
  inner+=`<div style="grid-column:1/-1"><div class="pv-l">Effective price</div><div class="pv-v c-emerald" style="font-size:1.15rem;font-weight:500">₹${fmt(r.eff)}</div></div>`;

  if(r.discSavingAmt>0||r.gstSavingAmt>0||r.savedVsMRP){
    inner+='<div style="grid-column:1/-1"><div class="savings-breakdown">';
    if(r.discSavingAmt>0) inner+=`<span class="sav-pill sav-disc">Discounts: −₹${fmt(r.discSavingAmt)}</span>`;
    if(r.gstSavingAmt>0) inner+=`<span class="sav-pill sav-gst">GST credit: −₹${fmt(r.gstSavingAmt)}</span>`;
    if(r.savedVsBase>0) inner+=`<span class="sav-pill sav-total">Total vs listed: −₹${fmt(r.savedVsBase)} (${((r.savedVsBase/base)*100).toFixed(1)}%)</span>`;
    if(r.savedVsMRP) inner+=`<span class="sav-pill" style="background:var(--violet-bg);color:var(--violet);border:1px solid var(--violet-bdr)">vs MRP: −₹${fmt(r.savedVsMRP)} (${((r.savedVsMRP/mrp)*100).toFixed(1)}%)</span>`;
    inner+='</div></div>';
  }
  inner+='</div>';
  document.getElementById('preview-inner').innerHTML=inner;
  if(gstOn) document.getElementById('gst-hint').textContent=`₹${fmt(r.afterDiscs)} ÷ (1 + ${grate}/100) = ₹${fmtD(r.exGST)}  ·  GST portion: ₹${fmtD(r.gstAmt)}`;
}

function saveEntry(){
  const pid=document.getElementById('e-prod').value, sid=document.getElementById('e-store').value;
  const base=parseFloat(document.getElementById('e-base').value);
  const mrp=parseFloat(document.getElementById('e-mrp').value)||0;
  if(!pid){ toast('Please select a product','err'); return; }
  if(!sid){ toast('Please select a store','err'); return; }
  if(!base||base<=0){ toast('Please enter a valid listed price','err'); return; }
  const entry={pid,sid,mrp,base,discounts:JSON.parse(JSON.stringify(M.discounts)),discMode:M.discMode,
    note:document.getElementById('e-note').value.trim(),
    gst:document.getElementById('e-gst').checked,grate:parseFloat(document.getElementById('e-grate').value)||18,
    added:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})};
  if(M.editId){
    const idx=S.entries.findIndex(e=>e.id===M.editId);
    if(idx>=0) S.entries[idx]={...entry,id:M.editId};
    toast('Entry updated');
  } else {
    const ex=S.entries.findIndex(e=>e.pid===pid&&e.sid===sid);
    if(ex>=0){
      confirm2('Replace existing entry?','An entry for this product + store already exists. Replace it?',()=>{
        S.entries[ex]={...entry,id:S.entries[ex].id};
        save(); updateNavCounts(); closeModal(); renderEntries(); renderDashboard(); toast('Entry replaced');
      },'Replace');
      return;
    } else { S.entries.push({...entry,id:uid()}); }
    toast('Price entry saved');
  }
  save(); updateNavCounts(); closeModal(); renderEntries(); renderDashboard();
}
function delEntry(id){
  confirm2('Remove this entry?','This price entry will be permanently deleted.',()=>{
    S.entries=S.entries.filter(e=>e.id!==id);
    save(); updateNavCounts(); renderEntries(); renderDashboard(); toast('Entry removed');
  });
}

function renderEntries(){
  const n=S.entries.length;
  document.getElementById('ec').textContent=n+' entr'+(n===1?'y':'ies');
  const el=document.getElementById('entries-list');
  if(!n){ el.innerHTML=emptyState('🏷','No price entries yet','Add products and stores first, then record prices from each seller.',
    `<button class="btn btn-ghost btn-sm" onclick="go('products')">Add product</button>
     <button class="btn btn-ghost btn-sm" onclick="go('stores')">Add store</button>
     <button class="btn btn-primary" onclick="openModal('entry')">Add price entry</button>`); return; }
  const q=(document.getElementById('entry-search')?.value||'').toLowerCase().trim();
  const sortBy=document.getElementById('entry-sort')?.value||'newest';
  let filtered=S.entries.filter(entry=>{
    if(!q) return true;
    const prod=S.products.find(p=>p.id===entry.pid), store=S.stores.find(s=>s.id===entry.sid);
    return (prod?.name||'').toLowerCase().includes(q)||(store?.name||'').toLowerCase().includes(q)||(entry.note||'').toLowerCase().includes(q);
  });

  const enriched=filtered.map(e=>{
    const prod=S.products.find(p=>p.id===e.pid), store=S.stores.find(s=>s.id===e.sid);
    if(!prod||!store) return null;
    return {...e,prod,store,r:calc(e)};
  }).filter(Boolean);

  if(sortBy==='cheapest') enriched.sort((a,b)=>a.r.eff-b.r.eff);
  else if(sortBy==='savings') enriched.sort((a,b)=>b.r.savedVsBase-a.r.savedVsBase);
  else if(sortBy==='product') enriched.sort((a,b)=>a.prod.name.localeCompare(b.prod.name));

  if(!enriched.length){ el.innerHTML=emptyState('🔍','No matches','Try a different search term.',`<button class="btn btn-ghost btn-sm" onclick="document.getElementById('entry-search').value='';renderEntries()">Clear search</button>`); return; }
  el.innerHTML=enriched.map(({prod,store,r,...entry})=>{
    const discNotes=(entry.discounts||[]).filter(d=>d.note).map(d=>`<span style="font-weight:600">${esc(d.name)}:</span> ${esc(d.note)}`);
    return `<div class="ecard">
      <div class="ecard-hdr">
        <div style="min-width:0">
          <div class="ecard-name">${esc(prod.name)}</div>
          <div class="ecard-tags">
            <span class="tag">${esc(store.name)}</span>
            <span class="tag">${esc(store.type)}</span>
            <span class="tag">${esc(prod.cat)}</span>
            ${entry.gst?`<span class="tag tag-sky">GST ${entry.grate}% credit</span>`:''}
            ${(entry.discounts||[]).length?`<span class="tag tag-amber">${entry.discounts.length} discount${entry.discounts.length>1?'s':''} · ${entry.discMode==='sequential'?'sequential':'additive'}</span>`:''}
            <span class="tag-dim">${entry.added}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-ghost btn-sm" onclick="openModal('entry','${entry.id}')">Edit</button>
          <button class="btn btn-danger" onclick="delEntry('${entry.id}')">Remove</button>
        </div>
      </div>
      <div class="price-row">
        ${entry.mrp?`<div><div class="pr-lbl">MRP</div><div class="pr-val" style="text-decoration:line-through;color:var(--ink3)">₹${fmt(entry.mrp)}</div></div>`:''}
        <div><div class="pr-lbl">Listed</div><div class="pr-val">₹${fmt(entry.base)}</div></div>
        ${(entry.discounts||[]).length?`<div><div class="pr-lbl">Discounts (${entry.discounts.length})</div><div class="pr-val c-ruby">−₹${fmt(r.totalDiscAmt)}</div><div class="pr-sub">${(entry.discounts||[]).map(d=>esc(d.name)).join(' → ')}</div></div>`:''}
        <div><div class="pr-lbl">After discounts</div><div class="pr-val c-amber">₹${fmt(r.afterDiscs)}</div></div>
        ${entry.gst?`<div><div class="pr-lbl">GST ${entry.grate}% off</div><div class="pr-val c-sky">−₹${fmt(r.gstAmt)}</div></div>`:''}
        <div><div class="pr-lbl">Effective price</div><div class="pr-val c-emerald" style="font-size:.98rem;font-weight:600">₹${fmt(r.eff)}</div></div>
        <div><div class="pr-lbl">Saved vs listed</div><div class="pr-val c-emerald">₹${fmt(r.savedVsBase)}<div class="pr-sub">${r.savedVsBase>0?((r.savedVsBase/entry.base)*100).toFixed(1)+'% off':'-'}</div></div></div>
        ${entry.mrp&&r.savedVsMRP?`<div><div class="pr-lbl">Saved vs MRP</div><div class="pr-val" style="color:var(--violet)">₹${fmt(r.savedVsMRP)}<div class="pr-sub">${((r.savedVsMRP/entry.mrp)*100).toFixed(1)}% off MRP</div></div></div>`:''}
      </div>${r.discSavingAmt>0||r.gstSavingAmt>0?`
      <div class="savings-breakdown" style="margin-top:12px">
        ${r.discSavingAmt>0?`<span class="sav-pill sav-disc">Discounts saved: ₹${fmt(r.discSavingAmt)}</span>`:''}
        ${r.gstSavingAmt>0?`<span class="sav-pill sav-gst">GST credit: ₹${fmt(r.gstSavingAmt)}</span>`:''}
        ${r.discSavingAmt>0&&r.gstSavingAmt>0?`<span class="sav-pill sav-total">Total: ₹${fmt(r.savedVsBase)}</span>`:''}
      </div>`:''}${discNotes.length?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--ink3);margin-bottom:6px">Discount notes</div>
        ${discNotes.map(n=>`<div style="font-size:.76rem;color:var(--ink2);margin-bottom:4px;line-height:1.5">• ${n}</div>`).join('')}
      </div>`:''}${entry.note?`<div class="entry-note-display">${esc(entry.note)}</div>`:''}
    </div>`;
  }).join('');
}

const _collapsed=new Set();
function toggleCollapse(pid){ _collapsed.has(pid)?_collapsed.delete(pid):_collapsed.add(pid); renderDashboard(); }

function renderDashboard(){
  const el=document.getElementById('dashboard-content');
  if(!S.entries.length){
    el.innerHTML=emptyState('🔍','Nothing to compare yet',
      'Start by adding a product, then add stores you want to compare, then record prices.',
      `<button class="btn btn-ghost btn-sm" onclick="go('products')">Add a product</button>
       <button class="btn btn-ghost btn-sm" onclick="go('stores')">Add a store</button>
       <button class="btn btn-primary" onclick="openModal('entry')">Add price entry</button>`,'padding:72px 24px');
    return;
  }
  const rich=S.entries.map(e=>{
    const prod=S.products.find(p=>p.id===e.pid), store=S.stores.find(s=>s.id===e.sid);
    if(!prod||!store) return null;
    return {...e,prod,store,r:calc(e)};
  }).filter(Boolean);
  if(!rich.length){ el.innerHTML=emptyState('⚠️','Data inconsistency','Some entries reference deleted products or stores. Add new entries to proceed.',''); return; }

  const bestAll=rich.reduce((a,b)=>a.r.eff<b.r.eff?a:b);
  const maxSaving=rich.reduce((a,b)=>a.r.savedVsBase>b.r.savedVsBase?a:b);
  const avgSav=rich.reduce((s,e)=>s+e.r.savedVsBase,0)/rich.length;
  const gstCount=rich.filter(e=>e.gst).length;
  const uniqP=[...new Set(rich.map(e=>e.pid))].length;
  const uniqS=[...new Set(rich.map(e=>e.sid))].length;

  let html=`<div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Products tracked</div>
      <div class="stat-num">${uniqP}</div>
      <div class="stat-sub">${rich.length} entries across <strong>${uniqS}</strong> store${uniqS!==1?'s':''}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Best deal found</div>
      <div class="stat-num" style="font-size:1.35rem;cursor:pointer" onclick="copyPrice('₹${fmt(bestAll.r.eff)}','best price')" title="Click to copy">₹${fmt(bestAll.r.eff)} <span style="font-size:.7rem;color:var(--ink3);font-family:'DM Sans',sans-serif">⎘</span></div>
      <div class="stat-sub">${esc(bestAll.prod.name.split('(')[0].trim().slice(0,36))} @ <strong>${esc(bestAll.store.name)}</strong>${bestAll.gst?' · ex-GST':''}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Maximum savings</div>
      <div class="stat-num" style="color:var(--emerald)">₹${fmt(maxSaving.r.savedVsBase)}</div>
      <div class="stat-sub">${((maxSaving.r.savedVsBase/maxSaving.base)*100).toFixed(1)}% off listed · <strong>${esc(maxSaving.store.name)}</strong></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">GST credit entries</div>
      <div class="stat-num" style="color:var(--sky)">${gstCount}</div>
      <div class="stat-sub">of ${rich.length} total · avg saving ₹${fmt(avgSav)} per entry</div>
    </div>
  </div>`;

  const byProd={};
  rich.forEach(e=>{ if(!byProd[e.pid]) byProd[e.pid]=[]; byProd[e.pid].push(e); });
  html+=`<div class="sec-label">Product-wise comparison</div>`;

  Object.keys(byProd).forEach(pid=>{
    const entries=byProd[pid], prod=entries[0].prod;
    const sorted=[...entries].sort((a,b)=>a.r.eff-b.r.eff);
    const best=sorted[0], worst=sorted[sorted.length-1];
    const spread=worst.r.eff-best.r.eff;
    const gstRows=sorted.filter(e=>e.gst);
    const bestGST=gstRows.length?gstRows.reduce((a,b)=>a.r.eff<b.r.eff?a:b):null;
    const noGSTRows=sorted.filter(e=>!e.gst);
    const bestNoGST=noGSTRows.length?noGSTRows.reduce((a,b)=>a.r.eff<b.r.eff?a:b):null;
    const isCollapsed=_collapsed.has(pid);

    html+=`<div class="prod-block${isCollapsed?' collapsed':''}">
      <div class="prod-block-hdr" onclick="toggleCollapse('${pid}')">
        <span class="cat-chip">${esc(prod.cat)}</span>
        <div class="prod-block-name">${esc(prod.name)}</div>
        <span class="entry-count">${entries.length} store${entries.length!==1?'s':''}</span>
        <span class="collapse-toggle">▾</span>
      </div>
      <div class="prod-block-body">`;

    if(entries.length>1){
      html+=`<div class="insight-row">
        <div class="ic ic-best">
          <div class="ic-eye">Best deal overall</div>
          <div class="ic-store">${esc(best.store.name)}</div>
          <div class="ic-price">₹${fmt(best.r.eff)}</div>
          <div class="ic-note">${best.gst?`ex-GST (${best.grate}%)`:'as discounted'}</div>
        </div>
        ${bestGST&&bestGST.id!==best.id?`<div class="ic ic-gst">
          <div class="ic-eye">Best with GST credit</div>
          <div class="ic-store">${esc(bestGST.store.name)}</div>
          <div class="ic-price">₹${fmt(bestGST.r.eff)}</div>
          <div class="ic-note">ex-GST @ ${bestGST.grate}%</div>
        </div>`:''}
        ${bestNoGST&&bestNoGST.id!==best.id?`<div class="ic ic-teal">
          <div class="ic-eye">Best without GST</div>
          <div class="ic-store">${esc(bestNoGST.store.name)}</div>
          <div class="ic-price">₹${fmt(bestNoGST.r.eff)}</div>
          <div class="ic-note">no GST credit</div>
        </div>`:''}
        <div class="ic">
          <div class="ic-eye">Price spread</div>
          <div class="ic-store" style="font-size:.78rem;color:var(--ink2)">Cheapest vs costliest</div>
          <div class="ic-price c-ruby">₹${fmt(spread)}</div>
          <div class="ic-note">difference across stores</div>
        </div>
        ${best.r.savedVsBase>0?`<div class="ic">
          <div class="ic-eye">Max savings vs listed</div>
          <div class="ic-store" style="font-size:.78rem;color:var(--ink2)">${esc(best.store.name)}</div>
          <div class="ic-price c-emerald">₹${fmt(best.r.savedVsBase)}</div>
          <div class="ic-note">${((best.r.savedVsBase/best.base)*100).toFixed(1)}% off listed price</div>
        </div>`:''}
      </div>`;
    }

    html+=`<div class="tbl-card"><div class="tbl-wrap"><table class="ctbl">
      <thead><tr>
        <th>Store</th><th>Type</th><th>MRP</th><th>Listed ₹</th>
        <th>Discounts</th><th>After disc.</th><th>GST benefit</th>
        <th>Effective price</th><th>Disc. saving</th><th>GST saving</th><th>Total saved</th><th>vs Best</th>
      </tr></thead><tbody>
      ${sorted.map((e,i)=>{
        const isBest=i===0, isGSTW=bestGST&&e.id===bestGST.id&&!isBest, vsBest=e.r.eff-best.r.eff;
        const discSummary=(e.discounts||[]).length
          ?(e.discounts||[]).map(d=>`<span title="${esc(d.note||d.name)}" style="white-space:nowrap">${d.type==='flat'?'−₹'+fmt(d.val):'−'+d.val+'%'}</span>`).join('<span style="color:var(--ink3)"> → </span>')
          :'<span class="c-dim">—</span>';

        const discNotesTooltip=(e.discounts||[]).filter(d=>d.note).map(d=>d.name+': '+d.note).join(' | ');
        return `<tr class="${isBest?'row-winner':isGSTW?'row-gst':''}">
          <td>
            <div style="font-weight:600;color:var(--ink)">${esc(e.store.name)}</div>
            <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
              ${isBest?'<span class="badge-win">Best deal</span>':''}
              ${isGSTW?'<span class="badge-gst">GST win</span>':''}
            </div>
            ${e.note?`<div style="font-size:.64rem;color:var(--ink3);margin-top:4px;font-style:italic;line-height:1.4" title="${esc(e.note)}">📝 ${esc(e.note.slice(0,50))}${e.note.length>50?'…':''}</div>`:''}
          </td>
          <td><span class="tag" style="font-size:.62rem">${esc(e.store.type)}</span></td>
          <td>${e.mrp?`<span style="text-decoration:line-through;color:var(--ink3)">₹${fmt(e.mrp)}</span>`:'<span class="c-dim">—</span>'}</td>
          <td>₹${fmt(e.base)}</td>
          <td>
            <div style="font-size:.72rem;line-height:1.8;color:var(--ruby)" ${discNotesTooltip?`title="${esc(discNotesTooltip)}"`:''}>${discSummary}</div>
            ${(e.discounts||[]).length>1?`<div style="font-size:.61rem;color:var(--ink3);margin-top:2px">${e.discMode==='sequential'?'sequential':'additive'}</div>`:''}
          </td>
          <td class="c-amber">₹${fmt(e.r.afterDiscs)}</td>
          <td>
            ${e.gst?`<span class="tag tag-sky" style="font-size:.62rem">${e.grate}%</span><div class="c-sky" style="font-size:.7rem;margin-top:3px">−₹${fmt(e.r.gstAmt)}</div>`:'<span class="c-dim">—</span>'}
          </td>
          <td>
            <div class="${isBest?'c-emerald':''}" style="${isBest?'font-size:.92rem;font-weight:600':''}">₹${fmt(e.r.eff)}${isBest?` <span onclick="copyPrice('₹${fmt(e.r.eff)}','${esc(e.store.name)} price')" title="Copy price" style="cursor:pointer;font-size:.65rem;color:var(--ink3);font-family:'DM Sans',sans-serif">⎘</span>`:''}</div>
            ${e.gst?'<div style="font-size:.61rem;color:var(--ink3);margin-top:2px">ex-GST</div>':''}
            ${e.mrp&&e.r.savedVsMRP?`<div style="font-size:.61rem;color:var(--violet);margin-top:2px">−${((e.r.savedVsMRP/e.mrp)*100).toFixed(1)}% vs MRP</div>`:''}
          </td>
          <td>
            ${e.r.discSavingAmt>0?`<div class="c-amber">₹${fmt(e.r.discSavingAmt)}</div>`:'<span class="c-dim">—</span>'}
          </td>
          <td>
            ${e.r.gstSavingAmt>0?`<div class="c-sky">₹${fmt(e.r.gstSavingAmt)}</div>`:'<span class="c-dim">—</span>'}
          </td>
          <td>
            <div class="c-emerald">₹${fmt(e.r.savedVsBase)}</div>
            <div style="font-size:.62rem;color:var(--ink3);margin-top:2px">${e.r.savedVsBase>0?((e.r.savedVsBase/e.base)*100).toFixed(1)+'% off listed':'-'}</div>
          </td>
          <td>
            ${isBest?'<span style="color:var(--emerald);font-weight:600;font-size:.76rem;font-family:\'DM Sans\',sans-serif">Cheapest</span>'
              :`<div class="c-ruby">+₹${fmt(vsBest)}</div><div style="font-size:.61rem;color:var(--ink3);margin-top:2px">costlier</div>`}
          </td>
        </tr>`;
      }).join('')}
      </tbody></table></div></div>
    </div></div>`;
  });

  const storeIDs=[...new Set(rich.map(e=>e.sid))];
  if(storeIDs.length>1){
    html+=`<div class="divider"></div><div class="sec-label">Store performance summary</div>
    <div class="store-perf-card">
      <div class="store-perf-hdr">
        <div class="store-perf-title">Best deals per store — across all products</div>
        <span style="font-size:.72rem;color:var(--ink3)">${storeIDs.length} stores</span>
      </div>
      <div class="tbl-wrap"><table class="ctbl"><thead><tr>
        <th>Store</th><th>Type</th><th>Products</th>
        <th>Avg effective price</th><th>Best price offered</th>
        <th>Avg saving %</th><th>GST credit?</th><th>Discounts used</th>
      </tr></thead><tbody>
      ${storeIDs.map(sid=>{
        const store=S.stores.find(s=>s.id===sid); if(!store) return '';
        const ses=rich.filter(e=>e.sid===sid);
        const avgEff=ses.reduce((s,e)=>s+e.r.eff,0)/ses.length;
        const bestE=ses.reduce((a,b)=>a.r.eff<b.r.eff?a:b);
        const avgSavPct=ses.reduce((s,e)=>s+((e.r.savedVsBase/e.base)*100),0)/ses.length;
        const hasGST=ses.some(e=>e.gst);
        const totalD=ses.reduce((s,e)=>s+((e.discounts||[]).length),0);
        return `<tr>
          <td style="font-weight:600;color:var(--ink)">${esc(store.name)}</td>
          <td><span class="tag" style="font-size:.62rem">${esc(store.type)}</span></td>
          <td>${ses.length}</td>
          <td class="c-amber">₹${fmt(avgEff)}</td>
          <td><div class="c-emerald">₹${fmt(bestE.r.eff)}</div><div style="font-size:.62rem;color:var(--ink3);margin-top:2px">${esc(bestE.prod.name.split('(')[0].slice(0,26).trim())}</div></td>
          <td class="c-emerald">${avgSavPct.toFixed(1)}%</td>
          <td>${hasGST?`<span class="tag tag-sky" style="font-size:.62rem">Yes</span>`:'<span class="c-dim">—</span>'}</td>
          <td>${totalD}</td>
        </tr>`;
      }).join('')}
      </tbody></table></div>
    </div>`;
  }
  el.innerHTML=html;
}

function renderSettings(){
  document.getElementById('settings-summary').textContent=
    `${S.products.length} products · ${S.stores.length} stores · ${S.entries.length} price entries`;
  const lb=document.getElementById('theme-light-btn'), db=document.getElementById('theme-dark-btn');
  if(lb){ lb.classList.toggle('on',S.theme!=='dark'); db.classList.toggle('on',S.theme==='dark'); }
}
function clearAllData(){
  confirm2('Clear all data?','This will permanently delete all products, stores, and price entries. This cannot be undone.',()=>{
    S={products:[],stores:[],entries:[],theme:S.theme};
    save(); updateNavCounts(); renderSettings(); renderDashboard();
    toast('All data cleared');
  },'Clear everything');
}

function exportCSV(){
  if(!S.entries.length){ toast('No entries to export','warn'); return; }
  const rows=[['Product','Category','Store','Store Type','MRP','Listed Price','Discount Mode','Discounts','Total Discount Amt','After Discounts','GST Rate','GST Saving','Effective Price','Saved vs Listed','Saved vs MRP','Overall Note','Date Added']];
  S.entries.forEach(e=>{
    const prod=S.products.find(p=>p.id===e.pid), store=S.stores.find(s=>s.id===e.sid);
    if(!prod||!store) return;
    const r=calc(e);
    const discStr=(e.discounts||[]).map(d=>`${d.name}:${d.type==='flat'?'₹'+d.val:d.val+'%'}${d.note?' ('+d.note+')':''}`).join(' | ');
    rows.push([
      prod.name, prod.cat, store.name, store.type,
      e.mrp||'', e.base, e.discMode||'additive', discStr,
      Math.round(r.totalDiscAmt), Math.round(r.afterDiscs),
      e.gst?e.grate+'%':'', e.gst?Math.round(r.gstAmt):'',
      Math.round(r.eff), Math.round(r.savedVsBase),
      r.savedVsMRP?Math.round(r.savedVsMRP):'',
      e.note||'', e.added
    ]);
  });
  const csv=rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='pricelens_export.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('CSV downloaded');
}

function copyPrice(txt,label){
  navigator.clipboard.writeText(txt).then(()=>toast('Copied: '+label)).catch(()=>toast('Copy failed','err'));
}

let _confirmCb=null;
function confirm2(title,body,onOk,okLabel='Remove'){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-body').textContent=body;
  const okBtn=document.getElementById('confirm-ok');
  okBtn.textContent=okLabel; okBtn.style.background=okLabel==='Replace'?'var(--amber)':okLabel==='Clear everything'?'var(--ruby)':'var(--ruby)';
  _confirmCb=onOk;
  document.getElementById('confirm-overlay').style.display='flex';
}
function closeConfirm(){ document.getElementById('confirm-overlay').style.display='none'; _confirmCb=null; }

function toast(msg,type='ok'){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className='toast'+(type==='err'?' err':type==='warn'?' warn':'');
  el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2800);
}
function emptyState(icon,title,body,actions,style=''){
  return `<div class="empty" style="${style}"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-body">${body}</div><div class="empty-actions">${actions}</div></div>`;
}

function seedIfEmpty(){
  if(S.products.length||S.stores.length) return;
  S.products=[
    {id:'p1',name:'Dell Inspiron 15 3520 — i5-12th / 8GB / 512GB SSD',cat:'Laptop',gst:18},
    {id:'p2',name:'MacBook Air M2 — 8GB / 256GB (Midnight)',cat:'Laptop',gst:18},
  ];
  S.stores=[
    {id:'s1',name:'Amazon India',type:'Online'},
    {id:'s2',name:'Flipkart',type:'Online'},
    {id:'s3',name:'Croma',type:'Retail / Offline'},
    {id:'s4',name:'Apple India Official',type:'Brand Store'},
  ];
  S.entries=[
    {id:'e1',pid:'p1',sid:'s1',mrp:62990,base:55990,discounts:[{id:'d1',name:'Axis Bank Card',type:'flat',val:2000,note:'Valid on 3+ month tenure cards only'}],discMode:'additive',gst:false,grate:18,note:'Usually ships in 2 days. Offer valid through June.',added:'28 May 2025'},
    {id:'e2',pid:'p1',sid:'s2',mrp:62990,base:55990,discounts:[{id:'d2',name:'Flipkart Big Billion Days',type:'pct',val:5,note:'Event discount, check dates'},{id:'d3',name:'Super Coin Redemption',type:'flat',val:500,note:'Need 500 SuperCoins in wallet'}],discMode:'additive',gst:false,grate:18,note:'',added:'28 May 2025'},
    {id:'e3',pid:'p1',sid:'s3',mrp:62990,base:57490,discounts:[{id:'d4',name:'Staff Discount',type:'flat',val:1500,note:'Ask at billing counter'}],discMode:'additive',gst:true,grate:18,note:'Physical store — can inspect before buying.',added:'28 May 2025'},
    {id:'e4',pid:'p2',sid:'s4',mrp:119900,base:114900,discounts:[],discMode:'additive',gst:true,grate:18,note:'AppleCare+ available at ₹14,900 extra.',added:'28 May 2025'},
    {id:'e5',pid:'p2',sid:'s1',mrp:119900,base:111900,discounts:[{id:'d5',name:'HDFC Card Offer',type:'flat',val:5000,note:'HDFC Regalia/Diners only'}],discMode:'additive',gst:false,grate:18,note:'',added:'28 May 2025'},
    {id:'e6',pid:'p2',sid:'s2',mrp:119900,base:112900,discounts:[{id:'d6',name:'No-Cost EMI Benefit',type:'pct',val:3,note:'Effective saving on 6-month EMI'},{id:'d7',name:'Flipkart SmartBuy Cashback',type:'flat',val:700,note:'Credited within 24hrs'}],discMode:'additive',gst:false,grate:18,note:'',added:'28 May 2025'},
  ];
  save();
}

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
  const k=e.key.toLowerCase();
  if(k==='escape'){ closeModal(); closeConfirm(); return; }
  if(k==='n') openModal('entry');
  if(k==='p') openModal('product');
  if(k==='s'&&!e.ctrlKey&&!e.metaKey) openModal('store');
  if(k==='t') toggleTheme();
  if(k==='1') go('dashboard');
  if(k==='2') go('products');
  if(k==='3') go('stores');
  if(k==='4') go('entries');
});

load(); applyTheme(); seedIfEmpty(); updateNavCounts();
renderDashboard(); renderProducts(); renderStores(); renderEntries();
document.getElementById('confirm-cancel').onclick=closeConfirm;
document.getElementById('confirm-ok').onclick=()=>{ const cb=_confirmCb; closeConfirm(); if(cb) cb(); };
document.getElementById('confirm-overlay').addEventListener('click',e=>{ if(e.target===document.getElementById('confirm-overlay')) closeConfirm(); });
