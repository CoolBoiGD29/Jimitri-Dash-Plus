"use strict";
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const $ = function(id){ return document.getElementById(id); };
const mainEl=$('mainmenu'), levelsEl=$('levelsscr'), onlineEl=$('onlinescr'),
      editorEl=$('editorui'), pauseEl=$('pausescr'), winEl=$('winscr'),
      muteBtn=$('mute'), pauseBtn=$('pausebtn'), lvlList=$('levels'),
      upList=$('uplist'), toastEl=$('toast'),
      myEl=$('mylevelsscr'), myList=$('mylist'),
      detailEl=$('detailscr'), iconsEl=$('iconscr'), iconTabs=$('icontabs'),
      iconGrid=$('icongrid'), edStopBtn=$('edstop');

const ICON_MODES = ['cube','ship','ball','ufo','wave','robot','spider'];
const ICON_LABELS = {cube:'CUBE', ship:'SHIP', ball:'BALL', ufo:'UFO', wave:'WAVE', robot:'ROBOT', spider:'SPIDER', col:'COLORS'};
const ICON_N = 30;
const ICON_COLS=['#52e85c','#7dff3a','#c8ff2e','#ffe14d','#ffb340','#ff7a2f','#ff5050','#ff2e7a','#ff6f9d','#f05cff',
  '#b47cff','#7a5cff','#4f6bff','#4fc3ff','#2ee6ff','#44f0d2','#2eb87a','#1f8a3c','#ffffff','#c9ced8',
  '#8a93a6','#4a5266','#1a1d26','#000000','#8b5a2b','#d9a066','#ffd6a5','#ffb3c7','#b3e5ff','#d8ffb3'];
let iconMode = 'cube';
let selectedIcons = loadIcons();
function loadIcons(){
  const base={cube:0, ship:0, ball:0, ufo:0, wave:0, robot:0, spider:0, c1:0, c2:13, glow:0};
  try{
    const saved=JSON.parse(localStorage.getItem('jd_icons')||'{}');
    ICON_MODES.forEach(function(m){ if(saved[m]!=null) base[m]=Math.max(0, Math.min(ICON_N-1, saved[m]|0)); });
    if(saved.c1!=null) base.c1=Math.max(0, Math.min(ICON_COLS.length-1, saved.c1|0));
    if(saved.c2!=null) base.c2=Math.max(0, Math.min(ICON_COLS.length-1, saved.c2|0));
    base.glow=saved.glow?1:0;
  }catch(e){}
  return base;
}
function saveIcons(){
  try{ localStorage.setItem('jd_icons', JSON.stringify(selectedIcons)); }catch(e){}
}

// ---------- world + camera ----------
const B=60, groundY=900, CEIL_BLOCKS=9, MINI_S=0.6;
const SPEED=0.158*B, GRAV=0.0205*B, JUMPV=0.31*B, ROTS=Math.PI/(2*JUMPV/GRAV);
const ROBOT_V=0.192*B, ROBOT_FR=14;
let SW=0, SH=0, W=0, H=0, dpr=1, Z=1, VT=0, cullPad=0;
function ceilingY(){ return groundY - CEIL_BLOCKS*B; }
function resize(){
  dpr = window.devicePixelRatio || 1;
  SW = window.innerWidth; SH = window.innerHeight;
  cv.width = Math.round(SW*dpr); cv.height = Math.round(SH*dpr);
  cv.style.width = SW+'px'; cv.style.height = SH+'px';
}
function setView(blocks, top){ Z=SH/(blocks*B); W=SW/Z; H=SH/Z; VT=top; }
function applyView(){ ctx.setTransform(dpr*Z,0,0,dpr*Z,0,-VT*Z*dpr); }
function hudView(){ ctx.setTransform(dpr,0,0,dpr,0,0); }
const OPT=(function(){
  const o={cam:13, vol:0.6, hit:0, dec:0, acp:1};
  try{
    const s=JSON.parse(localStorage.getItem('jd_opts')||'{}');
    if(s.cam) o.cam=Math.max(9,Math.min(30,+s.cam||13));
    if(s.vol!=null) o.vol=Math.max(0,Math.min(1,+s.vol||0));
    if(s.hit!=null) o.hit=s.hit?1:0;
    if(s.dec!=null) o.dec=s.dec?1:0;
    if(s.acp!=null) o.acp=s.acp?1:0;
  }catch(e){}
  return o;
})();
function saveOpt(){ try{ localStorage.setItem('jd_opts', JSON.stringify(OPT)); }catch(e){} }

