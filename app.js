import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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
const db = getDatabase(app);

const scoresRef = ref(db, 'scores');
const dataRef = ref(db, 'data');
const goalsRef = ref(db, 'goals');

// Инициализация
get(scoresRef).then(s => !s.exists() && set(scoresRef, { my: 0, her: 0 }));
get(dataRef).then(s => !s.exists() && set(dataRef, {
  title: "Мы", myName: "Ты", myEmoji: "Мужчина",
  herName: "Она", herEmoji: "Женщина", pinned: "Нажми, чтобы добавить надпись..."
}));
get(goalsRef).then(s => !s.exists() && set(goalsRef, []));

// === РАНДОМ ФОТО ИЗ ПАПОК ===
const myPhotos = [
  'me/1.jpg', 'me/2.jpg', 'me/3.jpg', 'me/4.jpg', 'me/5.jpg'
  // ← Добавь свои фото сюда (или удали лишние)
];
const herPhotos = [
  'her/1.jpg', 'her/2.jpg', 'her/3.jpg', 'her/4.jpg', 'her/5.jpg'
  // ← Добавь её фото
];

function randomPhoto(paths) {
  if (paths.length === 0) return '';
  return paths[Math.floor(Math.random() * paths.length)];
}

// Показать рандомное фото при загрузке
window.addEventListener('load', () => {
  const myImg = document.getElementById('myImg');
  const herImg = document.getElementById('herImg');

  const mySrc = randomPhoto(myPhotos);
  const herSrc = randomPhoto(herPhotos);

  if (mySrc) {
    myImg.src = mySrc;
    myImg.style.display = 'block';
    document.querySelector('#myAvatar .placeholder').style.display = 'none';
  }

  if (herSrc) {
    herImg.src = herSrc;
    herImg.style.display = 'block';
    document.querySelector('#herAvatar .placeholder').style.display = 'none';
  }
});

// === ДАННЫЕ ===
onValue(dataRef, s => {
  const d = s.val() || {};
  ['title', 'myName', 'myEmoji', 'herName', 'herEmoji', 'pinnedMessage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = d[id] || (id === 'pinnedMessage' ? 'Нажми, чтобы добавить надпись...' : '');
  });
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
document.getElementById('myPoint').onclick = () => {
  get(scoresRef).then(s => {
    const { my = 0, her = 0 } = s.val() || {};
    set(scoresRef, { my: Math.min(100, my + 1), her });
  });
};

document.getElementById('herPoint').onclick = () => {
  get(scoresRef).then(s => {
    const { my = 0, her = 0 } = s.val() || {};
    set(scoresRef, { my, her: Math.min(100, her + 1) });
  });
};

document.getElementById('addGoal').onclick = () => {
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
};

document.getElementById('reset').onclick = () => set(scoresRef, { my: 0, her: 0 });
