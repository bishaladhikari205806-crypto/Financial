let isOutcome = false;
let balance = 0;
let entries = [];
let goals = [];

// ⚠️ CHANGE THIS: Paste your real Google Apps Script Web App Deployment URL here
const API_URL = "https://api.sheetbest.com/sheets/77a433dc-9658-4976-a63f-10161078e9a1";

const STORAGE_KEY = 'bishal_finance_data_v1';
function saveData(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({entries, balance, goals})); }catch(e){}
}
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const d = JSON.parse(raw);
      entries = Array.isArray(d.entries) ? d.entries : [];
      balance = typeof d.balance === 'number' ? d.balance : 0;
      goals = Array.isArray(d.goals) ? d.goals : [];
    }
  }catch(e){ entries = []; balance = 0; goals = []; }
}

const switchEl = document.getElementById('switchToggle');
const lblIncome = document.getElementById('lblIncome');
const lblOutcome = document.getElementById('lblOutcome');
const knob = document.getElementById('knob');
const amountEl = document.getElementById('amount');
const sourceEl = document.getElementById('source');
const entryDateEl = document.getElementById('entryDate');
const previewBox = document.getElementById('previewBox');
const btnPreview = document.getElementById('btnPreview');
const btnSubmit = document.getElementById('btnSubmit');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
const balanceAmt = document.getElementById('balanceAmt');
const historyList = document.getElementById('historyList');
const expenseScroll = document.getElementById('expenseScroll');
const sumIncome = document.getElementById('sumIncome');
const sumOutcome = document.getElementById('sumOutcome');
const savingPill = document.getElementById('savingPill');

const addBtn = document.getElementById('addBtn');
const sheetOverlay = document.getElementById('sheetOverlay');
const addSheet = document.getElementById('addSheet');
const statementSheet = document.getElementById('statementSheet');
const goalsSheet = document.getElementById('goalsSheet');
const statementList = document.getElementById('statementList');
const goalsList = document.getElementById('goalsList');

let activeSheet = null;
function openSheetEl(el){
  if(activeSheet && activeSheet !== el) activeSheet.classList.remove('show');
  activeSheet = el;
  sheetOverlay.classList.add('show');
  el.classList.add('show');
}
function closeActiveSheet(){
  if(activeSheet) activeSheet.classList.remove('show');
  sheetOverlay.classList.remove('show');
  activeSheet = null;
}
addBtn.addEventListener('click', ()=> openSheetEl(addSheet));
sheetOverlay.addEventListener('click', closeActiveSheet);
document.getElementById('infoBtn').addEventListener('click', ()=> showToast('Bishal Adhikari Financial Statement', false));
document.getElementById('downBtn').addEventListener('click', ()=> fetchFromGoogleSheets()); // Manual reload button

document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if(tab==='add'){ openSheetEl(addSheet); }
    else if(tab==='statement'){ openSheetEl(statementSheet); renderStatement(); }
    else if(tab==='menu'){ openSheetEl(goalsSheet); renderGoals(); }
    else { closeActiveSheet(); }
  });
});

/* wallet dropdown */
const walletTrigger = document.getElementById('walletTrigger');
const walletOptionsList = document.getElementById('walletOptionsList');
const walletLabelDisplay = document.getElementById('walletLabelDisplay');
const walletIconDisplay = document.getElementById('walletIconDisplay');

const esewaIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#5EBB4F"/><text x="10.5" y="17" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="15" fill="#ffffff">e</text><rect x="18.5" y="10.6" width="4.2" height="3" rx="1" fill="#ffffff"/></svg>`;
const khaltiIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#5C2D91"/><text x="12" y="17" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="13" fill="#ffffff">K</text></svg>`;
const nicIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ffffff"/><g fill="#E31E24"><polygon points="12,12 7,2 15,4"/><polygon points="12,12 7,2 15,4" transform="rotate(90 12 12)"/><polygon points="12,12 7,2 15,4" transform="rotate(180 12 12)"/><polygon points="12,12 7,2 15,4" transform="rotate(270 12 12)"/></g></svg>`;
const cashIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3ddc97"/><text x="12" y="16.5" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="13" fill="#0b2b1e">Rs</text></svg>`;

