// Firebase через CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getDatabase, ref, onValue, set, update, push, remove, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA62NZOIYoGmzyPbC4Av3u30s6cpoa5pIE",
  authDomain: "malaya-ac558.firebaseapp.com",
  databaseURL: "https://malaya-ac558-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "malaya-ac558",
  storageBucket: "malaya-ac558.firebasestorage.app",
  messagingSenderId: "188618372933",
  appId: "1:188618372933:web:72bfda1c7938267e94702c"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

try { signInAnonymously(getAuth(app)).catch(()=>{}); } catch {}

const root = (path) => ref(db, `rooms/default/${path}`);

const scoreYou = document.getElementById('score-you');
const scoreHer = document.getElementById('score-her');
const goalsList = document.getElementById('goals-list');
const historyList = document.getElementById('history');

const openAddGoalBtn = document.getElementById('open-add-goal');
const goalModal = document.getElementById('goal-modal');
const goalTitle = document.getElementById('goal-title');
const goalPoints = document.getElementById('goal-points');
const goalNote = document.getElementById('goal-note');
const saveGoalBtn = document.getElementById('save-goal');

const resetScoresBtn = document.getElementById('reset-scores');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearHistoryBtn = document.getElementById('clear-history');

const openSettingsBtn = document.getElementById('open-settings');
const settingsModal  = document.getElementById('settings-modal');
const nameYou = document.getElementById('name-you');
const nameHer = document.getElementById('name-her');
const saveNamesBtn = document.getElementById('save-names');

awaitEnsure("points", { you: 0, her: 0 });
awaitEnsure("names",  { you: "Ты", her: "Она" });

onValue(root("points"), (s) => {
  const v = s.val() || { you:0, her:0 };
  scoreYou.textContent = v.you ?? 0;
  scoreHer.textContent = v.her ?? 0;
});

onValue(root("names"), (s) => {
  const v = s.val() || { you:"Ты", her:"Она" };
  document.getElementById('label-you').textContent = v.you || "Ты";
  document.getElementById('label-her').textContent = v.her || "Она";
});

onValue(root("goals"), (s) => renderGoals(s.val() || {}));
onValue(root("history"), (s) => renderHistory(s.val() || {}));

document.querySelectorAll('.btn-delta').forEach(btn => {
  btn.addEventListener('click', () => {
    const who = btn.dataset.target;
    const delta = parseInt(btn.dataset.delta, 10);
    addPoints(who, delta, `ручное ${delta>0?'+':''}${delta}`);
  });
});
document.querySelectorAll('.btn-add-point').forEach(btn => {
  btn.addEventListener('click', () => addPoints(btn.dataset.target, 1, '+1'));
});
document.getElementById('apply-you').addEventListener('click', () => {
  const v = parseInt(document.getElementById('custom-you').value, 10);
  if (!isNaN(v) && v !== 0) addPoints('you', v, 'кастом');
  document.getElementById('custom-you').value = '';
});
document.getElementById('apply-her').addEventListener('click', () => {
  const v = parseInt(document.getElementById('custom-her').value, 10);
  if (!isNaN(v) && v !== 0) addPoints('her', v, 'кастом');
  document.getElementById('custom-her').value = '';
});

openAddGoalBtn.addEventListener('click', () => {
  goalTitle.value = ''; goalPoints.value=''; goalNote.value='';
  goalModal.showModal();
});
saveGoalBtn.addEventListener('click', (e) => {
  e.preventDefault(); createGoal(); goalModal.close();
});

resetScoresBtn.addEventListener('click', () => confirmDialog('Точно сбросить баллы у обоих до 0?', resetScores));
clearCompletedBtn.addEventListener('click', clearCompleted);
clearHistoryBtn.addEventListener('click', () => confirmDialog('Очистить историю?', clearHistory));

openSettingsBtn.addEventListener('click', () => {
  nameYou.value = document.getElementById('label-you').textContent || 'Ты';
  nameHer.value = document.getElementById('label-her').textContent || 'Она';
  settingsModal.showModal();
});
saveNamesBtn.addEventListener('click', (e) => {
  e.preventDefault(); saveNames(nameYou.value.trim()||'Ты', nameHer.value.trim()||'Она'); settingsModal.close();
});

async function awaitEnsure(path, defaults){
  const r = root(path);
  try {
    const snap = await get(r);
    if (!snap.exists()) await set(r, defaults);
  } catch (e) {
    // если нет прав - просто не трогаем
  }
}

function addPoints(who, delta, reason=''){
  onValue(root("points"), (snap)=>{
    const cur = snap.val() || { you:0, her:0 };
    const next = { ...cur, [who]: (parseInt(cur[who]||0,10) + delta) };
    update(root("points"), next);
  }, { onlyOnce: true });

  push(root("history"), { t: Date.now(), type:'delta', who, delta, reason });
}

function resetScores(){
  set(root("points"), { you:0, her:0 });
  push(root("history"), { t: Date.now(), type:'reset' });
}

