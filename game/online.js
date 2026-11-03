// Jimitri Hub online layer: makes the "LEVELS" list a shared, server-backed list and adds accounts.
// Loaded as a module AFTER the game, so it only overrides two storage functions. Game code is untouched.
import { firebaseConfig } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, deleteDoc, getDocs, query, where, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = initializeApp(firebaseConfig), auth = getAuth(app), fs = getFirestore(app);
const toEmail = u => u.trim().toLowerCase() + '@jimitridemonlist.invalid'; // same hidden-email trick as the Hub
let SERVER = [], CACHE = [], NAME = '';
const logged = () => !!(auth.currentUser && NAME);
const say = m => { try { toast(m); } catch (e) { alert(m); } };
const refresh = () => { if (typeof state !== 'undefined' && state === 'online') buildUploadList(); };

/* ---- live shared level list ---- */
onSnapshot(collection(fs, 'uploads'), snap => {
  const a = [];
  snap.forEach(d => { const x = d.data(), lv = decodeLevel(x.code);
    if (lv) a.push({ id: d.id, name: x.name, d: packLevel(lv), date: x.date || 0, author: x.author || '', uid: x.uid }); });
  a.sort((p, q) => q.date - p.date); SERVER = a; CACHE = a; refresh();
}, e => say('Online levels: ' + e.message));

/* ---- replace the game's local storage functions ---- */
window.getUploads = () => CACHE;
window.setUploads = async next => {
  const have = new Set(CACHE.map(x => x.id)), want = new Set(next.map(x => x.id));
  const add = next.filter(x => !have.has(x.id)), del = CACHE.filter(x => !want.has(x.id));
  if (!add.length && !del.length) return;
  if (!logged()) { say('Log in with the ACCOUNT button to upload or delete levels.'); openAcct(); refresh(); return; }
  CACHE = next; refresh();
  try {
    for (const x of add) await addDoc(collection(fs, 'uploads'), { name: String(x.name).slice(0, 30), code: levelCode(unpackLevel(x.d)), uid: auth.currentUser.uid, author: NAME, date: Date.now() });
    for (const x of del) await deleteDoc(doc(fs, 'uploads', x.id));
  } catch (e) {
    CACHE = SERVER; refresh();
    say(e.code === 'permission-denied' ? 'Not allowed: you can only delete your own levels, and banned accounts cannot upload.' : e.message);
  }
};
// the game announces "Uploaded!"/"Imported" right away; hide that when the server will refuse
const _toast = window.toast;
window.toast = m => { if (!logged() && /^(Uploaded!|Imported ")/.test(String(m))) return; _toast(m); };

/* ---- account UI ---- */
const st = document.createElement('style');
st.textContent = `#jdacct{position:fixed;left:12px;bottom:12px;z-index:30;border:3px solid rgba(0,0,0,.5);border-radius:12px;padding:8px 12px;
  background:linear-gradient(180deg,#5fb6ff,#2d6fd0);color:#fff;font:900 12px Arial;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.45)}
 #jdbox{position:fixed;inset:0;z-index:40;background:#000a;display:none;align-items:center;justify-content:center;font-family:Arial}
 #jdbox .p{background:#14141f;border:2px solid #5fb6ff;border-radius:12px;padding:18px;width:min(320px,90vw);color:#fff}
 #jdbox input{width:100%;margin:4px 0 10px;padding:8px;border-radius:6px;border:1px solid #446;background:#000;color:#fff;box-sizing:border-box}
 #jdbox button{margin:0 6px 6px 0;padding:8px 12px;border:0;border-radius:6px;background:#2e9e3a;color:#fff;font-weight:900;cursor:pointer}
 #jdbox button.g{background:#334}#jdmsg{color:#f99;font-size:12px;min-height:16px}`;
document.head.appendChild(st);
const btn = document.createElement('button'); btn.id = 'jdacct'; btn.textContent = 'ACCOUNT';
const box = document.createElement('div'); box.id = 'jdbox';
document.body.append(btn, box);
for (const t of ['pointerdown', 'pointerup', 'keydown', 'keyup', 'keypress']) box.addEventListener(t, e => e.stopPropagation()); // keep typing/clicks away from the game
btn.addEventListener('click', e => { e.stopPropagation(); openAcct(); });

let mode = 'login';
function openAcct() {
  if (logged()) { if (confirm('Log out of ' + NAME + '?')) signOut(auth); return; }
  box.innerHTML = `<div class="p"><b>Jimitri Hub account</b><p style="font-size:12px;opacity:.8">Same account as the website. Needed to upload levels.</p>
    <button class="g" id="jdm1">Log in</button><button class="g" id="jdm2">Sign up</button>
    <input id="jdu" placeholder="Username" autocomplete="username"><input id="jdp" type="password" placeholder="Password (6+ characters)" autocomplete="current-password">
    <div id="jdmsg"></div><button id="jdgo">Log in</button><button class="g" id="jdx">Close</button></div>`;
  box.style.display = 'flex'; mode = 'login';
  const set = m => { mode = m; document.getElementById('jdgo').textContent = m === 'login' ? 'Log in' : 'Sign up'; };
  document.getElementById('jdm1').onclick = () => set('login'); document.getElementById('jdm2').onclick = () => set('signup');
  document.getElementById('jdx').onclick = () => box.style.display = 'none';
  document.getElementById('jdgo').onclick = async () => {
    const n = document.getElementById('jdu').value.trim(), p = document.getElementById('jdp').value, err = m => document.getElementById('jdmsg').textContent = m;
    try {
      if (mode === 'signup') {
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(n)) return err('Username: 3-20 letters, numbers or _.');
        if (p.length < 6) return err('Password must be at least 6 characters.');
        if (!(await getDocs(query(collection(fs, 'users'), where('username', '==', n)))).empty) return err('That username is taken.');
        const c = await createUserWithEmailAndPassword(auth, toEmail(n), p);
        await setDoc(doc(fs, 'users', c.user.uid), { username: n, banned: false, created: serverTimestamp() });
      } else await signInWithEmailAndPassword(auth, toEmail(n), p);
      box.style.display = 'none';
    } catch (e) { err(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(e.code) ? 'Wrong username or password.' : e.code === 'auth/email-already-in-use' ? 'That username is taken.' : e.message); }
  };
}
onAuthStateChanged(auth, async u => {
  NAME = '';
  if (u) { try { const d = await getDoc(doc(fs, 'users', u.uid)); NAME = d.exists() ? d.data().username : ''; } catch (e) {} }
  btn.textContent = NAME ? NAME.toUpperCase() : 'ACCOUNT';
});