// ---------- keybinds ----------
const KEY_ACTS=[
  ['jump','JUMP / CLICK','play',['Space','ArrowUp','KeyW']],
  ['restart','RESTART','play',['KeyR']],
  ['practice','PRACTICE ON / OFF','play',['KeyP']],
  ['cpadd','PLACE CHECKPOINT','play',['KeyZ']],
  ['cpdel','REMOVE CHECKPOINT','play',['KeyX']],
  ['pause','PAUSE','play',['Escape']],
  ['mute','MUTE','play',['KeyM']],
  ['hitbox','SHOW HITBOXES','play',['KeyH']],
  ['ebuild','BUILD MODE','editor',['Digit1']],
  ['eedit','EDIT MODE','editor',['Digit2']],
  ['edelete','DELETE MODE','editor',['Digit3']],
  ['etest','PLAYTEST','editor',['Enter','NumpadEnter']],
  ['ehere','PLAYTEST FROM SCREEN','editor',['KeyT']],
  ['emusic','MUSIC PREVIEW','editor',['KeyM']],
  ['erotr','ROTATE CLOCKWISE','editor',['KeyE']],
  ['erotl','ROTATE COUNTER-CLOCKWISE','editor',['KeyQ']],
  ['eflipx','FLIP X','editor',['KeyF']],
  ['eflipy','FLIP Y','editor',['KeyV']],
  ['eup','MOVE UP','editor',['KeyW','ArrowUp']],
  ['edown','MOVE DOWN','editor',['KeyS','ArrowDown']],
  ['eleft','MOVE LEFT','editor',['KeyA','ArrowLeft']],
  ['eright','MOVE RIGHT','editor',['KeyD','ArrowRight']],
  ['edel','DELETE SELECTED','editor',['Delete','Backspace']],
  ['eswipe','SWIPE ON / OFF','editor',['KeyG']],
  ['ezin','ZOOM IN','editor',['Equal','NumpadAdd']],
  ['ezout','ZOOM OUT','editor',['Minus','NumpadSubtract']],
  ['eprev','PREVIOUS START POS','editor',['BracketLeft']],
  ['enext','NEXT START POS','editor',['BracketRight']],
  ['ehome','GO TO LEVEL START','editor',['Home']],
  ['eend','GO TO LEVEL END','editor',['End']],
  ['epan','HOLD TO PAN','editor',['Space']]
];
function defaultKeys(){ const o={}; KEY_ACTS.forEach(function(a){ o[a[0]]=a[3].slice(); }); return o; }
let KEYS=(function(){
  const o=defaultKeys();
  try{
    const s=JSON.parse(localStorage.getItem('jd_keys')||'{}');
    for(const k in o) if(Array.isArray(s[k])) o[k]=s[k].filter(function(c){ return typeof c==='string' && c; }).slice(0,2);
  }catch(e){}
  return o;
})();
function saveKeys(){ try{ localStorage.setItem('jd_keys', JSON.stringify(KEYS)); }catch(e){} }
function keyIs(e, id){ return (KEYS[id]||[]).indexOf(e.code)>=0; }
function keyName(c){
  if(!c) return '-';
  const M={Space:'SPACE',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Escape:'ESC',Enter:'ENTER',NumpadEnter:'NUM ENTER',
    Backspace:'BKSP',Delete:'DEL',BracketLeft:'[',BracketRight:']',Equal:'=',Minus:'-',NumpadAdd:'NUM +',NumpadSubtract:'NUM -',
    ShiftLeft:'L SHIFT',ShiftRight:'R SHIFT',ControlLeft:'L CTRL',ControlRight:'R CTRL',AltLeft:'L ALT',AltRight:'R ALT',
    Home:'HOME',End:'END',Tab:'TAB',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\',Backquote:'`',CapsLock:'CAPS'};
  if(M[c]) return M[c];
  return c.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'NUM ').toUpperCase();
}
function keyList(id){ return (KEYS[id]||[]).map(keyName).join(' / ')||'-'; }

// ---------- constants ----------
const SPDS=[
  {m:0.8, n:1, c:'255,216,61',  rev:true},
  {m:1.0, n:1, c:'70,164,255'},
  {m:1.2, n:2, c:'77,255,98'},
  {m:1.5, n:3, c:'255,92,214'},
  {m:1.8, n:4, c:'255,75,75'}
];
const KINDS=['spikes','blocks','portals','speeds','orbs','pads','decos','slopes','saws','triggers','starts'];
const CH_BG=1000, CH_G=1001, CH_LINE=1002, CH_OBJ=1004;
const CH_NAMES={1000:'BG',1001:'GROUND',1002:'LINE',1004:'OBJ'};
const PORTAL_MODES=['cube','ship','ball','wave','gdown','gup','ufo','mini','big','robot','spider'];
const ORB_KINDS=['y','p','b','r','k','d','g','q'];
const PAD_KINDS=['y','p','b'];
const DECO_MAX=42, DECO_TEXT=100;
const STYLE_NAMES=['CLASSIC','BRICK','TECH','LINES','PLATE','GRID','HATCH','STUDS','SOLID COLOR','GLASS',
  'OUTLINE PIECE','OUTLINE ONLY','D BLOCK','CHECKER','DIAMOND','CROSS','CIRCUIT','WAVY','TILES','GLOW','HAZARD','BEVEL','SCALES','ZIGZAG','BRICK BACKGROUND'];
const T_OUTLINE=10, T_LINES=11, T_D=12;
const T_BRICKBG=24;
const BG_NAMES=['CITY','SPACE','SYNTHWAVE','MOUNTAINS','OCEAN','HEX','CLOUDS','CIRCUIT','SQUARES','PLAIN'];
const GR_NAMES=['CLASSIC','TILES','STRIPES','BRICKS','PLAIN'];
const MODE_NAMES=['cube','ship','ball','ufo','wave','robot','spider'];
const SAW_R   = [0.92, 0.64, 0.44];
const SAW_HIT = [0.58, 0.42, 0.29];

function hashStr(s){
  let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  return h;
}
function escHtml(s){
  return (''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toast(msg){
  toastEl.textContent=msg; toastEl.style.opacity=1; toastEl.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t=setTimeout(function(){ toastEl.style.opacity=0; }, 2400);
}
function hslRgb(h,s,l){
  h=((h%360)+360)%360;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r,g,b;
  if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
}
function arrToHex(c){
  c=c||[255,255,255];
  function hx(v){ v=Math.max(0,Math.min(255,v|0)); return ('0'+v.toString(16)).slice(-2); }
  return '#'+hx(c[0])+hx(c[1])+hx(c[2]);
}
function hexToArr(hex){
  const n=parseInt((hex||'#ffffff').slice(1),16);
  return [n>>16&255, n>>8&255, n&255];
}
function copyText(txt, okMsg){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){ toast(okMsg); },
      function(){ window.prompt('Copy this:', txt); });
  } else window.prompt('Copy this:', txt);
}

// ---------- audio ----------
let AC=null, master=null, muted=false, noiseBuf=null, nextT=0, stepI=0;
let kickTimes=[], pulse=0;
let EIcur=60/141/2, TR=null;
let songAudio=null, songOffset=0;
let musicOn=true, speedHack=1, musicT0=0, musicClock=0;

const TRACKS=[
{name:'DASHER',bpm:141,prog:[55,55,43.65,43.65,65.41,65.41,49,49],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,0,0,0,0,0,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:750,pat:[0,0,0,12,0,0,0,12]},
 lead:{wave:'square',gain:0.05,oct:4,pat:[0,null,7,null,12,null,7,null]}},
{name:'SKYLINE',bpm:122,prog:[41.2,41.2,49,49,55,55,43.65,49],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'sawtooth',cut:500,pat:[null,0,null,0,null,0,null,0]},
 lead:{wave:'triangle',gain:0.07,oct:2,pat:[0,3,7,10,12,10,7,3,0,3,7,10,15,12,10,7]}},
{name:'PULSE DRIVE',bpm:150,prog:[36.71,36.71,36.71,36.71,43.65,43.65,32.7,32.7],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,0,0,0,0,1,0],hat:[0,1,0,1,0,1,1,1],
 bass:{wave:'sawtooth',cut:600,pat:[0,null,0,0,null,0,0,null,0,null,0,0,null,0,3,5]},
 lead:{wave:'sawtooth',gain:0.04,oct:4,pat:[null,null,12,null,null,7,null,null]}},
{name:'NEON RUSH',bpm:160,prog:[55,55,58.27,58.27,49,49,43.65,43.65],
 kick:[1,0,1,0,1,0,1,1],snare:[0,0,1,0,0,0,1,0],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'sawtooth',cut:900,pat:[0,12,0,12,0,12,0,12]},
 lead:{wave:'square',gain:0.05,oct:4,pat:[0,3,7,12,7,3,0,3,0,3,7,12,15,12,7,3]}},
{name:'MOONLIGHT',bpm:100,prog:[43.65,43.65,41.2,41.2,38.89,38.89,43.65,49],
 kick:[1,0,0,0,0,0,1,0],snare:[0,0,0,0,1,0,0,0],hat:[0,0,1,0,0,0,1,0],
 bass:{wave:'triangle',cut:400,pat:[0,null,null,null,0,null,null,null]},
 lead:{wave:'triangle',gain:0.08,oct:2,pat:[12,null,10,null,7,null,3,null,5,null,7,null,3,null,0,null]}},
{name:'STORMCORE',bpm:170,prog:[36.71,36.71,43.65,43.65,36.71,36.71,46.25,43.65],
 kick:[1,1,0,1,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:650,pat:[0,0,null,0,0,null,0,0]},
 lead:{wave:'square',gain:0.045,oct:4,pat:[null,12,null,null,10,null,7,null,null,12,null,15,null,12,null,7]}},
{name:'GLACIER',bpm:90,prog:[32.7,32.7,36.71,36.71,29.14,29.14,32.7,32.7],
 kick:[1,0,0,0,1,0,0,0],snare:[0,0,0,0,0,0,0,0],hat:[0,0,0,1,0,0,0,1],
 bass:{wave:'sine',cut:300,pat:[0,null,null,null,null,null,null,null]},
 lead:{wave:'triangle',gain:0.08,oct:2,pat:[0,null,null,7,null,null,12,null,null,10,null,7,null,3,null,null]}},
{name:'VOLTAGE',bpm:152,prog:[41.2,41.2,41.2,43.65,49,49,43.65,38.89],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'square',cut:1200,pat:[0,null,0,null,3,null,5,null]},
 lead:{wave:'sawtooth',gain:0.04,oct:4,pat:[12,null,null,12,null,10,null,7]}},
{name:'ABYSS',bpm:132,prog:[30.87,30.87,30.87,30.87,32.7,32.7,29.14,29.14],
 kick:[1,0,0,1,0,0,1,0],snare:[0,0,0,0,1,0,0,0],hat:[0,1,1,0,1,1,0,1],
 bass:{wave:'sawtooth',cut:500,pat:[0,0,12,0,0,10,0,12]},
 lead:{wave:'triangle',gain:0.05,oct:4,pat:[null,null,null,null,6,null,null,null]}},
{name:'SUNRISE',bpm:138,prog:[65.41,65.41,43.65,43.65,49,49,55,55],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:800,pat:[0,null,0,0,null,0,0,null]},
 lead:{wave:'square',gain:0.05,oct:4,pat:[0,4,7,12,7,4,0,null,4,7,12,16,12,7,4,null]}},
{name:'CIRCUITS',bpm:145,prog:[55,55,49,49,58.27,58.27,65.41,49],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,1],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'square',cut:2000,pat:[0,12,0,12,0,12,0,12]},
 lead:{wave:'square',gain:0.055,oct:4,pat:[0,7,12,7,15,12,7,0,3,7,12,7,15,12,10,7]}},
{name:'FINAL BOSS',bpm:175,prog:[36.71,36.71,38.89,38.89,36.71,36.71,34.65,34.65],
 kick:[1,0,1,1,1,0,1,1],snare:[0,0,1,0,0,0,1,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:700,pat:[0,0,0,12,0,0,10,12]},
 lead:{wave:'sawtooth',gain:0.05,oct:4,pat:[12,null,12,null,15,null,19,null]}},
{name:'AT THE SPEED OF LIGHT',file:'at-the-speed-of-light.mp3',vol:0.35,bpm:128}
];
const NG_FEATURED=[
  {id:467339, n:'At the Speed of Light', a:'Dimrain47'},
  {id:568699, n:'Hexagon Force', a:'Waterflame'},
  {id:641172, n:'Geometrical Dominator', a:'Waterflame'}
];
const audioCache={};
function audioFor(url){
  if(!url) return null;
  let a=audioCache[url];
  if(!a){ a=new Audio(); a.preload='auto'; a.loop=true; a.src=url; audioCache[url]=a; }
  return a;
}
function ngURL(id){ return 'https://www.newgrounds.com/audio/download/'+(Math.floor(+id)||0); }
function stopSong(){
  if(songAudio){ try{ songAudio.pause(); }catch(e){} songAudio=null; }
}
function startSong(tr, at){
  const a=tr&&tr.file ? audioFor(tr.file) : null; if(!a) return;
  if(songAudio && songAudio!==a) stopSong();
  songAudio=a;
  if(tr.ng && !a._errHooked){
    a._errHooked=true;
    a.addEventListener('error', function(){ if(songAudio===a) toast('Newgrounds song #'+tr.ng+' did not load (NG Guard or downloads off)'); });
  }
  a.volume=trackVol(tr);
  a.muted=muted;
  try{ a.playbackRate=speedHack; }catch(e){}
  if(at!=null){
    if(a.readyState>=1){ try{ a.currentTime=at; }catch(e){} }
    else {
      a._seek=at;
      if(!a._hooked){
        a._hooked=true;
        a.addEventListener('loadedmetadata', function(){
          if(a._seek!=null){ try{ a.currentTime=a._seek; }catch(e){} a._seek=null; }
        });
      }
    }
  }
  if(!paused || state!=='play') a.play().catch(function(){});
}
let idbP=null;
function idbOpen(){
  if(!idbP) idbP=new Promise(function(res,rej){
    try{
      const r=indexedDB.open('jimitri_dash',1);
      r.onupgradeneeded=function(){ r.result.createObjectStore('songs'); };
      r.onsuccess=function(){ res(r.result); };
      r.onerror=function(){ rej(r.error); };
    }catch(e){ rej(e); }
  });
  return idbP;
}
function idbPut(key,val){
  return idbOpen().then(function(db){ return new Promise(function(res,rej){
    const tx=db.transaction('songs','readwrite'); tx.objectStore('songs').put(val,key);
    tx.oncomplete=function(){ res(); }; tx.onerror=function(){ rej(tx.error); };
  }); });
}
function idbGet(key){
  return idbOpen().then(function(db){ return new Promise(function(res,rej){
    const rq=db.transaction('songs','readonly').objectStore('songs').get(key);
    rq.onsuccess=function(){ res(rq.result); }; rq.onerror=function(){ rej(rq.error); };
  }); });
}
function idbAll(){
  return idbOpen().then(function(db){ return new Promise(function(res,rej){
    const out=[], rq=db.transaction('songs','readonly').objectStore('songs').openCursor();
    rq.onsuccess=function(){ const c=rq.result; if(c){ out.push({k:c.key, n:(c.value&&c.value.name)||c.key}); c.continue(); } else res(out); };
    rq.onerror=function(){ rej(rq.error); };
  }); });
}
const customURLs={};
function customSongURL(key){
  if(customURLs[key]) return Promise.resolve(customURLs[key]);
  return idbGet(key).then(function(v){
    if(!v || !v.blob) return null;
    const u=URL.createObjectURL(v.blob); customURLs[key]=u; return u;
  }).catch(function(){ return null; });
}
function trackFor(s){
  s=s||{t:'b',i:0};
  if(s.t==='ng') return {name:s.n||('NEWGROUNDS #'+s.id), file:ngURL(s.id), vol:0.45, bpm:128, ng:s.id};
  if(s.t==='f') return {name:s.p, file:s.p, vol:0.45, bpm:128};
  if(s.t==='c'){
    const tr={name:s.n||'MY SONG', file:customURLs[s.k]||null, vol:0.45, bpm:128, ck:s.k};
    if(!tr.file) customSongURL(s.k).then(function(u){
      if(!u){ if(TR===tr) toast('That custom song is not saved on this device'); return; }
      tr.file=u;
      if(TR===tr && musicOn) musicSeek(musicNow());
    });
    return tr;
  }
  return TRACKS[Math.max(0,Math.min(TRACKS.length-1,s.i|0))];
}
function sameTrack(a,b){
  return a===b || (!!a && !!b && ((a.ng && a.ng===b.ng) || (a.ck && a.ck===b.ck) || (!a.ck && a.file && a.file===b.file)));
}
function setSong(s){
  const tr=trackFor(s);
  if(TR && sameTrack(TR,tr)) return;
  stopSong();
  TR=tr; EIcur=60/(TR.bpm||128)/2/speedHack; stepI=0;
}
function isFileTrack(tr){ return !!(tr && (tr.file || tr.ck)); }
function musicNow(){ return musicT0 + (performance.now()-musicClock)/1000*speedHack; }
function musicSeek(t){
  t=Math.max(0,t||0);
  musicOn=true; musicT0=t; musicClock=performance.now(); kickTimes.length=0;
  if(isFileTrack(TR)){ if(TR.file) startSong(TR, Math.max(0,songOffset+t)); return; }
  stopSong();
  const eis=60/((TR&&TR.bpm)||128)/2;
  EIcur=eis/speedHack;
  const n=Math.max(0,Math.ceil(t/eis-1e-6));
  stepI=n%64;
  if(AC) nextT=AC.currentTime+0.03+(n*eis-t)/speedHack;
}
function musicStop(){ musicOn=false; stopSong(); }
function setSpeedHack(v){
  speedHack=v;
  if(songAudio){ try{ songAudio.playbackRate=v; }catch(e){} }
  EIcur=60/((TR&&TR.bpm)||128)/2/v;
}
function initAudio(){
  if(AC){
    if(AC.state==='suspended' && !paused) AC.resume();
    if(musicOn && isFileTrack(TR) && TR.file && !paused && (!songAudio || songAudio.paused)) startSong(TR, null);
    return;
  }
  try{
    AC = new (window.AudioContext||window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = muted?0:0.75*OPT.vol;
    master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    nextT = AC.currentTime + 0.1;
    setInterval(function(){
      if(AC.state!=='running') return;
      if(!musicOn || isFileTrack(TR)){ nextT=Math.max(nextT, AC.currentTime+0.05); return; }
      while(nextT < AC.currentTime + 0.18){
        playStep(stepI, nextT);
        nextT += EIcur; stepI = (stepI+1)%64;
      }
    }, 60);
    if(musicOn && isFileTrack(TR) && TR.file) startSong(TR, null);
  }catch(e){}
}
function env(t,a,peak,dur){
  const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(peak,t+a);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  g.connect(master); return g;
}
function kick(t){
  const o=AC.createOscillator();
  o.frequency.setValueAtTime(160,t);
  o.frequency.exponentialRampToValueAtTime(45,t+0.1);
  o.connect(env(t,0.002,0.9,0.13)); o.start(t); o.stop(t+0.15);
  kickTimes.push(t); if(kickTimes.length>20) kickTimes.shift();
}
function hat(t){
  const s=AC.createBufferSource(); s.buffer=noiseBuf;
  const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=6500;
  s.connect(f); f.connect(env(t,0.001,0.12,0.05)); s.start(t); s.stop(t+0.06);
}
function snare(t){
  const s=AC.createBufferSource(); s.buffer=noiseBuf;
  const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800; f.Q.value=0.8;
  s.connect(f); f.connect(env(t,0.002,0.3,0.12)); s.start(t); s.stop(t+0.14);
  const o=AC.createOscillator(); o.type='triangle';
  o.frequency.setValueAtTime(190,t);
  o.frequency.exponentialRampToValueAtTime(120,t+0.08);
  o.connect(env(t,0.002,0.2,0.09)); o.start(t); o.stop(t+0.1);
}
function bassN(fr,t,wave,cut){
  const o=AC.createOscillator(); o.type=wave; o.frequency.value=fr;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=cut;
  o.connect(f); f.connect(env(t,0.005,0.3,EIcur*0.92)); o.start(t); o.stop(t+EIcur);
}
function leadN(fr,t,wave,gain){
  const o=AC.createOscillator(); o.type=wave; o.frequency.value=fr;
  o.connect(env(t,0.004,gain,EIcur*0.85)); o.start(t); o.stop(t+EIcur);
}
function playStep(i,t){
  if(!TR || isFileTrack(TR) || !TR.prog) return;
  const bar=(i>>3)&7, ei=i&7, root=TR.prog[bar];
  if(TR.kick[ei]) kick(t);
  if(TR.snare[ei]) snare(t);
  if(TR.hat[ei]) hat(t);
  const bp=TR.bass.pat, bo=bp[i%bp.length];
  if(bo!==null) bassN(root*Math.pow(2,bo/12), t, TR.bass.wave, TR.bass.cut);
  const lp=TR.lead.pat, lo=lp[i%lp.length];
  if(lo!==null) leadN(root*TR.lead.oct*Math.pow(2,lo/12), t, TR.lead.wave, TR.lead.gain);
}
function deathSfx(){
  if(!AC || AC.state!=='running') return; const t=AC.currentTime;
  const s=AC.createBufferSource(); s.buffer=noiseBuf;
  const f=AC.createBiquadFilter(); f.type='lowpass';
  f.frequency.setValueAtTime(3000,t);
  f.frequency.exponentialRampToValueAtTime(200,t+0.3);
  s.connect(f); f.connect(env(t,0.002,0.5,0.32)); s.start(t); s.stop(t+0.35);
  const o=AC.createOscillator();
  o.frequency.setValueAtTime(220,t);
  o.frequency.exponentialRampToValueAtTime(40,t+0.3);
  o.connect(env(t,0.002,0.4,0.3)); o.start(t); o.stop(t+0.32);
}
function orbSfx(){
  if(!AC || AC.state!=='running') return; const t=AC.currentTime;
  const o=AC.createOscillator(); o.type='triangle';
  o.frequency.setValueAtTime(600,t);
  o.frequency.exponentialRampToValueAtTime(1200,t+0.08);
  o.connect(env(t,0.004,0.25,0.12)); o.start(t); o.stop(t+0.14);
}
function winSfx(){
  if(!AC || AC.state!=='running') return; const t=AC.currentTime;
  [523.25,659.25,783.99,1046.5].forEach(function(f,i){
    const o=AC.createOscillator(); o.type='square'; o.frequency.value=f;
    o.connect(env(t+i*0.12,0.01,0.12,0.3));
    o.start(t+i*0.12); o.stop(t+i*0.12+0.32);
  });
}
function trackVol(tr){ return Math.max(0,Math.min(1,(tr&&tr.vol!=null?tr.vol:0.45)*OPT.vol/0.6)); }
function applyVolume(){
  if(master) master.gain.value = muted?0:0.75*OPT.vol;
  if(songAudio && TR) songAudio.volume=trackVol(TR);
}
function setVolume(v){ OPT.vol=Math.max(0,Math.min(1,v)); saveOpt(); applyVolume(); }
function toggleMute(){
  muted=!muted;
  applyVolume();
  if(songAudio) songAudio.muted = muted;
  muteBtn.innerHTML = muted ? '&#128263;' : '&#128266;';
}

// ---------- level format ----------
function defaultCC(hue){
  const o={};
  o[CH_BG]=hslRgb(hue,0.7,0.32); o[CH_G]=hslRgb(hue,0.55,0.22);
  o[CH_LINE]=[255,255,255]; o[CH_OBJ]=[255,255,255];
  return o;
}
function blankLevel(name){
  const L={name:name||'UNNAMED', song:{t:'b',i:0}, mo:0, bg:0, gr:0, cc:defaultCC(215),
           sm:'cube', ss:1, smi:0, sgd:0};
  KINDS.forEach(function(k){ L[k]=[]; });
  return L;
}
function num(v,d,lo,hi){
  v=+v; if(!isFinite(v)) v=d;
  if(lo!=null && v<lo) v=lo;
  if(hi!=null && v>hi) v=hi;
  return v;
}
function rgbNorm(v){
  if(typeof v==='string') v=v.split(',');
  if(!v || v.length<3) return [255,255,255];
  return [num(v[0],255,0,255)|0, num(v[1],255,0,255)|0, num(v[2],255,0,255)|0];
}
function chanNorm(c){
  c=num(c,CH_BG)|0;
  if(c>=1 && c<=99) return c;
  if(c===CH_BG||c===CH_G||c===CH_LINE||c===CH_OBJ) return c;
  return CH_BG;
}
function songNorm(s){
  if(!s || typeof s!=='object') return {t:'b',i:0};
  if(s.t==='ng'){ const id=Math.floor(num(s.id,0,0,1e10)); return id?{t:'ng',id:id,n:(''+(s.n||'')).slice(0,48)}:{t:'b',i:0}; }
  if(s.t==='f'){ const p=''+(s.p||''); return /^[\w\-. ()]{1,80}\.(mp3|ogg|wav|m4a)$/i.test(p)?{t:'f',p:p}:{t:'b',i:0}; }
  if(s.t==='c') return {t:'c', k:(''+(s.k||'')).replace(/[^\w]/g,'').slice(0,40), n:(''+(s.n||'')).slice(0,60)};
  return {t:'b', i:num(s.i,0,0,TRACKS.length-1)|0};
}
function normObj(k,a){
  if(!a || typeof a!=='object') return null;
  const o={gx:num(a.gx,0,-1e5,1e5), gy:num(a.gy,0,-1e4,1e4)};
  if(a.rot) o.rot=num(a.rot,0,-36000,36000)%360;
  if(a.sc!=null && +a.sc!==1) o.sc=num(a.sc,1,0.1,8);
  if(a.g && k!=='triggers') o.g=num(a.g,0,0,9999)|0;
  if(a.c) o.c=chanNorm(a.c);
  if(a.el) o.el=num(a.el,0,0,99)|0;
  if(a.fx) o.fx=1;
  if(a.fy) o.fy=1;
  if(a.inv && k!=='triggers' && k!=='starts') o.inv=1;
  switch(k){
    case 'spikes': o.r=num(a.r,0,0,3)|0; o.sz=num(a.sz,0,0,3)|0; break;
    case 'blocks':
      o.w=num(a.w,1,0.05,500); o.h=num(a.h,1,0.05,500); o.t=num(a.t,0,0,STYLE_NAMES.length-1)|0;
      if(a.e!=null && (o.t===T_OUTLINE||o.t===T_LINES)){ const e=num(a.e,15,0,15)|0; if(e!==15) o.e=e; }
      break;
    case 'portals': o.m=PORTAL_MODES.indexOf(a.m)>=0?a.m:'cube'; o.r=num(a.r,0,0,3)|0; break;
    case 'speeds': o.t=num(a.t,1,0,4)|0; o.r=num(a.r,0,0,3)|0; break;
    case 'orbs': o.k=ORB_KINDS.indexOf(a.k)>=0?a.k:'y'; break;
    case 'pads': o.k=PAD_KINDS.indexOf(a.k)>=0?a.k:'y'; o.r=num(a.r,0,0,1)|0; break;
    case 'decos': {
      const kk=num(a.k,0,0,DECO_TEXT)|0;
      o.k=(kk===DECO_TEXT||kk<=DECO_MAX)?kk:0;
      o.r=num(a.r,0,0,3)|0; o.z=num(a.z,2,0,10)|0;
      if(o.k===DECO_TEXT) o.tx=(''+(a.tx!=null?a.tx:'TEXT')).slice(0,60);
      break;
    }
    case 'slopes': o.o=num(a.o!=null?a.o:a.dir,0,0,3)|0; if(+a.w===2) o.w=2; else if(+a.h===2) o.h=2; break;
    case 'saws': o.k=num(a.k,0,0,2)|0; o.sz=num(a.sz,0,0,2)|0; break;
    case 'triggers':
      if(a.tg) o.tg=num(a.tg,0,0,9999)|0;
      if(a.sp) o.sp=1;
      if(a.type==='spawn'){
        o.type='spawn'; o.g=num(a.g,1,0,9999)|0; o.dl=num(a.dl,0,0,600);
      } else if(a.type==='toggle'){
        o.type='toggle'; o.g=num(a.g,1,0,9999)|0; o.on=a.on?1:0;
      } else if(a.type==='color'){
        o.type='color'; o.ch=chanNorm(a.ch!=null?a.ch:CH_BG);
        o.col=a.col?rgbNorm(a.col):hslRgb(num(a.hue,0),0.7,0.32);
        o.dur=num(a.dur,0.6,0,60);
      } else if(a.type==='alpha'){
        o.type='alpha'; o.g=num(a.g,1,0,9999)|0; o.a=num(a.a,0,0,1); o.dur=num(a.dur,0.5,0,60);
      } else {
        o.type='move'; o.g=num(a.g,0,0,9999)|0; o.dx=num(a.dx,0,-1e4,1e4); o.dy=num(a.dy,0,-1e4,1e4);
        o.dur=num(a.dur,-1,-1,60); o.ease=num(a.ease,0,0,3)|0;
      }
      break;
  }
  o._k=k;
  return o;
}
function packObj(o){
  const r={};
  for(const key in o){
    if(key.charAt(0)==='_') continue;
    let v=o[key];
    if(v===undefined || v===null) continue;
    if(typeof v==='number') v=Math.round(v*1000)/1000;
    if((key==='rot'||key==='g'||key==='c'||key==='el'||key==='r'||key==='fx'||key==='fy'||key==='sz'||key==='inv'||key==='tg'||key==='sp') && !v) continue;
    if(key==='sc' && v===1) continue;
    r[key]=v;
  }
  return r;
}
function packLevel(d){
  const o={v:2, n:d.name||'UNNAMED', song:d.song||{t:'b',i:0}, mo:+d.mo||0, bg:d.bg|0, gr:d.gr|0,
           cc:d.cc||defaultCC(215), sm:d.sm||'cube', ss:(d.ss!=null?d.ss:1), smi:d.smi?1:0, sgd:d.sgd?1:0};
  KINDS.forEach(function(k){ const a=d[k]; if(a && a.length) o[k]=a.map(packObj); });
  return o;
}
function unpackV1(c){
  return {name:(''+(c.n||'CUSTOM')).slice(0,20), m:(+c.m||0), mo:(+c.mo||0), oc:(c.oc||'255,255,255'),
    spikes:(c.s||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,r:(+a[2]||0)&3,sz:(+a[3]||0)&3,g:+a[4]||0};}),
    blocks:(c.b||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,w:+a[2]||1,h:+a[3]||1,g:+a[4]||0,t:(+a[5]||0)};}),
    pads:(c.pd||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:(['y','p','b'][+a[2]||0]||'y'),r:(+a[3]||0)&3,g:+a[4]||0};}),
    starts:(c.st||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0};}),
    portals:(c.p||[]).map(function(a){return {gx:+a[0],m:(['cube','ship','ball','wave','gdown','gup','ufo'][+a[1]]||'cube'),gy:+a[2]||0,r:(+a[3]||0)&3,g:+a[4]||0};}),
    speeds:(c.v||[]).map(function(a){return {gx:+a[0],t:Math.min(4,Math.max(0,(+a[1]||0)|0)),gy:+a[2]||0,r:(+a[3]||0)&3,g:+a[4]||0};}),
    orbs:(c.o||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:(['y','p','b'][+a[2]||0]||'y'),g:+a[3]||0};}),
    decos:(c.e||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:Math.min(11,Math.max(0,(+a[2]||0)|0)),r:(+a[3]||0)&3,g:+a[4]||0,z:(a[5]!=null?Math.min(10,Math.max(0,(+a[5]||0)|0)):2)};}),
    slopes:(c.sl||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,o:(+a[2]||0)&3,g:+a[3]||0};}),
    saws:(c.sw||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:Math.min(2,Math.max(0,(+a[2]||0)|0)),sz:Math.min(2,Math.max(0,(+a[3]||0)|0)),g:+a[4]||0};}),
    triggers:(c.tg||[]).map(function(a){return (+a[0]===1)
        ? {type:'color',gx:+a[1],gy:+a[2]||0,hue:(+a[3]||0)}
        : {type:'move',gx:+a[1],gy:+a[2]||0,g:+a[3]||0,dx:+a[4]||0,dy:+a[5]||0};})};
}
function upgradeLegacy(d){
  const L=blankLevel(d.name);
  L.song={t:'b', i:Math.max(0,Math.min(TRACKS.length-1,d.m|0))};
  L.mo=+d.mo||0;
  L.cc=defaultCC(hashStr(d.name||'x')%360);
  L.cc[CH_OBJ]=rgbNorm(d.oc||'255,255,255');
  KINDS.forEach(function(k){
    L[k]=(d[k]||[]).map(function(o){ return normObj(k,o); }).filter(Boolean);
  });
  return L;
}
function unpackV2(c){
  const L=blankLevel((''+(c.n||'UNNAMED')).slice(0,20));
  L.song=songNorm(c.song);
  L.mo=num(c.mo,0,0,3600);
  L.bg=num(c.bg,0,0,BG_NAMES.length-1)|0;
  L.gr=num(c.gr,0,0,GR_NAMES.length-1)|0;
  if(c.cc && typeof c.cc==='object'){
    for(const key in c.cc){ const ch=chanNorm(key); if(''+ch===key) L.cc[ch]=rgbNorm(c.cc[key]); }
  }
  L.sm=MODE_NAMES.indexOf(c.sm)>=0?c.sm:'cube';
  L.ss=num(c.ss,1,0,4)|0;
  L.smi=c.smi?1:0; L.sgd=c.sgd?1:0;
  KINDS.forEach(function(k){
    L[k]=(Array.isArray(c[k])?c[k]:[]).map(function(o){ return normObj(k,o); }).filter(Boolean);
  });
  return L;
}
function unpackLevel(c){
  if(!c || typeof c!=='object') c={};
  if(c.v===2) return unpackV2(c);
  return upgradeLegacy(unpackV1(c));
}
function levelCode(d){
  return 'JD2.'+btoa(unescape(encodeURIComponent(JSON.stringify(packLevel(d)))));
}
function decodeLevel(code){
  code=(''+(code||'')).trim();
  if(code.indexOf('JD1.')!==0 && code.indexOf('JD2.')!==0) return null;
  try{
    return unpackLevel(JSON.parse(decodeURIComponent(escape(atob(code.slice(4))))));
  }catch(e){ return null; }
}
function objW(o){ return o._k==='blocks' ? o.w : o._k==='slopes' ? (o.w||1) : 1; }
function maxGx(d){
  let m=20;
  KINDS.forEach(function(k){
    if(k==='starts') return;
    (d[k]||[]).forEach(function(o){ const e=o.gx+objW(o); if(e>m) m=e; });
  });
  return m;
}
function objCount(d){
  let n=0;
  KINDS.forEach(function(k){ if(k!=='starts' && k!=='decos') n+=(d[k]||[]).length; });
  return n;
}
function rotRad(o){ return (o.rot||0)*Math.PI/180; }
function prepSpike(s){
  const sz=s.sz||0, sc=s.sc||1;
  const LA=[0.60,0.30,0.32,0.18][sz]*B, WA=[0.28,0.28,0.16,0.10][sz]*B, PAD=[0.12,0.12,0.06,0.04][sz]*B;
  const deg=[0,180,90,-90][s.r||0]+(s.rot||0);
  let c=Math.cos(deg*Math.PI/180), sn=Math.sin(deg*Math.PI/180);
  if(Math.abs(c)<1e-9) c=0; if(Math.abs(sn)<1e-9) sn=0;
  const oy=(B/2-PAD-LA/2)*sc;
  s._ox=-sn*oy; s._oy=c*oy; s._c=c; s._s=sn; s._hw=WA/2*sc; s._hh=LA/2*sc;
}
function prepBlock(b){
  const q=((Math.round((b.rot||0)/90)%2)+2)%2, sc=b.sc||1;
  b._cx=b.w/2; b._cy=b.h/2;
  b._hw=(q?b.h:b.w)*sc/2; b._hh=(q?b.w:b.h)*sc/2;
}
function prepLevel(d, diff){
  const L={name:d.name||'CUSTOM', diff:diff||'CUSTOM', song:d.song||{t:'b',i:0}, mo:+d.mo||0,
           bg:d.bg|0, gr:d.gr|0, cc:d.cc||defaultCC(215), sm:d.sm||'cube', ss:(d.ss!=null?d.ss:1),
           smi:d.smi?1:0, sgd:d.sgd?1:0};
  KINDS.forEach(function(k){ L[k]=(d[k]||[]).slice(); });
  L.portals.sort(function(a,b){ return a.gx-b.gx; });
  L.speeds.sort(function(a,b){ return a.gx-b.gx; });
  L.spikes.forEach(prepSpike);
  L.blocks.forEach(prepBlock);
  const dbl=L.blocks.filter(function(b){ return b.t===T_D; });
  L.blocks.forEach(function(b){
    b._nc=(b.t===T_D || b.t===T_BRICKBG); b._d=false;
    const cx=b.gx+b._cx, cy=(b.gy||0)+b._cy;
    for(let i=0;i<dbl.length;i++){
      const d=dbl[i], dx=d.gx+d._cx, dy=(d.gy||0)+d._cy;
      if(Math.abs(cx-dx)<b._hw+d._hw-0.01 && Math.abs(cy-dy)<b._hh+d._hh-0.01){ b._d=true; break; }
    }
  });
  L.slopes.forEach(function(sl){
    const sc=sl.sc||1, hw=(sl.w||1)*sc/2, hh=(sl.h||1)*sc/2, cx=sl.gx+(sl.w||1)/2, cy=(sl.gy||0)+(sl.h||1)/2;
    sl._d=dbl.some(function(d){
      const dx=d.gx+d._cx, dy=(d.gy||0)+d._cy;
      return Math.abs(cx-dx)<hw+d._hw-0.01 && Math.abs(cy-dy)<hh+d._hh-0.01;
    });
  });
  L.portals.forEach(function(p){ p._horiz=Math.abs(Math.sin(((p.r||0)*90+(p.rot||0))*Math.PI/180))>0.7; });
  L.pads.forEach(function(p){ p._ceil=((p.r|0)===1)!==(Math.cos(rotRad(p))<-0.5); });
  L.endX=maxGx(d)+10;
  return L;
}
function speedSegs(L){
  return (L.speeds||[]).map(function(s){ return {x:(s.gx-1)*B, m:SPDS[s.t].m}; })
    .sort(function(a,b){ return a.x-b.x; });
}
function timeAtX(L, x){
  const sg=speedSegs(L); let m=SPDS[L.ss!=null?L.ss:1].m, pos=0, t=0;
  for(let i=0;i<sg.length;i++){
    if(sg[i].x>=x) break;
    if(sg[i].x>pos){ t+=(sg[i].x-pos)/(SPEED*m*60); pos=sg[i].x; }
    m=sg[i].m;
  }
  return t+Math.max(0,x-pos)/(SPEED*m*60);
}
function xAtTime(L, t){
  const sg=speedSegs(L); let m=SPDS[L.ss!=null?L.ss:1].m, pos=0, tt=0;
  for(let i=0;i<sg.length;i++){
    if(sg[i].x>pos){
      const dt=(sg[i].x-pos)/(SPEED*m*60);
      if(tt+dt>=t) break;
      tt+=dt; pos=sg[i].x;
    }
    m=sg[i].m;
  }
  return pos+(t-tt)*SPEED*m*60;
}

// ---------- storage ----------
function getUploads(){
  try{ return JSON.parse(localStorage.getItem('gdc_uploads')||'[]'); }catch(e){ return []; }
}
function setUploads(u){
  try{ localStorage.setItem('gdc_uploads', JSON.stringify(u)); }catch(e){ toast('Storage full - could not save'); }
}
const DIFFS=['EASY','NORMAL','HARD','HARDER','INSANE','EASY DEMON','MEDIUM DEMON','HARD DEMON','INSANE DEMON','EXTREME DEMON'];
function starToDiff(st){
  if(st>=10) return 5;
  if(st>=8)  return 4;
  if(st>=6)  return 3;
  if(st>=4)  return 2;
  if(st>=3)  return 1;
  return 0;
}
function getRatings(){
  try{ return JSON.parse(localStorage.getItem('gdc_ratings')||'{}'); }catch(e){ return {}; }
}
function getMeta(id){
  const r=getRatings()[id]||{};
  return {stars:r.stars||0, diff:(typeof r.diff==='number'?r.diff:-1), liked:!!r.liked};
}
function setMeta(id,m){
  const all=getRatings();
  all[id]={stars:m.stars||0, diff:(typeof m.diff==='number'?m.diff:-1), liked:!!m.liked};
  try{ localStorage.setItem('gdc_ratings', JSON.stringify(all)); }catch(e){}
}
function levelBaseLikes(e){ return e.likes||0; }
function getMyLevels(){
  try{ return JSON.parse(localStorage.getItem('gdc_mylevels')||'[]'); }catch(e){ return []; }
}
function setMyLevels(l){
  try{ localStorage.setItem('gdc_mylevels', JSON.stringify(l)); }catch(e){ toast('Storage full - could not save'); }
}
(function(){
  try{
    const raw=localStorage.getItem('gdc_draft');
    if(raw){
      const c=JSON.parse(raw);
      const l=getMyLevels();
      l.unshift({id:'draft0', name:(''+(c.n||'UNNAMED')).slice(0,20), d:c});
      setMyLevels(l);
      localStorage.removeItem('gdc_draft');
    }
  }catch(e){}
})();
const BUILTIN_UPLOADS=(function(){
  function mk(name, m, fn){
    const d={name:name, m:m, spikes:[], blocks:[], portals:[], speeds:[], orbs:[], decos:[]};
    fn(function(gx,gy,fl){ d.spikes.push({gx:gx,gy:gy||0,r:fl?1:0,sz:0}); },
       function(gx,gy,w,h){ d.blocks.push({gx:gx,gy:gy,w:w,h:h}); },
       function(gx,mm,gy){ d.portals.push({gx:gx,m:mm,gy:gy||0}); },
       function(gx,t,gy){ d.speeds.push({gx:gx,t:t,gy:gy||0}); },
       function(gx,gy,k){ d.orbs.push({gx:gx,gy:gy,k:k}); },
       function(gx,gy,k){ d.decos.push({gx:gx,gy:gy,k:k}); });
    return {id:'builtin_'+name.replace(/\s/g,'_'), name:name, builtin:true, d:packLevel(upgradeLegacy(d))};
  }
  return [
  mk('STARTER ROAD',1,function(sp,bl,po,spd,orb,dec){
    sp(10); sp(17); sp(24); sp(31); sp(32);
    bl(38,0,2,1); sp(44);
    sp(52); sp(53); sp(54); sp(55); orb(53,2,'y');
    sp(63); bl(69,0,3,1); sp(76);
    dec(14,0,3); dec(28,0,0); dec(48,0,5); dec(60,0,3); dec(72,0,2);
  }),
  mk('ORBITAL',10,function(sp,bl,po,spd,orb,dec){
    sp(12); sp(13);
    sp(20); sp(21); sp(22); sp(23); orb(21,2,'y');
    sp(30); sp(31); sp(32); sp(33); orb(31,2,'y');
    spd(38,2);
    sp(45); sp(46); sp(47); sp(48); sp(49); sp(50); orb(47,2,'y');
    sp(56); sp(57); sp(58); sp(59); sp(60); sp(61); orb(58,2,'y');
    spd(64,1);
    sp(70); sp(71); sp(72); sp(73); orb(71,2,'y');
    dec(17,0,2); dec(27,0,2); dec(42,0,4); dec(53,0,2); dec(67,0,3);
  }),
  mk('WIND TUNNEL',2,function(sp,bl,po,spd,orb,dec){
    sp(6);
    po(10,'ship');
    bl(18,0,2,3); bl(26,5,2,4); bl(34,0,2,4); bl(42,6,2,3);
    bl(50,0,2,3); bl(50,6,2,3);
    po(58,'cube');
    sp(66); sp(72); sp(73);
    dec(22,8,1); dec(30,8,1); dec(38,8,1); dec(46,8,1); dec(14,0,3); dec(62,0,5);
  }),
  mk('GRAVITY WELL',6,function(sp,bl,po,spd,orb,dec){
    sp(6);
    po(11,'ball');
    sp(22); sp(23);
    sp(34,8,true); sp(35,8,true);
    sp(46); sp(47);
    sp(58,8,true); sp(59,8,true);
    sp(70); sp(71);
    po(80,'cube');
    sp(88); sp(94); sp(95);
    dec(16,4,2); dec(40,4,2); dec(64,4,2);
  })];
})();
[160,95,240,72].forEach(function(n,i){ if(BUILTIN_UPLOADS[i]) BUILTIN_UPLOADS[i].likes=n; });

// ---------- runtime state ----------
const P = {x:0, y:0, vy:0, rot:0, onGround:true, dead:false};
let state='main', held=false, paused=false, attempts=1, deadT=0, camX=0;
let curL=null, mode='cube', speedMult=1, shipAnim=0, mini=false, PB=B;
let portalHit=[], speedHit=[], trigFired=[];
let particles=[], shake=0, ftick=0, deathX=0, deathY=0;
let orbUsed=[], pressBuf=0, padCool=[];
let gdir=1, flipQueued=false, gravSwing=0, dash=null;
let robotBoost=0;
let groupOff={}, groupLeg={}, groupTarget={}, groupTimed={}, moveAnims=[];
let groupAlpha={}, alphaAnims=[];
let chCur={}, chAnims=[];
let groupDis={}, spawnQ=[];
let simTick=0, musicStartT=0, waveTrail=[];
let playCtx={type:'campaign', li:0};
let spawnStart=null;
let practice=false, checkpoints=[], lastCpTick=0;
const macro={rec:false, play:false, ev:[], idx:0};
let LEVELS=[], MENU_L=null;

function egx(o){ const f=o.g&&groupOff[o.g]; return f?o.gx+f.x:o.gx; }
function egy(o){ const f=o.g&&groupOff[o.g]; return (o.gy||0)+(f?f.y:0); }
function chStr(id){
  const c=chCur[id]||[255,255,255];
  return (c[0]|0)+','+(c[1]|0)+','+(c[2]|0);
}
function loadChannels(cc){
  chCur={};
  const d=defaultCC(215);
  for(const k in d) chCur[k]=d[k].slice();
  if(cc) for(const k in cc) chCur[k]=cc[k].slice();
}
function snapGravity(newGdir, keepMomentum, swing){
  if(newGdir===gdir) return;
  gdir=newGdir; robotBoost=0;
  P.vy = keepMomentum===false ? 0 : -P.vy;
  if(swing) gravSwing=8;
  P.onGround=false;
  if(mode==='cube') P.rot=Math.round(P.rot/(Math.PI/2))*(Math.PI/2);
  else if(mode==='wave') P.rot=(held?-1:1)*gdir*Math.PI/4;
  else if(mode==='ship') P.rot=Math.atan2(P.vy, SPEED*speedMult*2.5);
}
function spiderTeleport(){
  const bl=curL.blocks;
  let y=null;
  if(gdir>0){
    let best=-1e9;
    if(ceilingY() <= P.y+2) best=ceilingY();
    for(let i=0;i<bl.length;i++){
      const b=bl[i];
      if(b._nc || isOff(b)) continue;
      const cx=egx(b)+b._cx, cy=egy(b)+b._cy;
      const L=(cx-b._hw)*B, R=(cx+b._hw)*B, BO=groundY-(cy-b._hh)*B;
      if(P.x+PB-2 <= L || P.x+2 >= R) continue;
      if(BO <= P.y+2 && BO > best) best=BO;
    }
    if(best>-1e9) y=best-1;
  } else {
    let best=1e9;
    if(groundY >= P.y+PB-2) best=groundY;
    for(let i=0;i<bl.length;i++){
      const b=bl[i];
      if(b._nc || isOff(b)) continue;
      const cx=egx(b)+b._cx, cy=egy(b)+b._cy;
      const L=(cx-b._hw)*B, R=(cx+b._hw)*B, T=groundY-(cy+b._hh)*B;
      if(P.x+PB-2 <= L || P.x+2 >= R) continue;
      if(T >= P.y+PB-2 && T < best) best=T;
    }
    if(best<1e9) y=best-PB+1;
  }
  if(y===null) return false;
  burst(P.x+PB/2, P.y+PB/2, '190,90,255', 10);
  P.y=y; P.vy=0; gdir=-gdir; gravSwing=0; P.rot=0;
  burst(P.x+PB/2, P.y+PB/2, '190,90,255', 10);
  orbSfx();
  return true;
}
function toggleGravity(){ snapGravity(-gdir); }
function miniScale(){ return mode==='spider' ? 0.6 : MINI_S; }
function syncPB(){
  const n=mini?B*miniScale():B;
  if(n===PB) return;
  const cy=P.y+PB/2; PB=n; P.y=cy-PB/2;
}
function setMini(on){
  if(mini===on) return;
  const cy=P.y+PB/2;
  mini=on; PB=mini?B*miniScale():B
  P.y=cy-PB/2;
}
function enterPortal(m){
  if(m==='gdown') snapGravity(1, false, true);
  else if(m==='gup') snapGravity(-1, false, true);
  else if(m==='mini') setMini(true);
  else if(m==='big') setMini(false);
  else { mode=m; syncPB(); }
}
function easeF(e,k){
  if(e===1) return 0.5-0.5*Math.cos(Math.PI*k);
  if(e===2) return 1-(1-k)*(1-k);
  if(e===3) return k*k;
  return k;
}
function isOff(o){ return !!(o.g && groupDis[o.g]); }
function spawnGroup(g, instant, depth){
  if(depth>24 || !curL.triggers) return;
  const ts=curL.triggers;
  for(let i=0;i<ts.length;i++){
    const t=ts[i];
    if(t.tg===g && !groupDis[g]) fireTrigger(t, instant, depth+1);
  }
}
function fireTrigger(tr, instant, depth){
  depth=depth||0;
  if(tr.type==='toggle'){
    if(tr.g){ if(tr.on) delete groupDis[tr.g]; else groupDis[tr.g]=1; }
    return;
  }
  if(tr.type==='spawn'){
    if(!tr.g) return;
    const d=Math.round(Math.max(0,tr.dl||0)*60);
    if(instant || !d) spawnGroup(tr.g, instant, depth);
    else spawnQ.push({t:simTick+d, g:tr.g});
    return;
  }
  const n=instant?0:Math.round(Math.max(0,tr.dur||0)*60);
  if(tr.type==='color'){
    chAnims=chAnims.filter(function(a){ return a.ch!==tr.ch; });
    if(!n) chCur[tr.ch]=tr.col.slice();
    else chAnims.push({ch:tr.ch, from:(chCur[tr.ch]||[255,255,255]).slice(), to:tr.col.slice(), t:0, n:n});
  } else if(tr.type==='alpha'){
    if(!tr.g) return;
    alphaAnims=alphaAnims.filter(function(a){ return a.g!==tr.g; });
    const from=(groupAlpha[tr.g]!=null?groupAlpha[tr.g]:1);
    if(!n) groupAlpha[tr.g]=tr.a;
    else alphaAnims.push({g:tr.g, from:from, to:tr.a, t:0, n:n});
  } else if(tr.g){
    if(tr.dur<0){
      if(!groupTarget[tr.g]) groupTarget[tr.g]={x:0,y:0};
      groupTarget[tr.g].x+=(tr.dx||0); groupTarget[tr.g].y+=(tr.dy||0);
      if(instant){ groupLeg[tr.g]={x:groupTarget[tr.g].x, y:groupTarget[tr.g].y}; }
    } else if(!n){
      if(!groupTimed[tr.g]) groupTimed[tr.g]={x:0,y:0};
      groupTimed[tr.g].x+=(tr.dx||0); groupTimed[tr.g].y+=(tr.dy||0);
    } else moveAnims.push({g:tr.g, dx:tr.dx||0, dy:tr.dy||0, t:0, n:n, e:tr.ease|0, done:0});
    syncGroups();
  }
}
function syncGroups(){
  const out={};
  function add(src){ for(const g in src){ if(!out[g]) out[g]={x:0,y:0}; out[g].x+=src[g].x; out[g].y+=src[g].y; } }
  add(groupLeg); add(groupTimed);
  groupOff=out;
}
function updateAnims(){
  for(const g in groupTarget){
    if(!groupLeg[g]) groupLeg[g]={x:0,y:0};
    groupLeg[g].x += (groupTarget[g].x-groupLeg[g].x)*0.12;
    groupLeg[g].y += (groupTarget[g].y-groupLeg[g].y)*0.12;
  }
  for(let i=moveAnims.length-1;i>=0;i--){
    const a=moveAnims[i]; a.t++;
    const p=easeF(a.e, Math.min(1,a.t/a.n)), d=p-a.done; a.done=p;
    if(!groupTimed[a.g]) groupTimed[a.g]={x:0,y:0};
    groupTimed[a.g].x+=a.dx*d; groupTimed[a.g].y+=a.dy*d;
    if(a.t>=a.n) moveAnims.splice(i,1);
  }
  syncGroups();
  for(let i=alphaAnims.length-1;i>=0;i--){
    const a=alphaAnims[i]; a.t++;
    const k=Math.min(1,a.t/a.n);
    groupAlpha[a.g]=a.from+(a.to-a.from)*k;
    if(a.t>=a.n) alphaAnims.splice(i,1);
  }
  for(let i=chAnims.length-1;i>=0;i--){
    const a=chAnims[i]; a.t++;
    const k=Math.min(1,a.t/a.n);
    chCur[a.ch]=[a.from[0]+(a.to[0]-a.from[0])*k, a.from[1]+(a.to[1]-a.from[1])*k, a.from[2]+(a.to[2]-a.from[2])*k];
    if(a.t>=a.n) chAnims.splice(i,1);
  }
}
function playerScreenX(){ return W*0.3; }
function reset(){
  const L=curL;
  mini=!!L.smi; PB=mini?B*MINI_S:B;
  P.x=0; P.vy=0; P.rot=0; P.onGround=true; P.dead=false;
  gdir=L.sgd?-1:1;
  P.y = gdir>0 ? groundY-PB : ceilingY();
  mode=L.sm||'cube'; speedMult=SPDS[L.ss!=null?L.ss:1].m; shipAnim=(mode==='ship'||mode==='ball'||mode==='wave')?1:0;
  PB=mini?B*miniScale():B; P.y = gdir>0 ? groundY-PB : ceilingY();
  deadT=0; particles.length=0; flipQueued=false; gravSwing=0; dash=null;
  robotBoost=0;
  groupOff={}; groupLeg={}; groupTarget={}; groupTimed={}; moveAnims=[];
  groupAlpha={}; alphaAnims=[]; chAnims=[]; groupDis={}; spawnQ=[];
  loadChannels(L.cc);
  trigFired = new Array((L.triggers||[]).length).fill(false);
  portalHit = new Array(L.portals.length).fill(false);
  speedHit = new Array((L.speeds||[]).length).fill(false);
  orbUsed = new Array((L.orbs||[]).length).fill(false); pressBuf=0;
  padCool = new Array((L.pads||[]).length).fill(0);
  simTick=0; checkpoints=[]; lastCpTick=0; waveTrail=[];
  if(state==='play' && (playCtx.type==='test'||playCtx.type==='edtest') && spawnStart) applyStartPos(spawnStart);
  musicStartT = P.x>0 ? timeAtX(L, P.x) : 0;
  camX = P.x - playerScreenX();
  camYs=null;
  if(state==='play'){
    macro.idx=0;
    if(macro.rec && !macro.play){ macro.ev=[]; if(held) macro.ev.push([0,2]); }
    if(practice) addCheckpoint();
  }
  musicSeek(musicStartT);
}
function applyStartPos(s){
  const sx=s.gx;
  P.x=sx*B; P.y=groundY-(s.gy||0)*B-PB; P.vy=0; P.onGround=false;
  (curL.portals||[]).forEach(function(p,i){
    if(p.gx < sx){ enterPortal(p.m); portalHit[i]=true; }
  });
  P.vy=0; gravSwing=0;
  (curL.speeds||[]).forEach(function(v,i){ if(v.gx < sx){ speedMult=SPDS[v.t].m; speedHit[i]=true; } });
  (curL.triggers||[]).forEach(function(tr,i){
    if(tr.gx <= sx && !tr.sp){ trigFired[i]=true; if(!(tr.tg && groupDis[tr.tg])) fireTrigger(tr, true, 0); }
  });
  spawnQ=[];
  shipAnim=(mode==='ship'||mode==='ball'||mode==='wave')?1:0;
}
function pctNow(){
  return Math.max(0, Math.min(100, Math.floor(P.x/(curL.endX*B)*100)));
}
function canSaveBest(){ return playCtx.type==='campaign' && !practice && !macro.play && speedHack===1; }
function saveBest(i, pct){
  const L=LEVELS[i]; if(!L) return;
  try{
    const k=L.bestKey;
    if(pct > +(localStorage.getItem(k)||0)) localStorage.setItem(k, pct);
  }catch(e){}
}
function getBest(i){
  const L=LEVELS[i]; if(!L) return 0;
  try{ return +(localStorage.getItem(L.bestKey)||0); }catch(e){ return 0; }
}

// ---------- practice mode (checkpoints) ----------
function snapState(){
  return JSON.parse(JSON.stringify({P:P, mode:mode, mini:mini, speedMult:speedMult, gdir:gdir,
    gravSwing:gravSwing, flipQueued:flipQueued, pressBuf:pressBuf, portalHit:portalHit, speedHit:speedHit,
    orbUsed:orbUsed, padCool:padCool, trigFired:trigFired, groupLeg:groupLeg, groupTarget:groupTarget,
    groupTimed:groupTimed, moveAnims:moveAnims, groupAlpha:groupAlpha, alphaAnims:alphaAnims,
    chCur:chCur, chAnims:chAnims, dash:dash, simTick:simTick, shipAnim:shipAnim, groupDis:groupDis, spawnQ:spawnQ}));
}
function restoreState(s){
  s=JSON.parse(JSON.stringify(s));
  Object.assign(P, s.P); P.dead=false;
  mode=s.mode; mini=s.mini; PB=mini?B*MINI_S:B; speedMult=s.speedMult; gdir=s.gdir;
  gravSwing=s.gravSwing; flipQueued=s.flipQueued; pressBuf=s.pressBuf;
  portalHit=s.portalHit; speedHit=s.speedHit; orbUsed=s.orbUsed; padCool=s.padCool; trigFired=s.trigFired;
  groupLeg=s.groupLeg; groupTarget=s.groupTarget; groupTimed=s.groupTimed; moveAnims=s.moveAnims;
  groupAlpha=s.groupAlpha; alphaAnims=s.alphaAnims; chCur=s.chCur; chAnims=s.chAnims;
  dash=s.dash; simTick=s.simTick; shipAnim=s.shipAnim;
robotBoost=0;
  groupDis=s.groupDis||{}; spawnQ=s.spawnQ||[];
  syncGroups();
}
function addCheckpoint(){
  if(P.dead) return;
  checkpoints.push(snapState()); lastCpTick=simTick;
  if(checkpoints.length>300) checkpoints.shift();
}
function removeCheckpoint(){
  if(checkpoints.length>1) checkpoints.pop();
}
function respawnCheckpoint(){
  const cp=checkpoints[checkpoints.length-1];
  restoreState(cp); deadT=0; particles.length=0; attempts++; lastCpTick=simTick; waveTrail=[];
  if(macro.rec && !macro.play){
    macro.ev=macro.ev.filter(function(e){ return e[0]<simTick; });
    let implied=false;
    macro.ev.forEach(function(e){ implied=(e[1]!==0); });
    if(implied!==held) macro.ev.push([simTick, held?2:0]);
  }
  camX = P.x - playerScreenX();
  musicSeek(musicStartT + simTick/60);
}
function setPractice(on){
  if(on===practice) return;
  practice=on;
  if(on){ checkpoints=[]; addCheckpoint(); toast('Practice mode - checkpoints every 1.5s. Z adds one, X removes one.'); }
  else { attempts++; reset(); }
  updatePauseUI();
}

// ---------- macro bot ----------
function macroKey(){ return 'jd_macro_'+(curL.bestKey || ('c'+hashStr(JSON.stringify(packLevel(curL))))); }
function loadMacroFor(){
  macro.ev=[]; macro.idx=0;
  try{ const s=JSON.parse(localStorage.getItem(macroKey())||'null'); if(s && Array.isArray(s.ev)) macro.ev=s.ev; }catch(e){}
}
function saveMacro(){
  try{ localStorage.setItem(macroKey(), JSON.stringify({ev:macro.ev})); }catch(e){ toast('Macro too big for storage - use SAVE FILE'); }
}
function applyBot(){
  const ev=macro.ev;
  while(macro.idx<ev.length && ev[macro.idx][0]<=simTick){
    const e=ev[macro.idx++];
    if(e[1]===1){ held=true; pressBuf=8; flipQueued=true; }
    else if(e[1]===2) held=true;
    else held=false;
  }
}
function inputDown(){
  if(state!=='play' || paused || macro.play) return;
  held=true; pressBuf=8; flipQueued=true;
  if(macro.rec && !P.dead) macro.ev.push([simTick,1]);
}
function inputHold(){
  if(state!=='play' || paused || macro.play || held) return;
  held=true;
  if(macro.rec && !P.dead) macro.ev.push([simTick,2]);
}
function inputUp(){
  if(macro.play && state==='play') return;
  if(held && state==='play' && macro.rec && !P.dead) macro.ev.push([simTick,0]);
  held=false;
}
function downloadMacro(){
  if(!macro.ev.length){ toast('No macro recorded yet'); return; }
  const blob=new Blob([JSON.stringify({level:curL.name, key:macroKey(), ev:macro.ev})],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(curL.name||'level').replace(/[^\w]+/g,'_')+'.jdmacro.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
}
function uploadMacro(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='.json,application/json';
  inp.addEventListener('change', function(){
    const f=inp.files&&inp.files[0]; if(!f) return;
    f.text().then(function(t){
      const s=JSON.parse(t);
      if(!s || !Array.isArray(s.ev)) throw new Error('bad');
      macro.ev=s.ev.filter(function(e){ return Array.isArray(e) && isFinite(e[0]) && (e[1]===0||e[1]===1||e[1]===2); });
      if(s.key && s.key!==macroKey()) toast('Loaded - but it was recorded on a different version of this level');
      else toast('Macro loaded ('+macro.ev.length+' inputs)');
      updatePauseUI();
    }).catch(function(){ toast('Not a macro file'); });
  });
  inp.click();
}

// ---------- screens ----------
function hideAllScreens(){
  [mainEl,levelsEl,onlineEl,myEl,detailEl,iconsEl,editorEl,pauseEl,winEl].forEach(function(el){
    el.classList.add('hidden');
  });
  pauseBtn.classList.add('hidden');
  edStopBtn.classList.add('hidden');
}
function menuScene(){
  curL=MENU_L; practice=false; macro.rec=false; macro.play=false;
  if(speedHack!==1) setSpeedHack(1);
  setSong({t:'b',i:0}); songOffset=0;
  reset();
}
function showMain(){
  state='main'; paused=false; hideAllScreens();
  mainEl.classList.remove('hidden');
  menuScene();
}
function showLevels(){
  state='levels'; paused=false; hideAllScreens();
  buildLevelList();
  levelsEl.classList.remove('hidden');
  menuScene();
}
function showOnline(){
  state='online'; paused=false; hideAllScreens();
  buildUploadList();
  onlineEl.classList.remove('hidden');
  menuScene();
}
function showMyLevels(){
  state='mylevels'; paused=false; hideAllScreens();
  buildMyList();
  myEl.classList.remove('hidden');
  menuScene();
}
function showIcons(){
  state='icons'; paused=false; hideAllScreens();
  buildIconPicker();
  iconsEl.classList.remove('hidden');
  menuScene();
}
function iconCanvas(mode, idx, px){
  const c=document.createElement('canvas');
  c.width=px; c.height=px;
  const pc=c.getContext('2d');
  pc.translate(px/2,px/2);
  drawFullIcon(pc, mode, idx, px*0.62);
  return c;
}
function buildIconPicker(){
  iconTabs.innerHTML='';
  ICON_MODES.concat(['col']).forEach(function(m){
    const b=document.createElement('button');
    b.className='icontab'+(iconMode===m?' active':'');
    b.textContent=ICON_LABELS[m];
    b.addEventListener('click',function(e){ e.stopPropagation(); iconMode=m; buildIconPicker(); });
    iconTabs.appendChild(b);
  });
  const pv=$('iconprev'); pv.innerHTML='';
  ICON_MODES.forEach(function(m){ pv.appendChild(iconCanvas(m, selectedIcons[m], 72)); });
  iconGrid.innerHTML='';
  if(iconMode==='col'){
    iconGrid.className='colgrid';
    [['c1','COLOR 1'],['c2','COLOR 2']].forEach(function(k){
      const lab=document.createElement('div'); lab.className='glabel'; lab.textContent=k[1];
      iconGrid.appendChild(lab);
      ICON_COLS.forEach(function(col,i){
        const b=document.createElement('button');
        b.className='swatch'+(selectedIcons[k[0]]===i?' on':'');
        b.style.background=col;
        b.addEventListener('click',function(e){ e.stopPropagation(); selectedIcons[k[0]]=i; saveIcons(); buildIconPicker(); });
        iconGrid.appendChild(b);
      });
    });
    const g=document.createElement('button');
    g.className='navbtn glowbtn'+(selectedIcons.glow?' green':'');
    g.textContent='GLOW: '+(selectedIcons.glow?'ON':'OFF');
    g.addEventListener('click',function(e){ e.stopPropagation(); selectedIcons.glow=selectedIcons.glow?0:1; saveIcons(); buildIconPicker(); });
    iconGrid.appendChild(g);
    return;
  }
  iconGrid.className='';
  for(let i=0;i<ICON_N;i++){
    const b=document.createElement('button');
    b.className='iconpick'+(selectedIcons[iconMode]===i?' active':'');
    b.title=ICON_LABELS[iconMode]+' '+(i+1);
    b.appendChild(iconCanvas(iconMode, i, 72));
    b.addEventListener('click',function(e){
      e.stopPropagation();
      selectedIcons[iconMode]=i;
      saveIcons();
      buildIconPicker();
    });
    iconGrid.appendChild(b);
  }
}
function buildMyList(){
  const ls=getMyLevels();
  myList.innerHTML='';
  if(!ls.length){
    const d=document.createElement('div');
    d.className='sub2';
    d.textContent='No levels yet - hit CREATE NEW to start building!';
    myList.appendChild(d);
    return;
  }
  ls.forEach(function(u){
    const row=document.createElement('div');
    row.className='uprow';
    row.innerHTML='<span class="upname">'+escHtml(u.name)+'</span>'
      +'<button class="upbtn">EDIT</button>'
      +'<button class="upbtn gray">PLAY</button>'
      +'<button class="upbtn gold" title="Copy this level as a main level entry for mainlevels.js">MAIN</button>'
      +'<button class="upbtn red">DEL</button>';
    const btns=row.querySelectorAll('button');
    btns[0].addEventListener('click',function(e){
      e.stopPropagation(); initAudio(); enterEditor(u.id);
    });
    btns[1].addEventListener('click',function(e){
      e.stopPropagation(); initAudio();
      const d=unpackLevel(u.d);
      if(objCount(d)<1){ toast('Level is empty - edit it first!'); return; }
      edCurId=u.id; spawnStart=null;
      startPlay(prepLevel(d),'mine');
    });
    btns[2].addEventListener('click',function(e){
      e.stopPropagation();
      const d=unpackLevel(u.d);
      if(objCount(d)<1){ toast('Level is empty - edit it first!'); return; }
      let diff=window.prompt('Difficulty for this main level?\n'+DIFFS.join(', '), 'EASY');
      if(diff===null) return;
      diff=(''+diff).toUpperCase().trim();
      if(DIFFS.indexOf(diff)<0) diff='EASY';
      const line='{name:'+JSON.stringify(d.name)+', diff:'+JSON.stringify(diff)+', code:'+JSON.stringify(levelCode(d))+'},';
      copyText(line, 'Copied! Paste it inside MAIN_LEVELS in mainlevels.js');
    });
    btns[3].addEventListener('click',function(e){
      e.stopPropagation();
      if(!window.confirm('Delete "'+u.name+'"?')) return;
      setMyLevels(getMyLevels().filter(function(x){ return x.id!==u.id; }));
      buildMyList();
    });
    myList.appendChild(row);
  });
}
function createNewLevel(){
  const id=Date.now().toString(36);
  const l=getMyLevels();
  l.unshift({id:id, name:'UNNAMED', d:packLevel(blankLevel('UNNAMED'))});
  setMyLevels(l);
  enterEditor(id);
}
function startPlay(L, ctxType, li){
  if(ctxType!=='test' && ctxType!=='edtest') spawnStart=null;
  curL=L; playCtx={type:ctxType, li:(li==null?0:li)};
  songOffset=+L.mo||0;
  setSong(L.song);
  attempts=1; state='play'; paused=false; practice=false;
  macro.play=false; macro.rec=false;
  if(ctxType!=='edtest') loadMacroFor();
  hideAllScreens();
  if(ctxType==='edtest') edStopBtn.classList.remove('hidden');
  else pauseBtn.classList.remove('hidden');
  reset(); initAudio();
}
function exitPlay(){
  if(canSaveBest() && !P.dead) saveBest(playCtx.li, pctNow());
  paused=false; practice=false; macro.rec=false; macro.play=false;
  if(speedHack!==1) setSpeedHack(1);
  if(AC && AC.state==='suspended') AC.resume();
  if(playCtx.type==='test') resumeEditor();
  else if(playCtx.type==='edtest') endEdTest(false);
  else if(playCtx.type==='mine') showMyLevels();
  else if(playCtx.type==='detail') showDetail(detailEntry);
  else if(playCtx.type==='online') showOnline();
  else showLevels();
}
function onWin(){
  if(playCtx.type==='edtest'){ endEdTest(false); toast('Reached the end!'); return; }
  if(canSaveBest()) saveBest(playCtx.li, 100);
  if(macro.rec && !macro.play && macro.ev.length){
    saveMacro(); toast('Macro saved ('+macro.ev.length+' inputs) - turn on BOT to replay it');
    macro.rec=false;
  }
  state='win';
  $('wintitle').textContent = practice ? 'PRACTICE COMPLETE!' : (macro.play ? 'BOT COMPLETE!' : 'LEVEL COMPLETE!');
  pauseBtn.classList.add('hidden');
  winEl.classList.remove('hidden');
  winSfx();
}
function togglePause(){
  if(state!=='play' || playCtx.type==='edtest') return;
  if(!paused){
    if(held) inputUp();
    paused=true; held=false;
    updatePauseUI();
    pauseEl.classList.remove('hidden'); pauseBtn.classList.add('hidden');
    if(AC && AC.state==='running') AC.suspend();
    if(songAudio) songAudio.pause();
  } else {
    paused=false;
    pauseEl.classList.add('hidden'); pauseBtn.classList.remove('hidden');
    if(AC && AC.state==='suspended') AC.resume();
    if(isFileTrack(TR) && TR.file) startSong(TR, null);
  }
}
function updatePauseUI(){
  $('ppractice').textContent = practice ? 'PRACTICE: ON' : 'PRACTICE: OFF';
  $('ppractice').classList.toggle('green', practice);
  $('pexit').textContent = playCtx.type==='test' ? 'EDITOR' : 'EXIT';
  $('mrec').textContent = macro.rec ? '● RECORDING' : '● RECORD';
  $('mrec').classList.toggle('red', macro.rec);
  $('mplay').textContent = macro.play ? '▶ BOT: ON' : '▶ BOT: OFF';
  $('mplay').classList.toggle('green', macro.play);
  $('mspeed').value=''+speedHack;
  $('pcam').value=''+OPT.cam; $('pcamv').textContent=OPT.cam;
  $('pvol').value=''+Math.round(OPT.vol*100); $('pvolv').textContent=Math.round(OPT.vol*100)+'%';
  $('macroinfo').textContent = macro.ev.length
    ? ('Macro: '+macro.ev.length+' inputs'+(macro.play?' - bot is playing, restart to watch it from the start':''))
    : 'No macro for this level yet. RECORD, then beat the level (practice deaths are cut out).';
  $('pkeys').textContent=keyList('restart')+' restart • '+keyList('practice')+' practice • '
    +keyList('cpadd')+' / '+keyList('cpdel')+' add / remove checkpoint • '+keyList('hitbox')+' hitboxes';
}

// ---------- settings + keybinds screen ----------
let setOpen=false, setCap=null;
function openSettingsScreen(){
  setOpen=true; setCap=null;
  if(held) inputUp();
  buildSettings();
  $('setscr').classList.remove('hidden');
}
function closeSettingsScreen(){
  setOpen=false; setCap=null;
  $('setscr').classList.add('hidden');
  if(state==='play' && paused) updatePauseUI();
}
function buildSettings(){
  const box=$('setbox');
  function row(label, inner){ return '<label class="frow"><span>'+label+'</span>'+inner+'</label>'; }
  function chk(id, on){ return '<input type="checkbox" id="'+id+'"'+(on?' checked':'')+'>'; }
  let h='<div class="mtitle">SETTINGS</div><button class="mclose" id="stClose">&#10005;</button><div class="mbody">';
  h+='<div class="msec">GAME</div>';
  h+=row('VOLUME <b id="stVolV">'+Math.round(OPT.vol*100)+'%</b>', '<input type="range" id="stVol" min="0" max="100" step="1" value="'+Math.round(OPT.vol*100)+'">');
  h+=row('CAMERA ZOOM <b id="stCamV">'+OPT.cam+'</b> blocks tall', '<input type="range" id="stCam" min="9" max="30" step="1" value="'+OPT.cam+'">');
  h+=row('SHOW HITBOXES', chk('stHit', OPT.hit));
  h+=row('PERCENT WITH DECIMALS', chk('stDec', OPT.dec));
  h+=row('AUTO CHECKPOINTS IN PRACTICE', chk('stAcp', OPT.acp));
  ['play','editor'].forEach(function(grp){
    h+='<div class="msec">'+(grp==='play'?'PLAYING KEYS':'EDITOR KEYS')+'</div>';
    KEY_ACTS.filter(function(a){ return a[2]===grp; }).forEach(function(a){
      const ks=KEYS[a[0]]||[];
      h+='<div class="krow"><span>'+a[1]+'</span>';
      [0,1].forEach(function(i){
        const cap=setCap && setCap.id===a[0] && setCap.i===i;
        h+='<button class="kbtn'+(cap?' cap':'')+'" data-k="'+a[0]+'" data-i="'+i+'">'+(cap?'PRESS A KEY':escHtml(keyName(ks[i])))+'</button>';
      });
      h+='<button class="kclr" data-c="'+a[0]+'" title="Clear">&#10005;</button></div>';
    });
  });
  h+='<div class="mhint">Click a key box, then press the key you want (Esc cancels). Clicking / tapping the screen always jumps too. Ctrl shortcuts in the editor (copy, paste, undo, save) stay the same.</div>';
  h+='<div class="mrowb"><button class="pbtn red" id="stReset">RESET ALL KEYS</button><button class="pbtn green" id="stDone">DONE</button></div></div>';
  box.innerHTML=h;
  function on(id, ev, fn){ const el=$(id); if(el) el.addEventListener(ev, fn); }
  on('stClose','click',function(e){ e.stopPropagation(); closeSettingsScreen(); });
  on('stDone','click',function(e){ e.stopPropagation(); closeSettingsScreen(); });
  on('stVol','input',function(){ setVolume((+this.value||0)/100); $('stVolV').textContent=this.value+'%'; });
  on('stCam','input',function(){ OPT.cam=+this.value||13; $('stCamV').textContent=OPT.cam; saveOpt(); });
  on('stHit','change',function(){ OPT.hit=this.checked?1:0; saveOpt(); });
  on('stDec','change',function(){ OPT.dec=this.checked?1:0; saveOpt(); });
  on('stAcp','change',function(){ OPT.acp=this.checked?1:0; saveOpt(); });
  on('stReset','click',function(e){ e.stopPropagation(); if(!window.confirm('Put every key back to default?')) return; KEYS=defaultKeys(); saveKeys(); setCap=null; buildSettings(); });
  box.querySelectorAll('.kbtn').forEach(function(b){
    b.addEventListener('click', function(e){ e.stopPropagation(); setCap={id:b.dataset.k, i:+b.dataset.i}; buildSettings(); });
  });
  box.querySelectorAll('.kclr').forEach(function(b){
    b.addEventListener('click', function(e){ e.stopPropagation(); KEYS[b.dataset.c]=[]; saveKeys(); setCap=null; buildSettings(); });
  });
}
function settingsKey(e){
  if(!setCap){
    if(e.code==='Escape'){ e.preventDefault(); closeSettingsScreen(); }
    return;
  }
  e.preventDefault();
  if(e.code==='Escape'){ setCap=null; buildSettings(); return; }
  const ks=(KEYS[setCap.id]||[]).slice();
  ks[setCap.i]=e.code;
  KEYS[setCap.id]=ks.filter(function(c,i,a){ return c && a.indexOf(c)===i; }).slice(0,2);
  saveKeys(); setCap=null; buildSettings();
}

// ---------- menu lists ----------
function faceSVG(diff){
  const cfg={
    'EASY':         {c:'#4fc8ff', d:0, a:0},
    'NORMAL':       {c:'#4dff62', d:0, a:0},
    'HARD':         {c:'#ffb340', d:0, a:1},
    'HARDER':       {c:'#ff7a2f', d:0, a:2},
    'INSANE':       {c:'#ff4dd2', d:0, a:2},
    'EASY DEMON':   {c:'#ff7b5c', d:1, a:2},
    'MEDIUM DEMON': {c:'#ff3b3b', d:1, a:2},
    'HARD DEMON':   {c:'#b3002d', d:1, a:2},
    'INSANE DEMON': {c:'#9b1fd6', d:1, a:3},
    'EXTREME DEMON':{c:'#2a0012', d:2, a:3}
  }[diff] || {c:'#aaaaaa', d:0, a:0};
  let s='<svg width="34" height="34" viewBox="0 0 40 40">';
  if(cfg.d===1){
    s+='<path d="M8 14 L3 2 L15 9 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>'
      +'<path d="M32 14 L37 2 L25 9 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>';
  } else if(cfg.d===2){
    s+='<path d="M7 15 L0 0 L17 8 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>'
      +'<path d="M33 15 L40 0 L23 8 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>'
      +'<path d="M20 7 L17 0 L23 0 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="1.6"/>';
  }
  s+='<circle cx="20" cy="22" r="15" fill="'+cfg.c+'" stroke="#111" stroke-width="2.5"/>';
  if(cfg.a===0){
    s+='<circle cx="14" cy="19" r="3.4" fill="#fff"/><circle cx="26" cy="19" r="3.4" fill="#fff"/>'
      +'<circle cx="14.8" cy="20" r="1.6" fill="#111"/><circle cx="26.8" cy="20" r="1.6" fill="#111"/>'
      +'<path d="M13 27 Q20 33 27 27" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  } else if(cfg.a===1){
    s+='<path d="M10 16 L18 19" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>'
      +'<path d="M30 16 L22 19" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>'
      +'<circle cx="14.5" cy="21.5" r="2.6" fill="#fff"/><circle cx="25.5" cy="21.5" r="2.6" fill="#fff"/>'
      +'<path d="M13 29 L27 29" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>';
  } else if(cfg.a===2){
    s+='<path d="M9 15 L18 20" stroke="#111" stroke-width="3" stroke-linecap="round"/>'
      +'<path d="M31 15 L22 20" stroke="#111" stroke-width="3" stroke-linecap="round"/>'
      +'<circle cx="14" cy="22" r="2.4" fill="#fff"/><circle cx="26" cy="22" r="2.4" fill="#fff"/>'
      +'<path d="M12 30 L16 27 L20 30 L24 27 L28 30" stroke="#111" stroke-width="2.5" fill="none" '
      +'stroke-linejoin="round" stroke-linecap="round"/>';
  } else {
    s+='<path d="M8 14 L19 19" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>'
      +'<path d="M32 14 L21 19" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>'
      +'<circle cx="14" cy="23" r="3" fill="#ffd23d"/><circle cx="26" cy="23" r="3" fill="#ffd23d"/>'
      +'<circle cx="14" cy="23" r="1.3" fill="#111"/><circle cx="26" cy="23" r="1.3" fill="#111"/>'
      +'<path d="M11 29 L15 32 L20 29 L25 32 L29 29" stroke="#111" stroke-width="2.5" fill="none" '
      +'stroke-linejoin="round" stroke-linecap="round"/>'
      +'<path d="M14 30 L15.2 34 L16.4 30 Z M23.6 30 L24.8 34 L26 30 Z" fill="#fff" stroke="#111" stroke-width="0.8"/>';
  }
  return s+'</svg>';
}
function levelHue(L){
  const c=(L.cc&&L.cc[CH_BG])||[40,90,200];
  const r=c[0]/255,g=c[1]/255,b=c[2]/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  if(!d) return 210;
  let h = mx===r ? 60*(((g-b)/d)%6) : mx===g ? 60*((b-r)/d+2) : 60*((r-g)/d+4);
  return Math.round((h+360)%360);
}
function buildLevelList(){
  lvlList.innerHTML='';
  if(!LEVELS.length){
    const d=document.createElement('div');
    d.className='sub2';
    d.innerHTML='No main levels yet.<br>Build one in the EDITOR, then press MAIN on it in My Levels<br>and paste the copied line into mainlevels.js.';
    lvlList.appendChild(d);
    return;
  }
  LEVELS.forEach(function(L,i){
    const best=getBest(i), hue=levelHue(L);
    const el=document.createElement('div');
    el.className='lvlbtn';
    el.style.background='linear-gradient(135deg,hsl('+hue+',70%,42%),hsl('+((hue+45)%360)+',70%,28%))';
    el.innerHTML='<div class="lrow"><span class="lface">'+faceSVG(L.diff)+'</span>'
      +'<span class="lname">'+escHtml(L.name)+'</span><span class="ldiff">'+escHtml(L.diff)+'</span></div>'
      +'<div class="lbot"><div class="lbar"><div style="width:'+best+'%"></div></div>'
      +'<span class="lpct">'+best+'%</span></div>';
    el.addEventListener('click',function(e){
      e.stopPropagation(); initAudio(); startPlay(LEVELS[i],'campaign',i);
    });
    lvlList.appendChild(el);
  });
}
function buildUploadList(){
  const ups=getUploads().concat(BUILTIN_UPLOADS);
  upList.innerHTML='';
  const head=document.createElement('div');
  head.className='sub2';
  head.textContent=ups.length+' LEVEL'+(ups.length===1?'':'S')+' UPLOADED';
  upList.appendChild(head);
  ups.forEach(function(u){
    const meta=getMeta(u.id);
    const likes=levelBaseLikes(u)+(meta.liked?1:0);
    const row=document.createElement('div');
    row.className='uprow uprow-click';
    row.innerHTML='<span class="lface">'+faceSVG(meta.diff>=0?DIFFS[meta.diff]:'')+'</span>'
      +'<span class="upname">'+escHtml(u.name)+'</span>'
      +'<span class="upsummary">'+(meta.stars||0)+'&#9733; &#9829;'+likes+'</span>';
    row.addEventListener('click',function(e){
      e.stopPropagation(); initAudio(); showDetail(u);
    });
    upList.appendChild(row);
  });
}
let detailEntry=null;
function showDetail(entry){
  detailEntry=entry;
  state='detail'; paused=false; hideAllScreens();
  detailEl.classList.remove('hidden');
  menuScene();
  renderDetail();
}
function renderDetail(){
  const e=detailEntry; if(!e) return;
  const meta=getMeta(e.id);
  const likes=levelBaseLikes(e)+(meta.liked?1:0);
  const dName=meta.diff>=0?DIFFS[meta.diff]:'UNRATED';
  const body=$('detailbody');
  body.innerHTML=
     '<div class="dtitle">'+escHtml(e.name)+'</div>'
    +'<div class="dface">'+faceSVG(meta.diff>=0?DIFFS[meta.diff]:'')+'</div>'
    +'<div class="dmeta">'+dName+' &bull; '+(meta.stars||0)+'&#9733; &bull; '
      +'<span class="dlikes">&#9829; '+likes+'</span></div>'
    +'<div class="drow">'
      +'<button class="navbtn green" id="dplay">&#9654; PLAY</button>'
      +'<button class="navbtn" id="dlike">'+(meta.liked?'&#9829; LIKED':'&#9825; LIKE')+'</button>'
    +'</div>'
    +'<div class="ratebox">'
      +'<div class="ratetitle">SET RATING &mdash; only you can see this</div>'
      +'<div class="bigstars" id="bigstars"></div>'
      +'<div class="raterow"><span>Difficulty:</span><select id="ddiff" class="rdiff2"></select></div>'
      +'<button class="navbtn green" id="dconfirm">CONFIRM</button>'
      +'<div class="ratehint">2&#9733; Easy &middot; 3&#9733; Normal &middot; 4-5&#9733; Hard &middot; '
        +'6-7&#9733; Harder &middot; 8-9&#9733; Insane &middot; 10&#9733; Demon</div>'
    +'</div>'
    +'<div class="drow">'
      +'<button class="navbtn" id="dcopy">COPY CODE</button>'
      +(e.builtin?'':'<button class="navbtn" id="ddel">DELETE</button>')
    +'</div>';

  let pStars=meta.stars||0;
  let pDiff=(meta.diff>=0?meta.diff:starToDiff(pStars||2));
  const ddiff=$('ddiff');
  DIFFS.forEach(function(dn,di){
    const o=document.createElement('option'); o.value=di; o.textContent=dn; ddiff.appendChild(o);
  });
  ddiff.value=pDiff;
  ddiff.addEventListener('change',function(){ pDiff=+ddiff.value; });
  ddiff.addEventListener('pointerdown',function(ev){ ev.stopPropagation(); });
  const bs=$('bigstars');
  function drawStars(){
    bs.innerHTML='';
    for(let s=1;s<=10;s++){
      const st=document.createElement('span');
      st.className='bstar'+(s<=pStars?' on':''); st.textContent=String.fromCharCode(9733);
      (function(sv){
        st.addEventListener('click',function(ev){
          ev.stopPropagation();
          pStars=(pStars===sv?0:sv);
          pDiff=starToDiff(pStars||2); ddiff.value=pDiff;
          drawStars();
        });
      })(s);
      bs.appendChild(st);
    }
  }
  drawStars();

  $('dplay').addEventListener('click',function(ev){
    ev.stopPropagation(); initAudio();
    const d=unpackLevel(e.d);
    if(objCount(d)<1){ toast('Level is empty'); return; }
    startPlay(prepLevel(d),'detail');
  });
  $('dlike').addEventListener('click',function(ev){
    ev.stopPropagation();
    const m=getMeta(e.id); m.liked=!m.liked; setMeta(e.id,m); renderDetail();
  });
  $('dconfirm').addEventListener('click',function(ev){
    ev.stopPropagation();
    const m=getMeta(e.id); m.stars=pStars; m.diff=pDiff; setMeta(e.id,m);
    toast('Rating updated!'); renderDetail();
  });
  $('dcopy').addEventListener('click',function(ev){
    ev.stopPropagation();
    copyText(levelCode(unpackLevel(e.d)), 'Level code copied!');
  });
  if(!e.builtin){
    $('ddel').addEventListener('click',function(ev){
      ev.stopPropagation();
      if(!window.confirm('Delete "'+e.name+'"?')) return;
      setUploads(getUploads().filter(function(x){ return x.id!==e.id; }));
      showOnline();
    });
  }
}

// ---------- input ----------
function press(){
  initAudio();
  if(state==='win'){
    winEl.classList.add('hidden');
    exitPlay();
    return;
  }
  inputDown();
}
window.addEventListener('pointerdown', function(e){
  if(e.target && e.target.closest &&
     e.target.closest('button,input,select,textarea,.lvlbtn,.uprow,.upitem,#editorui,.overlay .pbox,#setscr')) return;
  if(setOpen) return;
  if(state==='edit') return;
  e.preventDefault();
  press();
});
window.addEventListener('pointerup', function(){ inputUp(); });
window.addEventListener('pointercancel', function(){ inputUp(); });
muteBtn.addEventListener('click', function(e){ e.stopPropagation(); toggleMute(); });
pauseBtn.addEventListener('click', function(e){ e.stopPropagation(); togglePause(); });
edStopBtn.addEventListener('click', function(e){ e.stopPropagation(); if(state==='play') endEdTest(false); });
$('btnplay').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); showLevels(); });
$('btneditor').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); showMyLevels(); });
$('btnicons').addEventListener('click', function(e){ e.stopPropagation(); showIcons(); });
$('createbtn').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); createNewLevel(); });
$('backmylevels').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('btnonline').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); showOnline(); });
$('backlevels').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('backonline').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('backdetail').addEventListener('click', function(e){ e.stopPropagation(); showOnline(); });
$('backicons').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('importbtn').addEventListener('click', function(e){
  e.stopPropagation();
  const code=window.prompt('Paste a level code (starts with JD1. or JD2.):');
  if(!code) return;
  const d=decodeLevel(code);
  if(!d){ toast('Invalid level code'); return; }
  const ups=getUploads();
  ups.unshift({id:Date.now().toString(36), name:d.name, d:packLevel(d), date:Date.now()});
  setUploads(ups);
  buildUploadList();
  toast('Imported "'+d.name+'"!');
});
$('presume').addEventListener('click', function(e){ e.stopPropagation(); togglePause(); });
function restartAttempt(full){
  if(!full && practice && checkpoints.length && !macro.play && state==='play') respawnCheckpoint();
  else { attempts++; reset(); }
  updatePauseUI();
}
$('prestart').addEventListener('click', function(e){
  e.stopPropagation();
  restartAttempt();
  paused=false; pauseEl.classList.add('hidden'); pauseBtn.classList.remove('hidden');
  if(AC && AC.state==='suspended') AC.resume();
});
$('pexit').addEventListener('click', function(e){
  e.stopPropagation(); pauseEl.classList.add('hidden'); exitPlay();
});
$('ppractice').addEventListener('click', function(e){
  e.stopPropagation();
  if(macro.play){ toast('Turn the bot off first'); return; }
  setPractice(!practice);
});
$('mrec').addEventListener('click', function(e){
  e.stopPropagation();
  macro.rec=!macro.rec;
  if(macro.rec){ macro.play=false; toast('Recording from the next restart. Practice deaths get cut out.'); restartAttempt(true); }
  updatePauseUI();
});
$('mplay').addEventListener('click', function(e){
  e.stopPropagation();
  if(!macro.play && !macro.ev.length){ toast('No macro yet - RECORD one or LOAD a file'); return; }
  macro.play=!macro.play;
  if(macro.play){ macro.rec=false; practice=false; held=false; restartAttempt(true); }
  updatePauseUI();
});
$('msave').addEventListener('click', function(e){ e.stopPropagation(); downloadMacro(); });
$('mload').addEventListener('click', function(e){ e.stopPropagation(); uploadMacro(); });
$('mspeed').addEventListener('change', function(){ setSpeedHack(+this.value||1); });
$('pcam').addEventListener('input', function(){ OPT.cam=+this.value||13; $('pcamv').textContent=OPT.cam; saveOpt(); });
$('pvol').addEventListener('input', function(){ setVolume((+this.value||0)/100); $('pvolv').textContent=this.value+'%'; });
['mspeed','pcam','pvol'].forEach(function(id){ $(id).addEventListener('pointerdown', function(e){ e.stopPropagation(); }); });
function isTyping(e){
  const t=e.target; return t && (t.tagName==='INPUT' || t.tagName==='SELECT' || t.tagName==='TEXTAREA');
}
$('psettings').addEventListener('click', function(e){ e.stopPropagation(); openSettingsScreen(); });
$('btnsettings').addEventListener('click', function(e){ e.stopPropagation(); openSettingsScreen(); });
window.addEventListener('keydown', function(e){
  if(setOpen){ settingsKey(e); return; }
  if(state==='edit'){ if(typeof edKey==='function') edKey(e); return; }
  if(isTyping(e)) return;
  const inPlay=state==='play' && !paused;
  if(keyIs(e,'jump')){
    e.preventDefault();
    if(!e.repeat) press(); else inputHold();
  }
  else if(state==='play' && keyIs(e,'pause')){ e.preventDefault(); if(playCtx.type==='edtest') endEdTest(false); else togglePause(); }
  else if(keyIs(e,'mute')) toggleMute();
  else if(keyIs(e,'restart') && inPlay && playCtx.type!=='edtest'){ restartAttempt(); }
  else if(keyIs(e,'cpadd') && inPlay && practice){ addCheckpoint(); toast('Checkpoint placed'); }
  else if(keyIs(e,'cpdel') && inPlay && practice){ removeCheckpoint(); toast('Checkpoint removed'); }
  else if(keyIs(e,'practice') && inPlay && playCtx.type!=='edtest' && !macro.play){ setPractice(!practice); }
  else if(keyIs(e,'hitbox')){ OPT.hit=OPT.hit?0:1; saveOpt(); toast('Hitboxes '+(OPT.hit?'ON':'OFF')); }
  else if(e.code==='Escape'){
    if(state==='play'){ if(playCtx.type==='edtest') endEdTest(false); }
    else if(state==='detail') showOnline();
    else if(state==='levels'||state==='online'||state==='mylevels'||state==='icons') showMain();
    else if(state==='win'){ winEl.classList.add('hidden'); exitPlay(); }
  }
});
window.addEventListener('keyup', function(e){
  if(keyIs(e,'jump')) inputUp();
});
window.addEventListener('resize', resize);

// ---------- simulation ----------
function die(){
  P.dead=true; deadT=0; shake=14; dash=null;
  deathX=P.x+PB/2; deathY=P.y+PB/2;
  if(canSaveBest()) saveBest(playCtx.li, pctNow());
  for(let i=0;i<32;i++){
    const a=Math.random()*Math.PI*2, v=B*(0.05+Math.random()*0.14);
    particles.push({x:deathX,y:deathY,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
      g:0.04*B/44, life:34, max:34, size:B*(0.08+Math.random()*0.1),
      col: Math.random()<0.6 ? '90,255,110' : '255,255,255'});
  }
  deathSfx();
}
function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--;
    if(p.life<=0) particles.splice(i,1);
  }
}
function burst(x,y,col,n){
  for(let j=0;j<n;j++){
    const a=Math.random()*Math.PI*2, v=B*(0.04+Math.random()*0.08);
    particles.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v, g:0, life:16, max:16, size:B*0.09, col:col});
  }
}
function spikeHits(s, mh, mv){
  const cx=(egx(s)+0.5)*B+s._ox, cy=groundY-(egy(s)+0.5)*B+s._oy;
  const prx=PB/2-mh, pry=PB/2-mv;
  if(prx<=0 || pry<=0) return false;
  const dx=P.x+PB/2-cx, dy=P.y+PB/2-cy;
  const c=s._c, sn=s._s, ac=Math.abs(c), as=Math.abs(sn), hw=s._hw, hh=s._hh;
  if(Math.abs(dx) >= prx + ac*hw + as*hh) return false;
  if(Math.abs(dy) >= pry + as*hw + ac*hh) return false;
  if(Math.abs(dx*c+dy*sn) >= hw + prx*ac + pry*as) return false;
  if(Math.abs(-dx*sn+dy*c) >= hh + prx*as + pry*ac) return false;
  return true;
}
function step(){
  ftick++;
  if(state!=='play' || paused){ if(!paused) updateParticles(); return; }
  if(P.dead){
    deadT++;
    if(playCtx.type==='edtest'){ if(deadT>30) endEdTest(true); }
    else if(practice && checkpoints.length){ if(deadT>28) respawnCheckpoint(); }
    else if(deadT>55){ attempts++; reset(); }
    updateParticles(); return;
  }
  if(macro.play) applyBot();
  const spd=SPEED*speedMult;
  const prevY = P.y;
  P.x += spd;

  for(let i=0;i<curL.portals.length;i++){
    if(portalHit[i]) continue;
    const p=curL.portals[i], pgx=egx(p), pgy=egy(p), sc=p.sc||1;
    if(isOff(p)) continue;
    if(pgy>0 || p._horiz || sc!==1){
      const cx=(pgx+0.5)*B, cy=groundY-(pgy+1.5)*B;
      const halfW=(p._horiz?1.6:0.55)*B*sc, halfH=(p._horiz?0.55:1.6)*B*sc;
      if(P.x+PB <= cx-halfW || P.x >= cx+halfW) continue;
      if(P.y+PB <= cy-halfH || P.y >= cy+halfH) continue;
    } else {
      if(P.x+PB <= pgx*B || P.x >= (pgx+1)*B) continue;
    }
    portalHit[i]=true;
    enterPortal(p.m);
  }
  for(let i=0;i<curL.speeds.length;i++){
    if(speedHit[i]) continue;
    const sg=curL.speeds[i], sgx=egx(sg), sgy=egy(sg);
    if(isOff(sg)) continue;
    if(P.x+PB <= sgx*B || P.x >= (sgx+1)*B) continue;
    if(sgy>0){
      const top=groundY-(sgy+2)*B, bot=groundY-sgy*B;
      if(P.y+PB <= top || P.y >= bot) continue;
    }
    speedHit[i]=true; speedMult=SPDS[sg.t].m;
  }
  if(curL.triggers) for(let i=0;i<curL.triggers.length;i++){
    if(trigFired[i]) continue;
    const tr=curL.triggers[i];
    if(tr.sp) continue;
    if(P.x+PB/2 < tr.gx*B) continue;
    trigFired[i]=true;
    if(tr.tg && groupDis[tr.tg]) continue;
    fireTrigger(tr, false, 0);
  }
  for(let i=spawnQ.length-1;i>=0;i--){
    if(spawnQ[i].t<=simTick){ const g=spawnQ[i].g; spawnQ.splice(i,1); spawnGroup(g, false, 0); }
  }

  const gsw = gravSwing>0 ? 0.16 : 1, jm = mini ? 0.8 : 1;
  let orbHit=false;
  if(pressBuf>((mode==='ship'||mode==='wave')&&!dash?6:0) && curL.orbs){
    for(let i=0;i<curL.orbs.length;i++){
      if(orbUsed[i]) continue;
      const o=curL.orbs[i], sc=o.sc||1;
      if(isOff(o)) continue;
      const dx=P.x+PB/2-(egx(o)+0.5)*B, dy=P.y+PB/2-(groundY-(egy(o)+0.5)*B);
      if(dx*dx+dy*dy >= 1.1*B*B*sc*sc) continue;
      orbUsed[i]=true; pressBuf=0; orbHit=true;
      robotBoost=0;
      let col='255,225,77';
      if(o.k==='b'){ snapGravity(-gdir, false); P.vy=gdir*JUMPV*0.28; col='70,150,255'; }
      else if(o.k==='g'){
        snapGravity(-gdir, false);
        const f = mode==='ship' ? 0.8 : mode==='ball' ? 0.95 : 1;
        P.vy = -JUMPV*gdir*f*jm; P.onGround=false; col='60,235,80';
      }
      else if(o.k==='d' || o.k==='q'){
        let a=((o.rot||0)%360+540)%360-180;
        if(a>90) a=180-a; else if(a<-90) a=-180-a;
        a=Math.max(-70,Math.min(70,a));
        dash={t:Math.tan(a*Math.PI/180), flip:o.k==='q'};
        P.vy=SPEED*speedMult*dash.t; P.onGround=false; col=o.k==='q'?'255,90,200':'80,255,120';
      } else {
        let f;
        if(mode==='ship') f = o.k==='r'?1.0 : o.k==='k'?-0.8 : 0.8;
        else if(mode==='ball') f = o.k==='p'?0.7 : o.k==='r'?1.25 : o.k==='k'?-1.0 : 0.95;
        else f = o.k==='p'?0.75 : o.k==='r'?1.32 : o.k==='k'?-1.1 : 1;
        P.vy = -JUMPV*gdir*f*jm;
        P.onGround=false;
        col = o.k==='p' ? '255,123,213' : o.k==='r' ? '255,70,70' : o.k==='k' ? '40,40,40' : '255,225,77';
      }
      burst(P.x+PB/2, P.y+PB/2, col, 10);
      orbSfx();
      break;
    }
  }
  if(dash && !held){ const fl=dash.flip; dash=null; if(fl) snapGravity(-gdir, false); }
  if(dash){
    P.vy = SPEED*speedMult*dash.t;
  } else if(orbHit){
  } else if(mode==='ship'){
    const k=mini?1.15:1, rising=P.vy*gdir<0;
    const acc = held ? -0.0175*(rising?1:1.4) : 0.0115*(rising?1.4:1);
    P.vy += acc*B*gdir*k;
    const up=0.30*B, down=0.27*B;
    if(gdir>0){ if(P.vy > down) P.vy = down; if(P.vy < -up) P.vy = -up; }
    else { if(P.vy < -down) P.vy = -down; if(P.vy > up) P.vy = up; }
  } else if(mode==='wave'){
    P.vy = (held ? -1 : 1) * spd * gdir * (mini?2:1);
  } else if(mode==='ball'){
    if(flipQueued && P.onGround){ toggleGravity(); }
    P.vy += GRAV*gsw*gdir;
    const mv=B*0.55;
    if(P.vy >  mv) P.vy =  mv;
    if(P.vy < -mv) P.vy = -mv;
   } else if(mode==='robot'){
    if(P.onGround && pressBuf>0){ P.vy = -ROBOT_V*jm*gdir; P.onGround=false; robotBoost=ROBOT_FR; pressBuf=0; }
    if(robotBoost>0 && held && P.vy*gdir<0){ P.vy = -ROBOT_V*jm*gdir; robotBoost--; }
    else {
      robotBoost=0;
      P.vy += GRAV*gsw*gdir;
      const mv=B*0.6;
      if(gdir>0){ if(P.vy >  mv) P.vy =  mv; }
      else { if(P.vy < -mv) P.vy = -mv; }
    }
    } else if(mode==='spider'){
    if(P.onGround && pressBuf>0 && spiderTeleport()) pressBuf=0;
    P.vy += GRAV*gsw*gdir;
    const mv=B*0.6;
    if(gdir>0){ if(P.vy >  mv) P.vy =  mv; }
    else { if(P.vy < -mv) P.vy = -mv; }
  } else if(mode==='ufo'){
    if(flipQueued){ P.vy = -JUMPV*0.86*jm*gdir; P.onGround=false; }
    P.vy += GRAV*gsw*gdir;
    const mv=B*0.6;
    if(gdir>0){ if(P.vy >  mv) P.vy =  mv; }
    else { if(P.vy < -mv) P.vy = -mv; }
  } else {
    if(held && P.onGround){ P.vy = -JUMPV*jm*gdir; P.onGround=false; }
    P.vy += GRAV*gsw*gdir;
    const mv=B*0.6;
    if(gdir>0){ if(P.vy >  mv) P.vy =  mv; }
    else { if(P.vy < -mv) P.vy = -mv; }
  }
  if(gravSwing>0) gravSwing--;
  flipQueued=false;
  P.y += P.vy;
  P.onGround = false;

  const hbi = (mode==='wave') ? PB*0.30 : 0;
  const fly = (mode==='ship'||mode==='ball'||mode==='wave');
  const soft = fly || mode==='ufo' || !!dash;
  const prevPB = prevY + PB - hbi, prevPT = prevY + hbi;

  if(gdir>0){
    if(P.y + PB - hbi >= groundY){ P.y = groundY - PB + hbi; P.vy = 0; P.onGround = true; }
    if(soft && mode!=='cube' && P.y + hbi <= ceilingY()){
      P.y = ceilingY() - hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
    }
  } else {
    if(mode!=='cube' && mode!=='robot' && P.y + hbi <= ceilingY()){
      P.y = ceilingY() - hbi; P.vy = 0; P.onGround = true;
    }
    if(soft && P.y + PB - hbi >= groundY){
      P.y = groundY - PB + hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
    }
  }

  let onSlope=false, floorSurf=Infinity, ceilSurf=Infinity;
  if(curL.slopes){
    for(let i=0;i<curL.slopes.length;i++){
      const s=curL.slopes[i], o=s.o||0, sc=s.sc||1, sw=s.w||1, sh=s.h||1;
      if(isOff(s)) continue;
      const ccx=egx(s)+sw/2, ccy=egy(s)+sh/2;
      const x0=(ccx-sw*sc/2)*B, x1=(ccx+sw*sc/2)*B;
      const cxp=P.x+PB/2;
      if(cxp <= x0 || cxp >= x1) continue;
      const f=(cxp - x0)/(x1-x0);
      const baseBot=groundY-(ccy-sh*sc/2)*B, baseTop=groundY-(ccy+sh*sc/2)*B, hgt=baseBot-baseTop;
      const ceil=(o>=2), tallLeft=(o===1||o===3);
      const surf=(o===0||o===3) ? baseBot - f*hgt : baseTop + f*hgt;
      const entered=((cxp-spd) <= x0);
      if(!ceil){
        const foot=P.y+PB-hbi;
        if(foot < surf-2) continue;
        if(foot > baseBot + B*0.5) continue;
        if(tallLeft && entered && (foot-surf) > B*0.4){ die(); updateParticles(); return; }
        if(mode==='wave'){ if(!s._d && !dash){ die(); updateParticles(); return; } if(foot<surf) continue; }
        onSlope=true; if(surf<floorSurf) floorSurf=surf;
      } else {
        const head=P.y+hbi;
        if(head > surf+2) continue;
        if(head < baseTop - B*0.5) continue;
        if(tallLeft && entered && (surf-head) > B*0.4){ die(); updateParticles(); return; }
        if(mode==='wave'){ if(!s._d && !dash){ die(); updateParticles(); return; } if(head>surf) continue; }
        onSlope=true; if(surf<ceilSurf) ceilSurf=surf;
      }
    }
  }
  if(floorSurf<Infinity && (P.vy>=-0.01 || mode==='wave')){ P.y=floorSurf-PB+hbi; P.vy=0; P.onGround=true; }
  if(ceilSurf<Infinity){ P.y=ceilSurf-hbi; if(P.vy<0) P.vy=0; if(mode!=='cube') P.onGround=true; }

  for(let i=0;i<curL.blocks.length && !onSlope;i++){
    const b=curL.blocks[i];
    if(b._nc || isOff(b)) continue;
    const cx=egx(b)+b._cx, cy=egy(b)+b._cy;
    const L=(cx-b._hw)*B, R=(cx+b._hw)*B, T=groundY-(cy+b._hh)*B, BO=groundY-(cy-b._hh)*B;
    if(P.x+PB-hbi-2 <= L || P.x+hbi+2 >= R) continue;
    if(P.y+PB-hbi <= T || P.y+hbi >= BO) continue;
    if(mode==='wave' && !dash && !b._d){ die(); updateParticles(); return; }
    if(gdir>0){
      if(P.vy >= 0 && prevPB <= T + Math.max(10, P.vy*1.5)){
        P.y = T - PB + hbi; P.vy = 0; P.onGround = true;
      } else if(P.vy <= 0 && prevPT >= BO - Math.max(10, -P.vy*1.5)){
        if(soft && mode!=='ball'){ P.y = BO - hbi; P.vy = 0; }
        else if(mode==='ball'){ P.y = BO - hbi; P.vy = 0; P.onGround = true; }
        else { die(); updateParticles(); return; }
      } else if(P.y+PB-hbi - T < B*0.3){
        P.y = T - PB + hbi; P.vy = 0; P.onGround = true;
      } else if(soft && BO - (P.y+hbi) < B*0.3){
        P.y = BO - hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
      } else { die(); updateParticles(); return; }
    } else {
      if(P.vy <= 0 && prevPT >= BO - Math.max(10, -P.vy*1.5)){
        P.y = BO - hbi; P.vy = 0; P.onGround = true;
      } else if(P.vy >= 0 && prevPB <= T + Math.max(10, P.vy*1.5)){
        if(soft){ P.y = T - PB + hbi; P.vy = 0; if(mode==='ball') P.onGround = true; }
        else { die(); updateParticles(); return; }
      } else if(BO - (P.y+hbi) < B*0.3){
        P.y = BO - hbi; P.vy = 0; P.onGround = true;
      } else if(soft && P.y+PB-hbi - T < B*0.3){
        P.y = T - PB + hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
      } else { die(); updateParticles(); return; }
    }
  }

  if((mode==='cube' || mode==='robot') && !dash){
    if(P.y + hbi <= groundY-500*B){ die(); updateParticles(); return; }
    if(gdir<0 && P.y + PB - hbi >= groundY){ die(); updateParticles(); return; }
  }

  const smh=6*PB/B+hbi, smv=4*PB/B+hbi;
  for(let i=0;i<curL.spikes.length;i++){
    if(!isOff(curL.spikes[i]) && spikeHits(curL.spikes[i], smh, smv)){ die(); updateParticles(); return; }
  }

  if(curL.saws){
    for(let i=0;i<curL.saws.length;i++){
      const s=curL.saws[i];
      if(isOff(s)) continue;
      const cx=(egx(s)+0.5)*B, cy=groundY-(egy(s)+0.5)*B, rad=SAW_HIT[s.sz||0]*B*(s.sc||1);
      const nx=Math.max(P.x+hbi, Math.min(cx, P.x+PB-hbi));
      const ny=Math.max(P.y+hbi, Math.min(cy, P.y+PB-hbi));
      const dx=cx-nx, dy=cy-ny;
      if(dx*dx+dy*dy < rad*rad){ die(); updateParticles(); return; }
    }
  }

  if(pressBuf>0) pressBuf--;

  if(curL.pads){
    for(let i=0;i<curL.pads.length;i++){
      if(padCool[i]>0){ padCool[i]--; continue; }
      const pd=curL.pads[i], sc=pd.sc||1;
      if(isOff(pd)) continue;
      const px=(egx(pd)+0.5)*B, py=groundY-(egy(pd)+0.5)*B;
      if(Math.abs(P.x+PB/2-px) < B*0.55*sc && Math.abs(P.y+PB/2-py) < B*0.62*sc){
        padCool[i]=14;
      robotBoost=0;
        const oc = pd.k==='p' ? '255,123,213' : pd.k==='b' ? '70,150,255' : '255,225,77';
        if(pd.k==='b'){
          snapGravity(-gdir, false);
        } else {
          const f = pd.k==='p' ? 0.85 : 1.2;
          P.vy = -JUMPV*f*gdir*jm; P.onGround=false;
        }
        for(let j=0;j<12;j++){
          const a=Math.random()*Math.PI*2, v=B*(0.05+Math.random()*0.09);
          particles.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
            g:0, life:18, max:18, size:B*0.1, col:oc});
        }
        orbSfx();
      }
    }
  }

  if(dash){
    if(mode==='ship'||mode==='wave') P.rot=Math.atan(dash.t);
    else P.rot+=0.32*gdir;
    if(ftick%2===0) particles.push({x:P.x, y:P.y+PB/2, vx:-(2+Math.random()*2), vy:(Math.random()-0.5),
      g:0, life:16, max:16, size:PB*0.18, col:(dash.flip?'255,90,200':'80,255,120')});
  } else if(mode==='ship'){
    const tgt = Math.atan2(P.vy, SPEED*speedMult*2.5);
    P.rot += (tgt - P.rot)*0.3;
    if(held && ftick%2===0){
      particles.push({x:P.x-2, y:P.y+PB*0.7,
        vx:-(2+Math.random()*2), vy:(Math.random()-0.3)*1.5,
        g:0, life:14, max:14, size:PB*0.12, col:'255,170,60'});
    }
  } else if(mode==='wave'){
    P.rot += (((held?-1:1)*gdir*(mini?1.107:Math.PI/4)) - P.rot)*0.5;
  } else if(mode==='ball'){
    P.rot += (SPEED*speedMult/PB)*0.95*gdir;
    if(P.onGround && ftick%3===0){
      particles.push({x:P.x+3, y:P.y+(gdir>0?PB-2:2),
        vx:-(1+Math.random()*2), vy:(gdir>0?-1:1)*(0.5+Math.random()),
        g:0.1*gdir, life:16, max:16, size:PB*0.1, col:'255,240,150'});
    }
  } else if(mode==='ufo'){
    P.rot += (0 - P.rot)*0.3;
    if(ftick%2===0){
      particles.push({x:P.x+PB*0.5, y:P.y+(gdir>0?PB-2:2),
        vx:-(1+Math.random()*2), vy:(gdir>0?1:-1)*(0.4+Math.random()),
        g:0, life:14, max:14, size:PB*0.1, col:'255,150,40'});
    }
   } else if(mode==='robot'){
    P.rot=0;
    if(P.onGround && ftick%3===0){
      const py = gdir>0 ? P.y+PB-2 : P.y+2;
      particles.push({x:P.x+3, y:py,
        vx:-(1+Math.random()*2), vy:(gdir>0?-1:1)*(0.5+Math.random()*1.5),
        g:0.1*gdir, life:18, max:18, size:PB*0.1, col:'255,240,150'});
    }
    if(robotBoost>0 && ftick%2===0){
      particles.push({x:P.x+PB*0.4, y:P.y+(gdir>0?PB:0),
        vx:-(1+Math.random()*2), vy:(gdir>0?1:-1)*(1+Math.random()),
        g:0, life:12, max:12, size:PB*0.12, col:'255,170,60'});
    }
   } else if(mode==='spider'){
    P.rot=0;
    if(P.onGround && ftick%3===0){
      const py = gdir>0 ? P.y+PB-2 : P.y+2;
      particles.push({x:P.x+3, y:py,
        vx:-(1+Math.random()*2), vy:(gdir>0?-1:1)*(0.5+Math.random()*1.5),
        g:0.1*gdir, life:18, max:18, size:PB*0.1, col:'200,140,255'});
    }
  } else if(P.onGround){
    const target = Math.round(P.rot/(Math.PI/2))*(Math.PI/2);
    P.rot += (target - P.rot)*0.5;
    if(ftick%3===0){
      const py = gdir>0 ? P.y+PB-2 : P.y+2;
      particles.push({x:P.x+3, y:py,
        vx:-(1+Math.random()*2), vy:(gdir>0?-1:1)*(0.5+Math.random()*1.5),
        g:0.1*gdir, life:18, max:18, size:PB*0.1, col:'255,240,150'});
    }
  } else {
    P.rot += ROTS*gdir/jm;
  }

  let seg=waveTrail[waveTrail.length-1];
  if(mode==='wave' && !dash){
    if(!seg || seg.done){ seg={pts:[], w:PB}; waveTrail.push(seg); }
    seg.pts.push(P.x+PB/2, P.y+PB/2);
  } else if(seg) seg.done=true;
  while(waveTrail.length){
    const f=waveTrail[0].pts;
    while(f.length>4 && f[2]<P.x-30*B) f.splice(0,2);
    if(waveTrail[0].done && (f.length<4 || f[f.length-2]<P.x-30*B)) waveTrail.shift(); else break;
  }
  shipAnim += (((mode==='ship'||mode==='ball'||mode==='wave')?1:0) - shipAnim)*0.08;
  updateAnims();
  simTick++;
  if(practice && OPT.acp && simTick-lastCpTick>=90 && !dash && (P.onGround || mode!=='cube')) addCheckpoint();
  if(playCtx.type==='edtest' && simTick%2===0 && typeof edTrail!=='undefined'){
    edTrail.push(P.x+PB/2, P.y+PB/2);
    if(edTrail.length>40000) edTrail.splice(0,2);
  }
  camX = P.x - playerScreenX();
  if(P.x >= curL.endX*B){ onWin(); }
  updateParticles();
}

// ---------- main loop ----------
let last=0, acc=0;
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min(50, t-last); last=t;
  if(paused){ acc=0; render(); return; }
  acc+=dt*(state==='play'?speedHack:1);
  let n=0;
  while(acc >= 1000/60 && n<8){ step(); acc -= 1000/60; n++; }
  if(n>=8) acc=0;
  render();
}
function render(){
  if(state==='edit'){ renderEditor(); return; }
  renderGame();
}
function boot(){
  resize();
  LEVELS=(typeof MAIN_LEVELS!=='undefined' && Array.isArray(MAIN_LEVELS) ? MAIN_LEVELS : []).map(function(e){
    const d=e && decodeLevel(e.code);
    if(!d) return null;
    const L=prepLevel(d, (''+(e.diff||'EASY')).toUpperCase());
    L.name=(''+(e.name||d.name)).slice(0,30);
    L.bestKey='jd_best_'+hashStr(e.code);
    return L;
  }).filter(Boolean);
  const m=blankLevel('MENU');
  m.cc=defaultCC(210);
  MENU_L=prepLevel(m);
  MENU_L.endX=1e9;
  curL=MENU_L;
  setSong({t:'b',i:0});
  showMain();
  requestAnimationFrame(loop);
}
