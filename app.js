// Модули Firebase v10 - CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getDatabase, ref, onValue, set, update, push, remove } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Конфигурация - твоя
const firebaseConfig = {
  apiKey: "AIzaSyA62NZOIYoGmzyPbC4Av3u30s6cpoa5pIE",
  authDomain: "malaya-ac558.firebaseapp.com",
  databaseURL: "https://malaya-ac558-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "malaya-ac558",
  storageBucket: "malaya-ac558.firebasestorage.app",
  messagingSenderId: "188618372933",
  appId: "1:188618372933:web:72bfda1c7938267e94702c"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Элементы UI
const pairSetup = document.getElementById('pair-setup');
const roomInput = document.getElementById('room-input');
const joinRoomBtn = document.getElementById('join-room');
const genRoomBtn = document.getElementById('gen-room');
const roomBadge = document.getElementById('room-badge');
const changeRoomBtn = document.getElementById('change-room');

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
const settingsModal = document.getElementById('settings-modal');
const nameYou = document.getElementById('name-you');
const nameHer = document.getElementById('name-her');
const saveNamesBtn = document.getElementById('save-names');

const scoreSection = document.getElementById('score-section');

let ROOM = localStorage.getItem('pair_room') || '';
let unsubGoals = null;
let unsubScores = null;
let unsubNames = null;
let unsubHistory = null;

// Анонимный вход
signInAnonymously(auth).catch(console.error);
onAuthStateChanged(auth, (u) => {
  if (!u) return;
  init();
});

function init() {
  // Если код пары в URL-хеше - принять его
  const fromHash = (location.hash || '').replace('#', '').trim();
  if (fromHash && !ROOM) {
    ROOM = normalizeRoom(fromHash);
    localStorage.setItem('pair_room', ROOM);
  }

  if (!ROOM) {
    showPairSetup(true);
  } else {
    attachRoom(ROOM);
  }

  bindUI();
}

function normalizeRoom(s) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function showPairSetup(show) {
  pairSetup.classList.toggle('hidden', !show);
  scoreSection.classList.toggle('hidden', show);
  document.getElementById('history-card').classList.toggle('hidden', show);
  document.getElementById('open-add-goal').classList.toggle('hidden', show);
  document.getElementById('reset-scores').classList.toggle('hidden', show);
  document.getElementById('clear-completed').classList.toggle('hidden', show);
}

function attachRoom(room) {
  ROOM = normalizeRoom(room);
  localStorage.setItem('pair_room', ROOM);
  roomBadge.textContent = `Код пары: ${ROOM}`;
  roomBadge.classList.remove('hidden');
  showPairSetup(false);

  // Инициализируем структуру, если её нет
  const base = ref(db, `rooms/${ROOM}`);
  setIfMissing(`${ROOM}/points`, { you: 0, her: 0 });
  setIfMissing(`${ROOM}/names`, { you: 'Ты', her: 'Она' });

  // Подписки
  listenScores();
  listenGoals();
  listenNames();
  listenHistory();
}

async function setIfMissing(path, defaultValue) {
  const r = ref(db, path.startsWith('rooms/') ? path : `rooms/${path}`);
  // Очень компактно - одна запись при отсутствии onValue
  // Проверять существование точечно здесь не будем - слушатели все равно затащат текущее состояние
  update(r, defaultValue).catch(()=>{});
}

function bindUI() {
  // Смена/ввод комнаты
  joinRoomBtn?.addEventListener('click', () => {
    const v = normalizeRoom(roomInput.value);
    if (!v) return;
    attachRoom(v);
    location.hash = v;
  });
  genRoomBtn?.addEventListener('click', () => {
    const v = genCode();
    roomInput.value = v;
  });
  changeRoomBtn?.addEventListener('click', () => {
    showPairSetup(true);
    roomInput.value = ROOM;
  });

  // Кнопки дельт
  document.querySelectorAll('.btn-delta').forEach(btn => {
    btn.addEventListener('click', () => {
      const who = btn.dataset.target;
      const delta = parseInt(btn.dataset.delta, 10);
      addPoints(who, delta, `ручное ${delta > 0 ? '+' : ''}${delta}`);
    });
  });
  document.getElementById('apply-you')?.addEventListener('click', () => {
    const v = parseInt(document.getElementById('custom-you').value, 10);
    if (!isNaN(v) && v !== 0) addPoints('you', v, 'кастом');
    document.getElementById('custom-you').value = '';
  });
  document.getElementById('apply-her')?.addEventListener('click', () => {
    const v = parseInt(document.getElementById('custom-her').value, 10);
    if (!isNaN(v) && v !== 0) addPoints('her', v, 'кастом');
    document.getElementById('custom-her').value = '';
  });

  // Быстрый +1 в заголовке карточки
  document.querySelectorAll('.btn-add-point').forEach(btn => {
    btn.addEventListener('click', () => {
      addPoints(btn.dataset.target, 1, '+1');
    });
  });

  // Цели
  openAddGoalBtn?.addEventListener('click', () => {
    goalTitle.value = '';
    goalPoints.value = '';
    goalNote.value = '';
    goalModal.showModal();
  });
  saveGoalBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    createGoal();
    goalModal.close();
  });

  // Сброс и чистки
  resetScoresBtn?.addEventListener('click', () => confirmDialog('Точно сбросить баллы у обоих до 0?', () => resetScores()));
  clearCompletedBtn?.addEventListener('click', () => clearCompleted());
  clearHistoryBtn?.addEventListener('click', () => confirmDialog('Очистить историю?', () => clearHistory()));

  // Настройки имен
  openSettingsBtn?.addEventListener('click', () => {
    nameYou.value = document.querySelector('.md\\:grid-cols-2 > :first-child .text-slate-500')?.textContent || 'Ты';
    nameHer.value = document.querySelector('.md\\:grid-cols-2 > :last-child .text-slate-500')?.textContent || 'Она';
    settingsModal.showModal();
  });
  saveNamesBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    saveNames(nameYou.value.trim() || 'Ты', nameHer.value.trim() || 'Она');
    settingsModal.close();
  });
}

function genCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 7; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function listenScores() {
  if (!ROOM) return;
  const r = ref(db, `rooms/${ROOM}/points`);
  onValue(r, (snap) => {
    const v = snap.val() || { you: 0, her: 0 };
    scoreYou.textContent = v.you ?? 0;
    scoreHer.textContent = v.her ?? 0;
  });
}

function listenNames() {
  if (!ROOM) return;
  const r = ref(db, `rooms/${ROOM}/names`);
  onValue(r, (snap) => {
    const v = snap.val() || { you: 'Ты', her: 'Она' };
    const youLabel = document.querySelector('.md\\:grid-cols-2 > :first-child .text-slate-500');
    const herLabel = document.querySelector('.md\\:grid-cols-2 > :last-child .text-slate-500');
    if (youLabel) youLabel.textContent = v.you || 'Ты';
    if (herLabel) herLabel.textContent = v.her || 'Она';
  });
}

function listenGoals() {
  if (!ROOM) return;
  const r = ref(db, `rooms/${ROOM}/goals`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    renderGoals(data);
  });
}

function listenHistory() {
  if (!ROOM) return;
  const r = ref(db, `rooms/${ROOM}/history`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    renderHistory(data);
  });
}

function addPoints(who, delta, reason = '') {
  if (!ROOM) return;
  const pointsRef = ref(db, `rooms/${ROOM}/points`);
  // Транзакции нет в модульном импорте CDN удобной - делаем через onValue->update
  onValue(pointsRef, (snap) => {
    const cur = snap.val() || { you: 0, her: 0 };
    const next = { ...cur, [who]: (parseInt(cur[who] || 0, 10) + delta) };
    update(pointsRef, next);
  }, { onlyOnce: true });

  // История
  push(ref(db, `rooms/${ROOM}/history`), {
    t: Date.now(),
    type: 'delta',
    who,
    delta,
    reason
  });
}

function resetScores() {
  if (!ROOM) return;
  set(ref(db, `rooms/${ROOM}/points`), { you: 0, her: 0 });
  push(ref(db, `rooms/${ROOM}/history`), { t: Date.now(), type: 'reset' });
}

function createGoal() {
  if (!ROOM) return;
  const title = goalTitle.value.trim();
  const need = parseInt(goalPoints.value, 10) || 0;
  const note = goalNote.value.trim();
  const forWho = (document.querySelector('input[name="goal-for"]:checked')?.value) || 'you';
  if (!title || need < 1) return;

  const idRef = push(ref(db, `rooms/${ROOM}/goals`));
  const obj = {
    title, need, note, for: forWho,
    done: false,
    createdAt: Date.now()
  };
  set(idRef, obj);

  push(ref(db, `rooms/${ROOM}/history`), {
    t: Date.now(),
    type: 'goal-create',
    goal: obj.title,
    for: obj.for,
    need: obj.need
  });
}

function toggleGoal(id, current) {
  update(ref(db, `rooms/${ROOM}/goals/${id}`), { done: !current });
  push(ref(db, `rooms/${ROOM}/history`), {
    t: Date.now(),
    type: 'goal-toggle',
    goalId: id,
    to: !current
  });
}

function deleteGoal(id, title) {
  remove(ref(db, `rooms/${ROOM}/goals/${id}`));
  push(ref(db, `rooms/${ROOM}/history`), {
    t: Date.now(),
    type: 'goal-delete',
    goal:
