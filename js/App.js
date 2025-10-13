// -------------------------
// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA_4dCRUTCQVAt35jfuoOgsN2loq_aeZJ8",
  authDomain: "bazarlistapp-67654.firebaseapp.com",
  projectId: "bazarlistapp-67654",
  storageBucket: "bazarlistapp-67654.firebasestorage.app",
  messagingSenderId: "289624005827",
  appId: "1:289624005827:web:9b4f30cbefc703acc01676",
  measurementId: "G-8X84FLYFKG"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// -------------------------
// Local Storage setup
const KEY = 'dailyMarketList_v1';
let items = JSON.parse(localStorage.getItem(KEY) || '[]');

// -------------------------
// DOM Helpers
const el = id => document.getElementById(id);
const tbody = document.querySelector('#listTable tbody');

function save(){ localStorage.setItem(KEY, JSON.stringify(items)); }
function formatDate(d){ if(!d) return ''; const dt = new Date(d); return dt.toLocaleDateString(); }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'\\\\','"':'&quot;'})[c]); }

// -------------------------
// Render function
function render(){
  tbody.innerHTML = '';
  const q = el('search').value.trim().toLowerCase();
  const filter = el('filterDate').value;
  let total = 0;

  items.forEach((it, idx)=>{
    if(q){
      const hay = (it.name + ' ' + (it.qty||'') + ' ' + (it.unit||'') + ' ' + it.price + ' ' + it.date + ' ' + (it.creator||'') + ' ' + (it.status||'')).toLowerCase();
      if(!hay.includes(q)) return;
    }
    if(filter === 'today'){
      const today = new Date();
      const d1 = new Date(it.date);
      if(!d1 || d1.toDateString() !== today.toDateString()) return;
    }

    total += Number(it.price || 0);

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(it.name)}</td>
                    <td>${escapeHtml(it.qty||'')} ${escapeHtml(it.unit||'')}</td>
                    <td>${escapeHtml(it.price||'0')}</td>
                    <td>${it.date?formatDate(it.date):''}</td>
                    <td>${escapeHtml(it.status||'ক্রয় হয়নি')} (${escapeHtml(it.creator||'অজানা')})</td>
                    <td>
                      <button data-action="edit" data-idx="${idx}">Edit</button>
                      <button data-action="del" data-idx="${idx}">Del</button>
                      <button data-action="fav" data-idx="${idx}">${it.fav?'Unfav':'Fav'}</button>
                    </td>`;
    tbody.appendChild(tr);
  });

  el('totalPrice').textContent = total;
}

// -------------------------
// Add / Update Product
el('addBtn').addEventListener('click', ()=>{
  const name = el('itemName').value.trim();
  const qty = el('itemQty').value.trim();
  const unit = el('itemUnit').value;
  const price = el('itemPrice').value.trim();
  const date = el('itemDate').value || (new Date()).toISOString().slice(0,10);
  const creator = el('itemCreator').value || 'অজানা';
  const status = el('itemStatus').value || 'ক্রয় হয়নি';

  if(!name || !price){ alert('পণ্যের নাম ও দাম দিতে হবে'); return; }

  if(el('addBtn').dataset.editIdx !== undefined){
    const i = Number(el('addBtn').dataset.editIdx);
    items[i] = { name, qty, unit, price: Number(price), date, fav: items[i].fav, creator, status };
    delete el('addBtn').dataset.editIdx; el('addBtn').textContent = 'যোগ করুন';
  } else {
    items.push({name, qty, unit, price: Number(price), date, fav:false, creator, status});
  }

  // Clear fields
  el('itemName').value=''; el('itemQty').value=''; el('itemPrice').value='';
  el('itemDate').value=''; el('itemUnit').value='kg'; 
  el('itemCreator').value='Ashik'; 
  el('itemStatus').value='ক্রয় হয়নি';
  
  save(); render();
});

// -------------------------
// Search, Filter, Clear
el('search').addEventListener('input', render);
el('filterDate').addEventListener('change', render);

el('clearAll').addEventListener('click', ()=>{
  if(confirm('সব ডাটা মুছে ফেলতে চান?')){ items=[]; save(); render(); }
});

// -------------------------
el('exportBtn').addEventListener('click', ()=>{
  // Header
  const rows = [['Name','Qty','Unit','Price (৳)','Date','Status','Creator','Fav']]
    .concat(items.map(it=>[
      it.name,
      it.qty||'',
      it.unit||'',
      '৳'+it.price,       // Currency symbol
      it.date||'',
      it.status||'ক্রয় হয়নি',
      it.creator||'',
      it.fav?'Yes':'No'   // Yes/No instead of 1/0
    ]));

  // Total amount row
  const total = items.reduce((sum,it)=>sum + Number(it.price||0), 0);
  rows.push(['মোট','','','৳' + total,'','','','']); // Total in Price column

  // Generate CSV
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); 
  a.href=url; 
  a.download = 'market_list.csv'; 
  a.click(); 
  URL.revokeObjectURL(url);
});


// -------------------------
// Table Actions: Edit / Delete / Fav
document.addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.dataset.action;
  const idx = btn.dataset.idx;

  if(action === 'edit'){
    const it = items[idx];
    el('itemName').value = it.name;
    el('itemQty').value = it.qty || '';
    el('itemUnit').value = it.unit || 'kg';
    el('itemPrice').value = it.price;
    el('itemDate').value = it.date || '';
    el('itemCreator').value = it.creator || 'Ashik';
    el('itemStatus').value = it.status || 'ক্রয় হয়নি';
    el('addBtn').textContent = 'Update';
    el('addBtn').dataset.editIdx = idx;

  } else if(action === 'del'){
    if(confirm('মুছে ফেলতে চান?')){ items.splice(idx,1); save(); render(); }

  } else if(action === 'fav'){
    items[idx].fav = !items[idx].fav; save(); render();
  }
});

// -------------------------
// Initial Render
render();

// -------------------------
// Firebase Real-time Sync (Optional)
db.collection("marketList").orderBy("timestamp")
  .onSnapshot((snapshot) => {
    const firebaseItems = [];
    snapshot.forEach(doc => firebaseItems.push({id: doc.id, ...doc.data()}));
    // চাইলে LocalStorage কে Firebase data দিয়ে update করা যাবে
    // items = firebaseItems; render();
});