function createGoal(){
  const title = goalTitle.value.trim();
  const need  = parseInt(goalPoints.value,10) || 0;
  const note  = goalNote.value.trim();
  const forWho = (document.querySelector('input[name="goal-for"]:checked')?.value) || 'you';
  if (!title || need<1) return;

  const idRef = push(root("goals"));
  const obj = { title, need, note, for: forWho, done:false, createdAt: Date.now() };
  set(idRef, obj);
  push(root("history"), { t: Date.now(), type:'goal-create', goal: obj.title, for: obj.for, need: obj.need });
}

function toggleGoal(id, current){
  update(root(`goals/${id}`), { done: !current });
  push(root("history"), { t: Date.now(), type:'goal-toggle', goalId:id, to:!current });
}

function deleteGoal(id, title){
  remove(root(`goals/${id}`));
  push(root("history"), { t: Date.now(), type:'goal-delete', goal:title });
}

function clearCompleted(){
  onValue(root("goals"), (snap)=>{
    const data = snap.val() || {};
    Object.entries(data).forEach(([id,g]) => { if (g.done) remove(root(`goals/${id}`)); });
  }, { onlyOnce:true });
}

function clearHistory(){ set(root("history"), null); }
function saveNames(you, her){ update(root("names"), { you, her }); }

function renderGoals(data){
  goalsList.innerHTML = '';
  const items = Object.entries(data).sort((a,b)=> (a[1].done===b[1].done)? (b[1].createdAt-a[1].createdAt) : (a[1].done-b[1].done));
  if (!items.length){
    goalsList.innerHTML = `<div class="bg-white rounded-2xl shadow-soft p-6 text-slate-500">Пока нет целей - добавь первую.</div>`;
    return;
  }
  for (const [id,g] of items){
    const row = document.createElement('div');
    row.className = `bg-white rounded-2xl shadow-soft p-4 flex items-start gap-4 ${g.done?'opacity-60':''}`;

    const badge = document.createElement('div');
    badge.className = `px-2 py-1 text-xs rounded-lg ${g.for==='you'?'bg-sky-100 text-sky-700':'bg-violet-100 text-violet-700'}`;
    badge.textContent = g.for==='you'?'для тебя':'для неё';

    const title = document.createElement('div');
    title.className = 'font-medium'; title.textContent = g.title;

    const meta = document.createElement('div');
    meta.className = 'text-sm text-slate-600';
    meta.textContent = `нужно: ${g.need}${g.note? ' · '+g.note:''}`;

    const left = document.createElement('div');
    left.className = 'flex-1';
    left.append(badge, document.createElement('div'), title, meta);

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2';

    const doneBtn = document.createElement('button');
    doneBtn.className = `px-3 py-2 rounded-xl border ${g.done?'border-slate-300':'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`;
    doneBtn.textContent = g.done?'Вернуть в работу':'Отметить выполненной';
    doneBtn.addEventListener('click', ()=>toggleGoal(id, g.done));

    const delBtn = document.createElement('button');
    delBtn.className = 'px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', ()=>confirmDialog(`Удалить цель «${g.title}»?`, ()=>deleteGoal(id,g.title)));

    actions.append(doneBtn, delBtn);
    row.append(left, actions);
    goalsList.append(row);
  }
}

function renderHistory(data){
  historyList.innerHTML = '';
  const items = Object.entries(data).sort((a,b)=> a[1].t - b[1].t);
  for (const [,h] of items){
    const row = document.createElement('div');
    const d = new Date(h.t || Date.now());
    const when = d.toLocaleString();
    let text = '';
    if (h.type==='delta')      text = `${when}: ${(h.who==='you'?'ты':'она')} ${h.delta>0?'+':''}${h.delta}${h.reason? ' ('+h.reason+')':''}`;
    else if (h.type==='reset') text = `${when}: сброс баллов`;
    else if (h.type==='goal-create') text = `${when}: добавлена цель «${h.goal}» для ${h.for==='you'?'тебя':'нее'} на ${h.need}`;
    else if (h.type==='goal-toggle')  text = `${when}: цель отмечена ${h.to?'выполненной':'активной'}`;
    else if (h.type==='goal-delete')  text = `${when}: удалена цель «${h.goal}»`;
    row.textContent = text;
    historyList.append(row);
  }
}

function confirmDialog(message, onOk){
  const d = document.createElement('dialog');
  d.className = 'rounded-2xl p-0 w-full max-w-sm backdrop:bg-black/40';
  d.innerHTML = `
    <form method="dialog" class="bg-white rounded-2xl p-6">
      <div class="text-slate-800 font-medium mb-4">${escapeHtml(message)}</div>
      <div class="flex justify-end gap-2">
        <button value="cancel" class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100">Отмена</button>
        <button id="ok" class="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600">Ок</button>
      </div>
    </form>`;
  document.body.appendChild(d);
  d.showModal();
  d.querySelector('#ok').addEventListener('click', (e)=>{ e.preventDefault(); d.close(); onOk?.(); setTimeout(()=>d.remove(), 100); });
  d.addEventListener('close', ()=> setTimeout(()=>d.remove(), 100));
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