const walletOptions = [
  {id:'esewa', label:'eSewa', icon:esewaIcon},
  {id:'khalti', label:'Khalti', icon:khaltiIcon},
  {id:'bank', label:'NIC Asia', icon:nicIcon},
  {id:'cash', label:'Cash', icon:cashIcon},
];
let currentWallet = walletOptions[0];

function renderWalletOptions(){
  walletOptionsList.innerHTML = walletOptions.map(w => `
    <li class="select-option${w.id===currentWallet.id?' active':''}" data-id="${w.id}">
      <span class="opt-icon">${w.icon}</span>
      <span>${w.label}</span>
    </li>
  `).join('');
}
function setWallet(w){
  currentWallet = w;
  walletLabelDisplay.textContent = w.label;
  walletIconDisplay.innerHTML = w.icon;
  renderWalletOptions();
}
function toggleWalletDropdown(open){
  const willOpen = open !== undefined ? open : !walletOptionsList.classList.contains('open');
  walletOptionsList.classList.toggle('open', willOpen);
  walletTrigger.classList.toggle('open', willOpen);
}
walletTrigger.addEventListener('click', (e)=>{ e.stopPropagation(); toggleWalletDropdown(); });
walletOptionsList.addEventListener('click', (e)=>{
  const li = e.target.closest('.select-option');
  if(!li) return;
  const w = walletOptions.find(o => o.id === li.dataset.id);
  if(w) setWallet(w);
  toggleWalletDropdown(false);
});
document.addEventListener('click', (e)=>{
  if(!document.getElementById('walletSelect').contains(e.target)) toggleWalletDropdown(false);
});

function updateToggleUI(){
  switchEl.classList.toggle('is-outcome', isOutcome);
  lblIncome.classList.toggle('active', !isOutcome);
  lblOutcome.classList.toggle('active', isOutcome);
  knob.textContent = isOutcome ? '↓' : '↑';
  previewBox.classList.remove('show');
  btnSubmit.classList.remove('ready');
}
switchEl.addEventListener('click', ()=>{ isOutcome = !isOutcome; updateToggleUI(); });

function ripple(btn, e){
  const r = document.createElement('span');
  r.className='ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.width = r.style.height = size+'px';
  r.style.left = (e.clientX - rect.left - size/2)+'px';
  r.style.top = (e.clientY - rect.top - size/2)+'px';
  btn.appendChild(r);
  setTimeout(()=>r.remove(),600);
}

btnPreview.addEventListener('click', (e)=>{
  ripple(btnPreview, e);
  const amt = parseFloat(amountEl.value);
  const src = sourceEl.value.trim();
  if(!amt || amt<=0){
    showToast('Amount राखिदिनुस् पहिले', false);
    previewBox.classList.remove('show');
    return;
  }
  const chosenDate = entryDateEl.value || new Date().toISOString().slice(0,10);
  previewBox.innerHTML = `
    <div><b>Type:</b> <span class="pv-amt ${isOutcome?'outcome':'income'}">${isOutcome?'Outcome':'Income'}</span></div>
    <div><b>Date:</b> ${formatDate(chosenDate)}</div>
    <div><b>Wallet:</b> ${currentWallet.label}</div>
    <div><b>Amount:</b> <span class="pv-amt ${isOutcome?'outcome':'income'}">Rs. ${amt.toFixed(2)}</span></div>
    <div><b>Source:</b> ${src || '—'}</div>
  `;
  previewBox.classList.add('show');
  btnSubmit.classList.add('ready');
});

/**
 * CONNECTED TO SHEET: Send rows to API
 */
async function saveToGoogleSheets(date, type, wallet, amount, source) {
  try {
    await fetch(GOOGLE_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, type, wallet, amount, source })
    });
    console.log("Sent successfully to Google Sheets!");
  } catch (error) {
    console.error("API Error saving:", error);
  }
}

/**
 * CONNECTED TO SHEET: Fetch existing database rows on App load
 */
