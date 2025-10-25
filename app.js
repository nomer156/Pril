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
const positionRef = ref(db, 'position');

get(positionRef).then((snapshot) => {
  if (!snapshot.exists()) set(positionRef, 0);
});

onValue(positionRef, (snapshot) => {
  const position = snapshot.val() || 0;
  updateUI(position);
});

function updateUI(position) {
  document.getElementById('score').textContent = position;
  const heart = document.getElementById('heart');
  const fillHer = document.getElementById('fillHer');
  const fillMe = document.getElementById('fillMe');

  const heartPercent = ((position + 100) / 200) * 100;
  heart.style.top = `${heartPercent}%`;

  const herHeight = Math.min(100, (position + 100) / 2);
  const meHeight = Math.min(100, 100 - herHeight);

  fillHer.style.height = `${herHeight}%`;
  fillMe.style.height = `${meHeight}%`;
}

document.getElementById('myPoint').addEventListener('click', () => {
  get(positionRef).then((snapshot) => {
    const current = snapshot.val() || 0;
    set(positionRef, Math.max(-100, current - 1));
  });
});

document.getElementById('herPoint').addEventListener('click', () => {
  get(positionRef).then((snapshot) => {
    const current = snapshot.val() || 0;
    set(positionRef, Math.min(100, current + 1));
  });
});

document.getElementById('reset').addEventListener('click', () => {
  set(positionRef, 0);
});
