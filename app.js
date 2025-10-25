import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get, push } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
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
const positionRef = ref(db, 'position');
const dataRef = ref(db, 'data');

// Инициализация
get(dataRef).then(s => {
  if (!s.exists()) {
    set(dataRef, {
      title: "Мы",
      myName: "Ты", myEmoji: "Мужчина", myPhoto: "",
      herName: "Она", herEmoji: "Женщина", herPhoto: "",
      pinned: "Нажми, чтобы добавить надпись..."
    });
  }
  set(positionRef, 0);
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

  if (d.myPhoto) { document.getElementById('myImg').src = d.myPhoto; document.getElementById('myImg').style.display = 'block'; document.querySelector('#myAvatar .placeholder').style.display = 'none'; }
  if (d.herPhoto) { document.getElementById('herImg').src = d.herPhoto; document.getElementById('herImg').style.display = 'block'; document.querySelector('#herAvatar .placeholder').style.display = 'none'; }
});

onValue(positionRef, (s) => {
  const pos = s.val() || 0;
  updateUI(pos);
});

// Сохранение при изменении
['title', 'myName', 'myEmoji', 'herName', 'herEmoji', 'pinnedMessage'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', () => {
    const updates = {};
    updates[id === 'pinnedMessage' ? 'pinned' : id] = el.textContent.trim();
    set(dataRef, { ...getCurrentData(), ...updates });
  });
});

// Фото
document.getElementById('myAvatar').addEventListener('click', () => document.getElementById('myPhoto').click());
document.getElementById('herAvatar').addEventListener('click', () => document.getElementById('herPhoto').click());

document.getElementById('myPhoto').addEventListener('change', (e) => uploadPhoto(e, 'myPhoto', 'myImg'));
document.getElementById('herPhoto').addEventListener('change', (e) => uploadPhoto(e, 'herPhoto', 'herImg'));

async function uploadPhoto(e, field, imgId) {
  const file = e.target.files[0];
  if (!file) return;
  const storagePath = `photos/${Date.now()}_${file.name}`;
  const photoRef = storageRef(storage, storagePath);
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

// Прогресс
function updateUI(position) {
  document.getElementById('score').textContent = position;
  const heart = document.getElementById('heart');
  const fillHer = document.getElementById('fillHer');
  const fillMe = document.getElementById('fillMe');
  const percent = ((position + 100) / 200) * 100;
  heart.style.top = `${percent}%`;
  const herH = Math.min(100, (position + 100) / 2);
  fillHer.style.height = `${herH}%`;
  fillMe.style.height = `${100 - herH}%`;
}

// Кнопки
document.getElementById('myPoint').addEventListener('click', () => {
  get(positionRef).then(s => set(positionRef, Math.max(-100, (s.val() || 0) - 1)));
});
document.getElementById('herPoint').addEventListener('click', () => {
  get(positionRef).then(s => set(positionRef, Math.min(100, (s.val() || 0) + 1)));
});
document.getElementById('reset').addEventListener('click', () => set(positionRef, 0));