async function fetchFromGoogleSheets() {
  try {
    const response = await fetch(GOOGLE_API_URL);
    const records = await response.json();
    
    if (records && records.length > 0) {
      entries = records.map(item => ({
        amt: parseFloat(item.amount),
        src: item.source || '—',
        outcome: item.type.toLowerCase() === 'expense' || item.type.toLowerCase() === 'outcome',
        wallet: item.wallet,
        date: item.date ? item.date.split("T")[0] : new Date().toISOString().slice(0,10)
      })).reverse(); // Reverse so newest shows at the top
      
      // Calculate active running balance directly from the sheet data
      balance = entries.reduce((acc, current) => acc + (current.outcome ? -current.amt : current.amt), 0);
      
      animateBalance();
      renderHistory();
      renderSummary();
      saveData();
    }
  } catch (error) {
    console.error("API Error fetching records:", error);
  }
}

btnSubmit.addEventListener('click', (e)=>{
  ripple(btnSubmit, e);
  const amt = parseFloat(amountEl.value);
  const src = sourceEl.value.trim() || '—';
  if(!amt || amt<=0){
    showToast('Amount राखिदिनुस् पहिले', false);
    return;
  }
  
  balance += isOutcome ? -amt : amt;
  animateBalance();
  const chosenDate = entryDateEl.value || new Date().toISOString().slice(0,10);
  const typeText = isOutcome ? 'Expense' : 'Income';

  // 1. Instant local visual update
  entries.unshift({amt, src: src, outcome:isOutcome, wallet: currentWallet.label, date: chosenDate});
  renderHistory();
  renderSummary();
  saveData();

  // 2. Transmit row parameters right to the Web App API
  saveToGoogleSheets(chosenDate, typeText, currentWallet.label, amt, src);

  showToast(`${isOutcome?'Outcome':'Income'} Rs. ${amt.toFixed(2)} added`, isOutcome);
  amountEl.value=''; sourceEl.value='';
  entryDateEl.value = new Date().toISOString().slice(0,10);
  previewBox.classList.remove('show');
  btnSubmit.classList.remove('ready');
  setTimeout(closeActiveSheet, 550);
});

function animateBalance(){
  let start = parseFloat(balanceAmt.dataset.val || '0');
  const end = balance;
  const dur = 500;
  const t0 = performance.now();
  function step(t){
    const p = Math.min(1, (t-t0)/dur);
    const val = start + (end-start)*p;
    balanceAmt.textContent = 'Rs. ' + val.toFixed(0);
    if(p<1) requestAnimationFrame(step);
    else balanceAmt.dataset.val = end;
  }
  requestAnimationFrame(step);
}
const CARD_COLORS = ['#e0912d','#2e9e74','#3a7bd5','#a05fd6','#d65f8c'];

function renderSummary(){
  let totalIncome = 0, totalOutcome = 0;
  const bySource = {};
  entries.forEach(en=>{
    if(en.outcome){
      totalOutcome += en.amt;
      bySource[en.src] = (bySource[en.src]||0) + en.amt;
    } else {
      totalIncome += en.amt;
    }
  });
  const saving = totalIncome - totalOutcome;
  sumIncome.textContent = 'Rs. ' + totalIncome.toFixed(0);
  sumOutcome.textContent = 'Rs. ' + totalOutcome.toFixed(0);
  savingPill.textContent = 'Saving Rs. ' + saving.toFixed(0);

  const sources = Object.entries(bySource).sort((a,b)=>b[1]-a[1]);
  if(sources.length===0){
    expenseScroll.innerHTML = '<div class="empty-note">Outcome entry थपेपछि देखिन्छ</div>';
    return;
  }
  expenseScroll.innerHTML = sources.slice(0,5).map(([name,amt], i)=>`
    <div class="exp-card" style="background:${CARD_COLORS[i % CARD_COLORS.length]}">
      <div class="exp-badge">${i+1}</div>
      <div>
        <div class="exp-name">${name}</div>
        <div class="exp-amt">Rs. ${amt.toFixed(0)}</div>
      </div>
    </div>
  `).join('');
}

function renderHistory(){
  if(entries.length===0){
    historyList.innerHTML = '<div class="empty-note">कुनै entry छैन अहिलेसम्म</div>';
    return;
  }
  const maxAmt = Math.max(...entries.slice(0,8).map(e=>e.amt), 1);
  historyList.innerHTML = entries.slice(0,8).map(en => `
    <div class="entry-row">
      <div class="entry-top">
        <span class="entry-name">${en.src}</span>
        <span class="entry-amt ${en.outcome?'outcome':'income'}">${en.outcome?'-':'+'} Rs. ${en.amt.toFixed(2)}</span>
      </div>
      <div class="entry-sub">${en.wallet}</div>
      <div class="bar-track"><div class="bar-fill ${en.outcome?'outcome':'income'}" style="width:${(en.amt/maxAmt*100).toFixed(0)}%"></div></div>
    </div>
  `).join('');
}

