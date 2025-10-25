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
  title: "Мы", myName: "Ты", myEmoji: "Мужчина",
  herName: "Она", herEmoji: "Женщина", pinned: "Нажми, чтобы добавить надпись..."
}));
get(goalsRef).then(s => !s.exists() && set(goalsRef, []));

// === АВТО-РАНДОМ ИЗ ПАПОК me/ и her/ ===
async function loadRandomPhoto() {
  try {
    const base = window.location.href.split('/').slice(0, -1).join('/');
    
    // Получаем список всех файлов в папке
    const response = await fetch(`${base}/me/`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'))
      .map(a => a.getAttribute('href'))
      .filter(href => href && (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png') || href.endsWith('.webp')))
      .map(href => href.startsWith('/') ? href.slice(1) : `me/${href}`);

    const myPhotos = links.length > 0 ? links : ['me/default.jpg'];
    const myRandom = myPhotos[Math.floor(Math.random() * myPhotos.length)];

    const herResponse = await fetch(`${base}/her/`);
    const herText = await herResponse.text();
    const herDoc = parser.parseFromString(herText, 'text/html');
    const herLinks = Array.from(herDoc.querySelectorAll('a'))
      .map(a => a.getAttribute('href'))
      .filter(href => href && (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png') || href.endsWith('.webp')))
      .map(href => href.startsWith('/') ? href.slice(1) : `her/${href}`);

    const herPhotos = herLinks.length > 0 ? herLinks : ['her/default.jpg'];
    const herRandom = herPhotos[Math.floor(Math.random() * herPhotos.length)];

    // Показать
    const myImg = document.getElementById('myImg');
    myImg.src = myRandom;
    myImg.style.display = 'block';
    document.querySelector('#myAvatar .placeholder').style.display = 'none';

    const herImg = document.getElementById('herImg');
    herImg.src = herRandom;
    herImg.style.display = 'block';
    document.querySelector('#herAvatar .placeholder').style.display = 'none';

  } catch (e) {
    console.log("Фото не найдены, используем заглушки");
  }
}

// Загрузка фото при старте
window.addEventListener('load', loadRandomPhoto);

// === ДАННЫЕ ===
 OnValue(dataRef, s => {
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

// === СОХРАНЕНИЕ ===
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
