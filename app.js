import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

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
const storage = getStorage(app);

// Ссылки
const scoresRef = ref(db, 'scores');
const dataRef = ref(db, 'data');

// Инициализация
get(scoresRef).then(s => {
  if (!s.exists()) set(scoresRef, { my: 0, her: 0 });
});
get(dataRef).then(s => {
  if (!s.exists()) {
    set(dataRef, {
      title: "Мы",
      myName: "Ты", myEmoji: "Мужчина", myPhoto: "",
      herName: "Она", herEmoji: "Женщина", herPhoto: "",
      pinned: "Нажми, чтобы добавить надпись..."
    });
  }
});

// Загрузка данных
onValue(dataRef, (s) => {
  const d = s.val() || {};
  document.getElementById('title').textContent = d.title || "Мы";
  document.getElementById('myName').textContent = d.myName || "Ты";
  document.getElementById('myEmoji').textContent = d.myEmoji || "Мужчина";
  document.getElementById('herName').textContent = d.herName || "Она";
  document.getElementById('herEmoji').textContent = d.herEmoji || "Женщина";
  document.getElementById('pinnedMessage').textContent = d.pinned || "";

  if (d.myPhoto) {
    const img = document.getElementById('myImg');
    img.src = d.myPhoto;
    img.style.display = 'block';
    document.querySelector('#myAvatar .placeholder').style.display = 'none';
  }
  if (d.herPhoto) {
    const img = document.getElementById('herImg');
    img.src = d.herPhoto;
    img.style.display = 'block';
    document.querySelector('#herAvatar .placeholder').style.display = 'none';
  }
});

// Счёты
onValue(scoresRef, (s) => {
  const { my = 0, her = 0 } = s.val() || {};
  document.getElementById('myScore').textContent = my;
  document.getElementById('herScore').textContent = her;
  document.getElementById('myProgress').style.height = `${Math.min(100, my)}%`;
  document.getElementById('herProgress').style.height = `${Math.min(100, her)}%`;
});

// Сохранение текста
['title', 'myName', 'myEmoji', 'herName', 'herEmoji', 'pinnedMessage'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', () => {
    const key = id === 'pinnedMessage' ? 'pinned' : id;
    const updates = {}; updates[key] = el.textContent.trim();
    set(dataRef, { ...getCurrentData(), ...updates });
  });
});

// Фото
document.getElementById('myAvatar').addEventListener('click', () => document.getElementById('myPhoto').click());
document.getElementById('herAvatar').addEventListener('click', () => document.getElementById('herPhoto').click());

document.getElementById('myPhoto').addEventListener('change', e => uploadPhoto(e, 'myPhoto', 'myImg'));
document.getElementById('herPhoto').addEventListener('change', e => uploadPhoto(e, 'herPhoto', 'herImg'));

async function uploadPhoto(e, field, imgId) {
  const file = e.target.files[0];
  if (!file) return;
  const path = `photos/${Date.now()}_${file.name}`;
  const photoRef = storageRef(storage, path);
  await uploadBytes(photoRef, file);
  const url = await getDownloadURL(photoRef);
  document.getElementById(imgId).src = url;
  document.getElementById(imgId).style.display = 'block';
  document.querySelector(`#${imgId.replace('Img', 'Avatar')} .placeholder`).style.display = 'none';
  const updates = {}; updates[field] = url;
  set(dataRef, { ...getCurrentData(), ...updates });
}

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

// Кнопки
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

document.getElementById('reset').addEventListener('click', () => {
  set(scoresRef, { my: 0, her: 0 });
});