function showToast(msg, outcomeFlag){
  toastText.textContent = msg;
  toast.classList.toggle('outcome', !!outcomeFlag);
  toast.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>toast.classList.remove('show'), 2200);
}

function formatDate(iso){
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
}

function renderStatement(){
  if(entries.length===0){
    statementList.innerHTML = '<div class="empty-note">कुनै entry छैन अहिलेसम्म</div>';
    return;
  }
  const groups = {};
  entries.forEach(e => {
    if(!groups[e.date]) groups[e.date] = { items: [], inc: 0, out: 0 };
    groups[e.date].items.push(e);
    if(e.outcome) groups[e.date].out += e.amt;
    else groups[e.date].inc += e.amt;
  });
  
  const sortedDays = Object.keys(groups).sort((a,b)=>new Date(b)-new Date(a));
  statementList.innerHTML = sortedDays.map(day => `
    <div class="stmt-day">
      <div class="stmt-day-head">
        <span>${formatDate(day)}</span>
        <div class="stmt-day-totals">
          ${groups[day].inc>0 ? `<span class="income">+Rs.${groups[day].inc}</span>` : ''}
          ${groups[day].out>0 ? `<span class="outcome">-Rs.${groups[day].out}</span>` : ''}
        </div>
      </div>
      ${groups[day].items.map(item => `
        <div class="stmt-item">
          <span>${item.src} <small>(${item.wallet})</small></span>
          <span class="stmt-amt ${item.outcome?'outcome':'income'}">${item.outcome?'-':'+'}Rs.${item.amt}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

const goalChips = document.getElementById('goalTypeChips');
const customGoalField = document.getElementById('goalCustomNameField');
let selectedGoalType = 'House';

goalChips.addEventListener('click', (e)=>{
  const btn = e.target.closest('.chip');
  if(!btn) return;
  document.querySelectorAll('#goalTypeChips .chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  selectedGoalType = btn.dataset.type;
  customGoalField.style.display = selectedGoalType === 'Custom' ? 'block' : 'none';
});

document.getElementById('btnAddGoal').addEventListener('click', ()=>{
  const target = parseFloat(document.getElementById('goalTarget').value);
  let name = selectedGoalType;
  if(selectedGoalType === 'Custom'){
    name = document.getElementById('goalCustomName').value.trim() || 'Custom Goal';
  }
  if(!target || target<=0){
    showToast('Target amount राख्नुहोस्', false);
    return;
  }
  const icons = { House: '🏠', Marriage: '💍', Study: '🎓', Car: '🚗', Custom: '✏️' };
  goals.push({ id: Date.now(), name, target, type: selectedGoalType, icon: icons[selectedGoalType] || '🎯' });
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalCustomName').value = '';
  renderGoals();
  saveData();
  showToast('Goal created successfully!', false);
});

function renderGoals(){
  if(goals.length===0){
    goalsList.innerHTML = '<div class="empty-note">अहिलेसम्म कुनै goal छैन</div>';
    return;
  }
  goalsList.innerHTML = goals.map(g => {
    const progress = Math.min(100, Math.max(0, (balance / g.target) * 100));
    return `
      <div class="goal-card">
        <div class="goal-top">
          <span class="goal-icon">${g.icon}</span>
          <span class="goal-name">${g.name}</span>
          <span class="goal-amt">Rs. ${balance.toFixed(0)} / Rs. ${g.target}</span>
        </div>
        <div class="bar-track"><div class="bar-fill income" style="width: ${progress}%"></div></div>
      </div>
    `;
  }).join('');
}

window.addEventListener('DOMContentLoaded', ()=>{
  loadData();
  setWallet(walletOptions[0]);
  entryDateEl.value = new Date().toISOString().slice(0,10);
  
  // Try loading database live data on initialization
  fetchFromGoogleSheets();

  const hr = new Date().getHours();
  const greetText = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('greetTime').textContent = greetText;
});