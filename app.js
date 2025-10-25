import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA62NZOIYoGmzyPbC4Av3u30s6cpoa5pIE",
  authDomain: "malaya-ac558.firebaseapp.com",
  databaseURL: "https://malaya-ac558-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "malaya-ac558",
  messagingSenderId: "188618372933",
  appId: "1:188618372933:web:72bfda1c7938267e94702c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const scoresRef = ref(db, 'scores');
const dataRef = ref(db, 'data');
const goalsRef = ref(db, 'goals');

// Инициализация
get(scoresRef).then(s => !s.exists() && set(scoresRef, { my: 0, her: 0 }));
get(dataRef).then(s => !s.exists() && set(dataRef, {
  title: "Мы", myName: "Ты", myEmoji: "👨",
  herName: "Она", herEmoji: "👩", pinned: "Нажми, чтобы добавить надпись..."
}));
get(goalsRef).then(s => !s.exists() && set(goalsRef, []));

// === РАНДОМ ФОТО ИЗ ПАПОК (АВТО) ===
function loadRandomPhotos() {
  // Список возможных фото (код сам найдёт все в папках, если сервер отдаёт directory listing)
  const basePath = window.location.origin + window.location.pathname;
  fetch(basePath + 'me/').then(r => r.text()).then(text => {
    const links = text.match(/href="([^"]*\.(jpg|jpeg|png|webp))"/gi) || [];
    const myPhotos = links.map(l => l.replace(/href="|"/g, '')).filter(p => p.startsWith('me/'));
    if (myPhotos.length > 0) {
      const randomMy = myPhotos[Math.floor(Math.random() * myPhotos.length)];
      document.getElementById('myImg').src = randomMy;
      document.getElementById('myImg').style.display = 'block';
      document.querySelector('#myAvatar .placeholder').style.display = 'none';
    }
  }).catch(() => {}); // Игнор ошибок

  fetch(basePath + 'her/').then(r => r.text()).then(text => {
    const links = text.match(/href="([^"]*\.(jpg|jpeg|png|webp))"/gi) || [];
    const herPhotos = links.map(l => l.replace(/href="|"/g, '')).filter(p => p.startsWith('her/'));
    if (herPhotos.length > 0) {
      const randomHer = herPhotos[Math.floor(Math.random() * herPhotos.length)];
      document.getElementById('herImg').src = randomHer;
      document.getElementById('herImg').style.display = 'block';
      document.querySelector('#herAvatar .placeholder').style.display = 'none';
    }
  }).catch(() => {});
}

window.addEventListener('load', loadRandomPhotos);

// === ДАННЫЕ ===
onValue(dataRef, s => {
  const d = s.val() || {};
  document.getElementById('title').textContent = d.title || "Мы";
  document.getElementById('myName').textContent = d.myName || "Ты";
  document.getElementById('myEmoji').textContent = d.myEmoji || "👨";
  document.getElementById('herName').textContent = d.herName || "Она";
  document.getElementById('herEmoji').textContent = d.herEmoji || "👩";
  document.getElementById('pinnedMessage').textContent = d.pinned || "Нажми, чтобы добавить надпись...";
});

// === СЧЁТ ===
onValue(scoresRef, s => {
  const { my = 0, her = 0 } = s.val() || {};
  document.getElementById('myScore').textContent = my;
  document.getElementById('herScore').textContent = her;
  document.getElementById('myProgress').style.height = `${Math.min(100, my)}%`;
  document.getElementById('herProgress').style.height = `${Math.min(100, her)}%`;
});

// === ЦЕЛИ ===
onValue(goalsRef, s => {
  const goals = s.val() || [];
  document.getElementById('myGoals').innerHTML = '';
  document.getElementById('herGoals').innerHTML = '';
  goals.forEach(g => {
    const el = document.createElement('div');
    el.className = 'goal';
    el.textContent = g.text;
    el.style.bottom = `${g.score}%`;
    document.getElementById(g.isHer ? 'herGoals' : 'myGoals').appendChild(el);
  });
});

// === СОХРАНЕНИЕ ТЕКСТА ===
['title', 'myName', 'myEmoji', 'herName', 'herEmoji', 'pinnedMessage'].forEach(id => {
  const el = document.getElementById(id);
  el?.addEventListener('blur', () => {
    const key = id === 'pinnedMessage' ? 'pinned' : id;
    const updates = {}; updates[key] = el.textContent.trim();
    set(dataRef, { ...getCurrentData(), ...updates });
  });
});

function getCurrentData() {
  return {
    title: document.getElementById('title').textContent,
    myName: document.getElementById('myName').textContent,
    myEmoji: document.getElementById('myEmoji').textContent,
    herName: document.getElementById('herName').textContent,
    herEmoji: document.getElementById('herEmoji').textContent,
    pinned: document.getElementById('pinnedMessage').textContent
  };
}

// === КНОПКИ ===
document.getElementById('myPoint').addEventListener('click', () => {
  get(scoresRef).then(s => {
    const { my = 0, her = 0 } = s.val() || {};
    set(scoresRef, { my: Math.min(100, my + 1), her });
  });
});

document.getElementById('herPoint').addEventListener('click', () => {
  get(scoresRef).then(s => {
    const { my = 0, her = 0 } = s.val() || {};
    set(scoresRef, { my, her: Math.min(100, her + 1) });
  });
});

document.getElementById('addGoal').addEventListener('click', () => {
  const score = prompt("На каком счёте? (0–100)", "40");
  const text = prompt("Что обещал(а)?", "с меня роллы");
  const isHer = confirm("Это для неё? (ОК = да, Отмена = тебе)");
  if (score && text) {
    get(goalsRef).then(s => {
      const goals = s.val() || [];
      goals.push({ score: parseInt(score), text, isHer });
      set(goalsRef, goals);
    });
  }
});

document.getElementById('reset').addEventListener('click', () => set(scoresRef, { my: 0, her: 0 }));
