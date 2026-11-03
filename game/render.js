"use strict";
function line(a,b,c,d){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.stroke(); }
function wrap(v, span){ return ((v%span)+span)%span; }
function rgbA(c,f,a){
  return 'rgba('+Math.min(255,Math.round(c[0]*f))+','+Math.min(255,Math.round(c[1]*f))+','+Math.min(255,Math.round(c[2]*f))+','+a+')';
}
function mixW(c,k){ return [c[0]+(255-c[0])*k, c[1]+(255-c[1])*k, c[2]+(255-c[2])*k]; }

// ---------- background data (generated once, deterministic) ----------
const BGD=(function(){
  let s=987654321;
  function rnd(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }
  const D={towers:[], mids:[], stars:[], gdeco:[], hills:[], rotors:[], cols:[], dust:[],
           stars2:[], clouds:[], traces:[], hexlit:[]};
  for(let i=0;i<48;i++) D.towers.push({x:i*7+rnd()*4, w:3+rnd()*3.5, h:2.5+rnd()*6.5});
  for(let i=0;i<36;i++) D.mids.push({x:i*9+rnd()*6, w:1+rnd()*2, h:1.5+rnd()*4, o:0.06+rnd()*0.08});
  for(let i=0;i<60;i++) D.stars.push({x:rnd()*340, y:0.05+rnd()*0.75, r:1+rnd()*2.2, tw:rnd()*6.28});
  for(let i=0;i<160;i++) D.gdeco.push({x:i*4+rnd()*3, k:(rnd()*3)|0});
  for(let i=0;i<20;i++) D.hills.push({x:i*18+rnd()*9, w:9+rnd()*10, h:1.5+rnd()*3.2});
  for(let i=0;i<22;i++) D.rotors.push({x:i*15+rnd()*9, y:0.08+rnd()*0.5, s:0.7+rnd()*1.3, sp:(rnd()-0.5)*0.05});
  for(let i=0;i<32;i++) D.cols.push({x:i*11+rnd()*6, w:0.5+rnd()*0.8, h:1+rnd()*2.6});
  for(let i=0;i<40;i++) D.dust.push({x:rnd()*360, y:rnd()*0.95, r:1+rnd()*2.2, ph:rnd()*6.28});
  for(let i=0;i<170;i++) D.stars2.push({x:rnd()*400, y:rnd(), r:0.8+rnd()*2.4, tw:rnd()*6.28, b:0.3+rnd()*0.7});
  for(let i=0;i<26;i++){
    const pf=[]; const n=4+((rnd()*3)|0);
    for(let j=0;j<n;j++) pf.push({dx:(j-n/2)*0.9+rnd()*0.4, dy:rnd()*0.6, r:0.8+rnd()*0.9});
    D.clouds.push({x:i*15+rnd()*8, y:0.08+rnd()*0.55, s:0.7+rnd()*0.9, l:(rnd()<0.5?0:1), pf:pf});
  }
  for(let i=0;i<40;i++){
    let x=rnd()*120, y=0.1+rnd()*0.8; const pts=[[x,y]];
    for(let j=0;j<4;j++){
      if(j%2===0) x+=2+rnd()*8; else y=Math.max(0.05,Math.min(0.95,y+(rnd()-0.5)*0.4));
      pts.push([x,y]);
    }
    D.traces.push({pts:pts, ph:rnd()});
  }
  for(let i=0;i<60;i++) D.hexlit.push(rnd());
  return D;
})();
let BVT=0;
function skyY(f){ return BVT + f*(groundY-BVT); }

function bgCity(c){
  const D=BGD;
  for(let i=0;i<D.stars.length;i++){
    const st=D.stars[i];
    const sx=wrap(st.x*B - camX*0.12, W+120) - 60;
    const a=0.25+0.35*Math.abs(Math.sin(ftick*0.04+st.tw));
    ctx.fillStyle='rgba(255,255,255,'+a+')';
    ctx.fillRect(sx, skyY(st.y), st.r*2, st.r*2);
  }
  const spanH=380*B;
  ctx.fillStyle=rgbA(c,0.35,0.5);
  for(let i=0;i<D.hills.length;i++){
    const hl=D.hills[i];
    const sx=wrap(hl.x*B - camX*0.18, spanH)-100;
    if(sx>-hl.w*B && sx<W+50){
      ctx.beginPath(); ctx.moveTo(sx, groundY);
      ctx.lineTo(sx+hl.w*B/2, groundY-hl.h*B); ctx.lineTo(sx+hl.w*B, groundY);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.fillStyle=rgbA(c,0.26,0.55);
  const span1=340*B;
  for(let i=0;i<D.towers.length;i++){
    const tw=D.towers[i];
    const sx=wrap(tw.x*B - camX*0.3, span1);
    if(sx>-tw.w*B-60 && sx<W+tw.w*B){
      const th=tw.h*B*0.9;
      ctx.fillRect(sx-60, groundY-th, tw.w*B, th);
    }
  }
  ctx.lineWidth=2;
  const span2=330*B;
  for(let i=0;i<D.mids.length;i++){
    const m=D.mids[i];
    const sx=wrap(m.x*B - camX*0.55, span2);
    if(sx>-100 && sx<W+100){
      ctx.strokeStyle='rgba(255,255,255,'+m.o+')';
      ctx.strokeRect(sx-50, groundY-(m.h+2.2)*B, m.w*B, m.w*B);
    }
  }
  const spanR=336*B;
  for(let i=0;i<D.rotors.length;i++){
    const r=D.rotors[i];
    const sx=wrap(r.x*B - camX*0.5, spanR)-70;
    if(sx>-80 && sx<W+80){
      ctx.save();
      ctx.translate(sx, skyY(r.y));
      ctx.rotate(ftick*r.sp*0.1);
      ctx.strokeStyle='rgba(255,255,255,'+(0.06+0.06*pulse)+')';
      ctx.lineWidth=2;
      const rs=r.s*B;
      ctx.strokeRect(-rs/2,-rs/2,rs,rs);
      ctx.restore();
    }
  }
  const spanC=352*B;
  for(let i=0;i<D.cols.length;i++){
    const cc=D.cols[i];
    const sx=wrap(cc.x*B - camX*0.7, spanC)-80;
    if(sx>-60 && sx<W+60){
      ctx.fillStyle=rgbA(c,0.2,0.7);
      ctx.fillRect(sx, groundY-cc.h*B, cc.w*B, cc.h*B);
      ctx.fillStyle='rgba(255,255,255,0.10)';
      ctx.fillRect(sx, groundY-cc.h*B, cc.w*B, 3);
    }
  }
  const ps=B*4, off=-((camX*0.4)%(ps*2));
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=2;
  for(let x=off-ps*2; x<W+ps; x+=ps*2)
    for(let y=BVT+H*0.08; y<groundY-ps; y+=ps*1.6)
      ctx.strokeRect(x,y,ps,ps);
}
function bgSpace(c){
  const D=BGD, hc=mixW(c,0.35);
  [[0.25,0.3,5],[0.7,0.2,7],[0.5,0.6,6]].forEach(function(n,i){
    const x=wrap(n[0]*W*1.6 - camX*0.04*(i+1), W*1.6+n[2]*B*2)-n[2]*B, y=skyY(n[1]);
    const g=ctx.createRadialGradient(x,y,0,x,y,n[2]*B);
    g.addColorStop(0, rgbA(hc,1.2,0.28)); g.addColorStop(1, rgbA(hc,1,0));
    ctx.fillStyle=g; ctx.fillRect(x-n[2]*B,y-n[2]*B,n[2]*B*2,n[2]*B*2);
  });
  for(let i=0;i<D.stars2.length;i++){
    const st=D.stars2[i];
    const sx=wrap(st.x*B - camX*(0.03+st.b*0.06), W+200)-100;
    const a=st.b*(0.45+0.4*Math.abs(Math.sin(ftick*0.03+st.tw)));
    ctx.fillStyle='rgba(255,255,255,'+a+')';
    ctx.fillRect(sx, BVT+st.y*(groundY-BVT), st.r, st.r);
  }
  const px=wrap(W*0.72 - camX*0.02, W+10*B)-4*B, py=skyY(0.3), pr=2.6*B;
  const pg=ctx.createLinearGradient(px-pr,py-pr,px+pr,py+pr);
  pg.addColorStop(0, rgbA(mixW(c,0.5),1,0.95)); pg.addColorStop(1, rgbA(c,0.35,0.95));
  ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=rgbA(mixW(c,0.6),1,0.6); ctx.lineWidth=B*0.12;
  ctx.beginPath(); ctx.ellipse(px,py,pr*1.7,pr*0.42,-0.3,Math.PI*0.05,Math.PI*0.95,true); ctx.stroke();
}
function bgSynth(c){
  const hz=groundY-2.4*B, sc=mixW(c,0.45);
  const sx=W*0.62 - (camX*0.01)%(W*0.2), sr=3.4*B;
  const sg=ctx.createLinearGradient(0,hz-sr,0,hz);
  sg.addColorStop(0,'rgba(255,230,120,0.95)'); sg.addColorStop(1, rgbA(sc,1.2,0.95));
  ctx.save();
  ctx.beginPath(); ctx.arc(sx,hz,sr,Math.PI,0); ctx.closePath(); ctx.clip();
  ctx.fillStyle=sg; ctx.fillRect(sx-sr,hz-sr,sr*2,sr);
  ctx.fillStyle=rgbA(c,0.55,1);
  for(let i=0;i<6;i++){ const yy=hz-sr*0.12-i*sr*0.14; ctx.fillRect(sx-sr,yy,sr*2,sr*0.05*(1+i*0.25)); }
  ctx.restore();
  ctx.fillStyle=rgbA(c,0.3,1);
  ctx.fillRect(0,hz,W,groundY-hz);
  ctx.strokeStyle=rgbA(sc,1.4,0.55); ctx.lineWidth=2;
  const vp=W/2, gap=B*1.5, off=(camX*0.9)%gap;
  for(let i=-30;i<=30;i++){
    const xb=vp+i*gap-off;
    line(vp+(xb-vp)*0.12, hz, xb, groundY);
  }
  for(let j=1;j<9;j++){
    const k=j/9, yy=hz+(groundY-hz)*k*k;
    line(0,yy,W,yy);
  }
  line(0,hz,W,hz);
}
function ridge(u, seed, amp){
  return amp*(0.55+0.25*Math.sin(u*0.011+seed)+0.12*Math.sin(u*0.037+seed*2.1)+0.08*Math.abs(Math.sin(u*0.09+seed*3.3)));
}
function bgMountains(c){
  const D=BGD;
  for(let i=0;i<40;i++){
    const st=D.stars[i]; const sx=wrap(st.x*B - camX*0.05, W+120)-60;
    ctx.fillStyle='rgba(255,255,255,'+(0.2+0.2*Math.abs(Math.sin(ftick*0.03+st.tw)))+')';
    ctx.fillRect(sx, skyY(st.y*0.5), st.r, st.r);
  }
  [[0.1,5.5*B,0.62,1],[0.25,4*B,0.45,2],[0.45,2.6*B,0.3,3]].forEach(function(l){
    ctx.fillStyle=rgbA(c,l[2],1);
    ctx.beginPath(); ctx.moveTo(0,groundY);
    for(let x=0;x<=W+B;x+=B*0.5){
      const u=(x+camX*l[0])/B*6;
      ctx.lineTo(x, groundY-ridge(u,l[3],l[1]));
    }
    ctx.lineTo(W+B,groundY); ctx.closePath(); ctx.fill();
  });
}
function bgOcean(c){
  const mx=W*0.25 - (camX*0.015)%(W*0.3), my=skyY(0.28), mr=1.4*B;
  const mg=ctx.createRadialGradient(mx,my,0,mx,my,mr*3.5);
  mg.addColorStop(0,'rgba(255,255,240,0.35)'); mg.addColorStop(1,'rgba(255,255,240,0)');
  ctx.fillStyle=mg; ctx.fillRect(mx-mr*3.5,my-mr*3.5,mr*7,mr*7);
  ctx.fillStyle='rgba(255,255,235,0.92)'; ctx.beginPath(); ctx.arc(mx,my,mr,0,Math.PI*2); ctx.fill();
  const sea=groundY-3*B;
  [[0.2,0.5,0.35],[0.4,0.4,0.55],[0.7,0.3,0.8]].forEach(function(l,i){
    const base=sea+i*B*0.9;
    ctx.fillStyle=rgbA(c,l[1],1);
    ctx.beginPath(); ctx.moveTo(0,groundY);
    for(let x=0;x<=W+B;x+=B*0.25){
      const u=(x+camX*l[0])/B;
      ctx.lineTo(x, base+Math.sin(u*1.3+ftick*0.03*(i+1))*B*0.12+Math.sin(u*0.5+i)*B*0.18);
    }
    ctx.lineTo(W+B,groundY); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,235,'+(0.12-i*0.03)+')';
    ctx.fillRect(mx-mr*0.8+Math.sin(ftick*0.05+i)*6, base+B*0.1, mr*1.6, 3);
  });
}
function bgHex(c){
  const r=1.3*B, hw=r*Math.sqrt(3), off=wrap(camX*0.3, hw), lc=mixW(c,0.4);
  ctx.lineWidth=2;
  let row=0;
  for(let y=BVT-r; y<groundY+r; y+=r*1.5, row++){
    for(let col=-1, x=-off-hw+(row&1?hw/2:0); x<W+hw; x+=hw, col++){
      const idx=Math.floor((x+camX*0.3)/hw)+row*7;
      const lit=BGD.hexlit[((idx%60)+60)%60];
      ctx.beginPath();
      for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; const px=x+Math.cos(a)*r*0.92, py=y+Math.sin(a)*r*0.92; if(k) ctx.lineTo(px,py); else ctx.moveTo(px,py); }
      ctx.closePath();
      if(lit>0.85){ ctx.fillStyle=rgbA(lc,1,0.06+0.1*pulse+0.05*Math.sin(ftick*0.05+idx)); ctx.fill(); }
      ctx.strokeStyle=rgbA(lc,1,0.09); ctx.stroke();
    }
  }
}
function bgClouds(c){
  const sgx=W*0.8, sgy=skyY(0.15);
  const g=ctx.createRadialGradient(sgx,sgy,0,sgx,sgy,6*B);
  g.addColorStop(0,'rgba(255,250,220,0.35)'); g.addColorStop(1,'rgba(255,250,220,0)');
  ctx.fillStyle=g; ctx.fillRect(sgx-6*B,sgy-6*B,12*B,12*B);
  const span=400*B;
  BGD.clouds.forEach(function(cl){
    const f=cl.l?0.32:0.12, a=cl.l?0.22:0.13;
    const cx=wrap(cl.x*B*1.2 - camX*f - ftick*0.15*(cl.l?1:0.5), span)-3*B;
    if(cx<-6*B || cx>W+6*B) return;
    const cy=skyY(cl.y);
    ctx.fillStyle='rgba(255,255,255,'+a+')';
    cl.pf.forEach(function(p){
      ctx.beginPath(); ctx.arc(cx+p.dx*B*cl.s, cy+p.dy*B*cl.s, p.r*B*cl.s, 0, Math.PI*2); ctx.fill();
    });
  });
}
function bgCircuit(c){
  const lc=mixW(c,0.5), span=130*B, top=BVT, hh=groundY-BVT;
  ctx.lineWidth=3; ctx.lineJoin='round';
  BGD.traces.forEach(function(t){
    const ox=wrap(t.pts[0][0]*B - camX*0.35, span)-10*B - t.pts[0][0]*B;
    if(ox+t.pts[t.pts.length-1][0]*B<-B || ox+t.pts[0][0]*B>W+B) return;
    ctx.strokeStyle=rgbA(lc,1,0.14);
    ctx.beginPath();
    t.pts.forEach(function(p,i){ const x=ox+p[0]*B, y=top+p[1]*hh; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); });
    ctx.stroke();
    ctx.fillStyle=rgbA(lc,1,0.3);
    [t.pts[0], t.pts[t.pts.length-1]].forEach(function(p){
      ctx.beginPath(); ctx.arc(ox+p[0]*B, top+p[1]*hh, B*0.12, 0, Math.PI*2); ctx.fill();
    });
    const k=(ftick*0.006+t.ph)%1, seg=Math.min(t.pts.length-2, Math.floor(k*(t.pts.length-1)));
    const f=k*(t.pts.length-1)-seg, a=t.pts[seg], b=t.pts[seg+1];
    ctx.fillStyle='rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(ox+(a[0]+(b[0]-a[0])*f)*B, top+(a[1]+(b[1]-a[1])*f)*hh, B*0.08, 0, Math.PI*2); ctx.fill();
  });
  ctx.lineJoin='miter';
}
function bgSquares(c){
  const s=3.6*B, gap=0.35*B, off=wrap(camX*0.25, s+gap), lc=mixW(c,0.3);
  let row=0;
  for(let y=groundY-s-gap*0.5; y>BVT-s; y-=s+gap, row++){
    for(let x=-off-(row&1?(s+gap)/2:0); x<W+s; x+=s+gap){
      ctx.fillStyle=rgbA(c,0.72,0.35);
      ctx.fillRect(x,y,s,s);
      ctx.strokeStyle=rgbA(lc,1.15,0.35); ctx.lineWidth=3;
      ctx.strokeRect(x+1.5,y+1.5,s-3,s-3);
    }
  }
}
const BG_DRAW=[bgCity,bgSpace,bgSynth,bgMountains,bgOcean,bgHex,bgClouds,bgCircuit,bgSquares,function(){}];
function drawBackground(L){
  const c=chCur[CH_BG]||[40,90,200], lift=1+pulse*0.18;
  const up=Math.max(0,(groundY-H*0.8)-VT)*0.9;
  BVT=VT+up;
  ctx.save(); ctx.translate(0,-up);
  const g=ctx.createLinearGradient(0,BVT,0,groundY);
  g.addColorStop(0, rgbA(c,lift,1));
  g.addColorStop(1, rgbA(c,0.38*lift,1));
  ctx.fillStyle=g; ctx.fillRect(0,BVT,W,Math.max(H,groundY-BVT)+2);
  (BG_DRAW[L.bg|0]||bgCity)(c);
  ctx.restore();
}
function drawDust(){
  const D=BGD;
  for(let i=0;i<D.dust.length;i++){
    const d=D.dust[i];
    const sx=wrap(d.x*B - camX*1.18, W+240)-120;
    const sy=VT + d.y*H + Math.sin(ftick*0.012+d.ph)*18;
    ctx.fillStyle='rgba(255,255,255,'+(0.08+0.07*Math.abs(Math.sin(ftick*0.02+d.ph)))+')';
    ctx.fillRect(sx, sy, d.r*1.6, d.r*1.6);
  }
}
function drawGround(L){
  const c=chCur[CH_G]||[30,60,150], bot=VT+H, gh=bot-groundY;
  if(gh<=0) return;
  ctx.fillStyle=rgbA(c,1+pulse*0.2,1);
  ctx.fillRect(0,groundY,W,gh);
  const st=L.gr|0;
  ctx.save();
  if(st===0){
    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1.5;
    for(let x=-wrap(camX,B); x<W; x+=B) line(x,groundY,x,bot);
    const span=640*B;
    ctx.fillStyle='rgba(255,255,255,0.07)';
    for(let i=0;i<BGD.gdeco.length;i++){
      const g=BGD.gdeco[i];
      const sx=wrap(g.x*B - camX, span);
      if(sx>-40 && sx<W+40){
        if(g.k===0) ctx.fillRect(sx, groundY+B*0.45, B*0.32, B*0.32);
        else if(g.k===1) ctx.fillRect(sx, groundY+B*1.1, B*0.5, B*0.16);
        else ctx.fillRect(sx, groundY+B*0.8, B*0.18, B*0.18);
      }
    }
  } else if(st===1){
    ctx.fillStyle='rgba(255,255,255,0.06)';
    const s=B*1.5, ox=wrap(camX,s*2);
    for(let y=groundY, r=0; y<bot; y+=s, r++)
      for(let x=-ox+(r&1?s:0); x<W+s; x+=s*2) ctx.fillRect(x,y,s,s);
  } else if(st===2){
    ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=B*0.25;
    for(let x=-wrap(camX,B)-gh; x<W+gh; x+=B) line(x,bot,x+gh,groundY);
  } else if(st===3){
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=2;
    const bh=B*0.5;
    for(let y=groundY+bh, r=1; y<bot; y+=bh, r++){
      line(0,y,W,y);
    }
    for(let y=groundY, r=0; y<bot; y+=bh, r++){
      const off=wrap(camX+(r&1?B/2:0),B);
      for(let x=-off; x<W+B; x+=B) line(x,y,x,Math.min(y+bh,bot));
    }
  }
  const sh=ctx.createLinearGradient(0,groundY,0,groundY+3*B);
  sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.35)');
  ctx.fillStyle=sh; ctx.fillRect(0,groundY,W,gh);
  ctx.restore();
  drawFloorLine(groundY);
}
function drawFloorLine(y){
  const lc=chStr(CH_LINE);
  const g=ctx.createLinearGradient(0,0,W,0);
  g.addColorStop(0,'rgba('+lc+',0)'); g.addColorStop(0.5,'rgba('+lc+',0.95)'); g.addColorStop(1,'rgba('+lc+',0)');
  ctx.fillStyle=g; ctx.fillRect(0,y-2,W,3);
}

// ---------- objects ----------
function edgeLines(x,y,w,h,e,oc){
  ctx.strokeStyle='rgba('+oc+',0.92)'; ctx.lineWidth=2.5; ctx.lineCap='square';
  const i=1.5;
  ctx.beginPath();
  if(e&1){ ctx.moveTo(x+i,y+i); ctx.lineTo(x+w-i,y+i); }
  if(e&2){ ctx.moveTo(x+w-i,y+i); ctx.lineTo(x+w-i,y+h-i); }
  if(e&4){ ctx.moveTo(x+i,y+h-i); ctx.lineTo(x+w-i,y+h-i); }
  if(e&8){ ctx.moveTo(x+i,y+i); ctx.lineTo(x+i,y+h-i); }
  ctx.stroke(); ctx.lineCap='butt';
}
function drawBlock(b){
  const x=egx(b)*B-camX, y=groundY-(egy(b)+b.h)*B, w=b.w*B, h=b.h*B;
  if(x+w+cullPad<0 || x-cullPad>W) return;
  const t=b.t||0, oc=objColorCur;
  if(t===T_D){
    if(state!=='edit') return;
    ctx.fillStyle='rgba(255,140,40,0.18)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle='rgba(255,170,60,0.9)'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.strokeRect(x+1,y+1,w-2,h-2); ctx.setLineDash([]);
    ctx.font='900 '+Math.round(B*0.5)+'px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(255,190,80,0.95)'; ctx.fillText('D', x+w/2, y+h/2);
    return;
  }
  if(t===T_OUTLINE || t===T_LINES){
    if(t===T_OUTLINE){ ctx.fillStyle='rgba(5,8,20,0.9)'; ctx.fillRect(x,y,w,h); }
    else if(state==='edit'){ ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h); }
    edgeLines(x,y,w,h,b.e!=null?b.e:15,oc);
    return;
  }
  if(t===8){
    ctx.fillStyle='rgb('+chStr(b.c||1)+')'; ctx.fillRect(x,y,w,h);
    return;
  }
   if(t===T_BRICKBG){
    ctx.save();
    ctx.globalAlpha*=0.5;
    ctx.fillStyle='rgba(5,8,20,0.9)'; ctx.fillRect(x,y,w,h);
    ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
    ctx.lineWidth=1.5; ctx.strokeStyle='rgba('+oc+',0.30)';
    const rh=B*0.5;
    for(let yy=y+rh; yy<y+h-0.5; yy+=rh) line(x,yy,x+w,yy);
    for(let yy=y, r=0; yy<y+h; yy+=rh, r++){
      const off=(r&1)?B*0.5:0;
      for(let xx=x+off; xx<x+w; xx+=B) line(xx,yy,xx,Math.min(yy+rh,y+h));
    }
    ctx.restore();
    return;
  }
  if(t===9){
    ctx.fillStyle='rgba('+oc+',0.10)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle='rgba('+oc+',0.75)'; ctx.lineWidth=2;
    ctx.strokeRect(x+1,y+1,w-2,h-2);
    return;
  }
  ctx.fillStyle='rgba(5,8,20,0.9)'; ctx.fillRect(x,y,w,h);
  ctx.save();
  ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
  ctx.lineWidth=1.5;
  if(t===1){
    ctx.strokeStyle='rgba('+oc+',0.30)';
    const rh=B*0.5;
    for(let yy=y+rh; yy<y+h-0.5; yy+=rh) line(x,yy,x+w,yy);
    for(let yy=y, r=0; yy<y+h; yy+=rh, r++){
      const off=(r&1)?B*0.5:0;
      for(let xx=x+off; xx<x+w; xx+=B) line(xx,yy,xx,Math.min(yy+rh,y+h));
    }
  } else if(t===2){
    ctx.strokeStyle='rgba('+oc+',0.28)';
    for(let yy=y+B*0.35; yy<y+h; yy+=B*0.7) line(x,yy,x+w,yy);
    ctx.fillStyle='rgba('+oc+',0.55)';
    for(let xx=x+B*0.3; xx<x+w; xx+=B*0.6) for(let yy=y+B*0.35; yy<y+h; yy+=B*0.7) ctx.fillRect(xx-2,yy-2,4,4);
  } else if(t===3){
    ctx.strokeStyle='rgba('+oc+',0.30)';
    for(let yy=y+B*0.33; yy<y+h-0.5; yy+=B*0.33) line(x,yy,x+w,yy);
  } else if(t===4){
    ctx.strokeStyle='rgba('+oc+',0.5)'; ctx.lineWidth=2;
    ctx.strokeRect(x+B*0.18,y+B*0.18,w-B*0.36,h-B*0.36);
    ctx.fillStyle='rgba('+oc+',0.6)';
    const rr=Math.max(2,B*0.07), m=B*0.28;
    [[x+m,y+m],[x+w-m,y+m],[x+m,y+h-m],[x+w-m,y+h-m]].forEach(function(p){
      ctx.beginPath(); ctx.arc(p[0],p[1],rr,0,Math.PI*2); ctx.fill(); });
  } else if(t===5){
    ctx.strokeStyle='rgba('+oc+',0.22)';
    for(let xx=x+B*0.5; xx<x+w; xx+=B*0.5) line(xx,y,xx,y+h);
    for(let yy=y+B*0.5; yy<y+h; yy+=B*0.5) line(x,yy,x+w,yy);
  } else if(t===6){
    ctx.strokeStyle='rgba('+oc+',0.25)';
    for(let d=-h; d<w; d+=B*0.4) line(x+d,y+h,x+d+h,y);
  } else if(t===7){
    ctx.fillStyle='rgba('+oc+',0.4)';
    const sp=B*0.5, rr=Math.max(1.5,B*0.06);
    for(let xx=x+sp*0.5; xx<x+w; xx+=sp) for(let yy=y+sp*0.5; yy<y+h; yy+=sp){
      ctx.beginPath(); ctx.arc(xx,yy,rr,0,Math.PI*2); ctx.fill(); }
  } else if(t===13){
    ctx.fillStyle='rgba('+oc+',0.16)'; const q=B*0.5;
    for(let yy=0, r=0; yy<h; yy+=q, r++) for(let xx=(r&1)?q:0; xx<w; xx+=q*2) ctx.fillRect(x+xx,y+yy,q,q);
  } else if(t===14){
    ctx.strokeStyle='rgba('+oc+',0.35)'; ctx.lineWidth=2;
    for(let xx=0; xx<w; xx+=B) for(let yy=0; yy<h; yy+=B){
      const cx=x+xx+B/2, cy=y+yy+B/2, r=B*0.32;
      ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx+r,cy); ctx.lineTo(cx,cy+r); ctx.lineTo(cx-r,cy); ctx.closePath(); ctx.stroke();
    }
  } else if(t===15){
    ctx.strokeStyle='rgba('+oc+',0.25)'; ctx.lineWidth=2;
    for(let xx=0; xx<w; xx+=B) for(let yy=0; yy<h; yy+=B){
      line(x+xx+B*0.15,y+yy+B*0.15,x+xx+B*0.85,y+yy+B*0.85); line(x+xx+B*0.85,y+yy+B*0.15,x+xx+B*0.15,y+yy+B*0.85);
    }
  } else if(t===16){
    ctx.strokeStyle='rgba('+oc+',0.4)'; ctx.fillStyle='rgba('+oc+',0.6)'; ctx.lineWidth=2;
    for(let xx=0; xx<w; xx+=B) for(let yy=0; yy<h; yy+=B){
      const k=(Math.round(xx/B)+Math.round(yy/B)*3)&1, X=x+xx, Y=y+yy;
      ctx.beginPath();
      if(k){ ctx.moveTo(X+B*0.2,Y); ctx.lineTo(X+B*0.2,Y+B*0.5); ctx.lineTo(X+B*0.7,Y+B*0.5); }
      else { ctx.moveTo(X,Y+B*0.3); ctx.lineTo(X+B*0.6,Y+B*0.3); ctx.lineTo(X+B*0.6,Y+B); }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(k?X+B*0.7:X+B*0.6, k?Y+B*0.5:Y+B*0.3, B*0.07, 0, Math.PI*2); ctx.fill();
    }
  } else if(t===17){
    ctx.strokeStyle='rgba('+oc+',0.3)'; ctx.lineWidth=2;
    for(let yy=B*0.25; yy<h; yy+=B*0.4){
      ctx.beginPath();
      for(let xx=0; xx<=w+0.01; xx+=B*0.1){ const py=y+yy+Math.sin((xx/B)*Math.PI*2)*B*0.08; if(xx===0) ctx.moveTo(x+xx,py); else ctx.lineTo(x+xx,py); }
      ctx.stroke();
    }
  } else if(t===18){
    ctx.fillStyle='rgba('+oc+',0.14)'; const q=B*0.5;
    for(let xx=0; xx<w; xx+=q) for(let yy=0; yy<h; yy+=q){
      ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x+xx+3,y+yy+3,q-6,q-6,4); else ctx.rect(x+xx+3,y+yy+3,q-6,q-6); ctx.fill();
    }
  } else if(t===19){
    const g=ctx.createLinearGradient(0,y,0,y+Math.min(h,B*1.2));
    g.addColorStop(0,'rgba('+oc+',0.45)'); g.addColorStop(1,'rgba('+oc+',0)');
    ctx.fillStyle=g; ctx.fillRect(x,y,w,h);
  } else if(t===20){
    ctx.fillStyle='rgba('+oc+',0.22)';
    for(let d=-h; d<w; d+=B*0.6){
      ctx.beginPath(); ctx.moveTo(x+d,y+h); ctx.lineTo(x+d+B*0.3,y+h); ctx.lineTo(x+d+B*0.3+h,y); ctx.lineTo(x+d+h,y); ctx.closePath(); ctx.fill();
    }
  } else if(t===21){
    ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(x,y,w,B*0.12); ctx.fillRect(x,y,B*0.12,h);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(x,y+h-B*0.12,w,B*0.12); ctx.fillRect(x+w-B*0.12,y,B*0.12,h);
    ctx.strokeStyle='rgba('+oc+',0.3)'; ctx.strokeRect(x+B*0.2,y+B*0.2,w-B*0.4,h-B*0.4);
  } else if(t===22){
    ctx.strokeStyle='rgba('+oc+',0.3)'; ctx.lineWidth=2; const q=B*0.5;
    for(let yy=0, r=0; yy<h+q; yy+=q*0.5, r++) for(let xx=(r&1)?q/2:0; xx<w+q; xx+=q){
      ctx.beginPath(); ctx.arc(x+xx,y+yy,q/2,0,Math.PI); ctx.stroke();
    }
  } else if(t===23){
    ctx.strokeStyle='rgba('+oc+',0.32)'; ctx.lineWidth=2.5;
    for(let yy=B*0.3; yy<h; yy+=B*0.45){
      ctx.beginPath();
      for(let xx=0, i=0; xx<=w+B*0.25; xx+=B*0.25, i++){ const py=y+yy+((i&1)?-B*0.1:B*0.1); if(!i) ctx.moveTo(x+xx,py); else ctx.lineTo(x+xx,py); }
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle='rgba('+oc+',0.18)';
    for(let i=1;i<b.w;i++) line(x+i*B,y,x+i*B,y+h);
    for(let j=1;j<b.h;j++) line(x,y+j*B,x+w,y+j*B);
  }
  ctx.restore();
  ctx.strokeStyle='rgba('+oc+',0.92)'; ctx.lineWidth=2.5;
  ctx.strokeRect(x+1.5,y+1.5,w-3,h-3);
}
function drawSpike(s){
  const x=egx(s)*B-camX;
  if(x+B+cullPad<0 || x-cullPad>W) return;
  const r=s.r||0, sz=s.sz||0;
  ctx.save();
  ctx.translate(x+B/2, groundY-(egy(s)+0.5)*B);
  ctx.rotate([0, Math.PI, Math.PI/2, -Math.PI/2][r]);
  ctx.fillStyle='rgba(5,8,20,0.9)';
  ctx.beginPath();
  if(sz===1){
    ctx.moveTo(-B/2+2, B/2); ctx.lineTo(0, 0); ctx.lineTo(B/2-2, B/2);
  } else {
    const scl=[1,1,0.55,0.3][sz];
    const w=(B/2-2)*scl, h=(B-4)*scl;
    ctx.moveTo(-w, B/2); ctx.lineTo(0, B/2-h); ctx.lineTo(w, B/2);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=2.5; ctx.stroke();
  ctx.restore();
}
function sawSpikyPath(R){
  const teeth=12, inner=R*0.64;
  ctx.beginPath();
  for(let i=0;i<teeth;i++){
    const a0=i/teeth*Math.PI*2, a1=(i+0.5)/teeth*Math.PI*2;
    if(i===0) ctx.moveTo(Math.cos(a0)*R, Math.sin(a0)*R);
    else ctx.lineTo(Math.cos(a0)*R, Math.sin(a0)*R);
    ctx.lineTo(Math.cos(a1)*inner, Math.sin(a1)*inner);
  }
  ctx.closePath();
}
function sawGearPath(R, teeth){
  teeth=teeth||8;
  const step=Math.PI*2/teeth, f=step*0.30, inner=R*0.74;
  ctx.beginPath();
  for(let i=0;i<teeth;i++){
    const a=i*step, na=(i+1)*step;
    const pts=[[a-f,inner],[a-f,R],[a+f,R],[a+f,inner],[na-f,inner]];
    pts.forEach(function(q,idx){
      const px=Math.cos(q[0])*q[1], py=Math.sin(q[0])*q[1];
      if(i===0&&idx===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    });
  }
  ctx.closePath();
}
function sawStarPath(R,pts,innerF){
  const inner=R*innerF;
  ctx.beginPath();
  for(let p=0;p<pts*2;p++){
    const a=p/(pts*2)*Math.PI*2, rad=(p%2?inner:R);
    if(p===0) ctx.moveTo(Math.cos(a)*rad, Math.sin(a)*rad);
    else ctx.lineTo(Math.cos(a)*rad, Math.sin(a)*rad);
  }
  ctx.closePath();
}
function drawSaw(s){
  const x=(egx(s)+0.5)*B-camX, y=groundY-(egy(s)+0.5)*B;
  const R=SAW_R[s.sz||0]*B;
  if(x+R+cullPad<0 || x-R-cullPad>W) return;
  const k=s.k||0, dir=(Math.round(s.gx)&1)?-1:1, ang=ftick*0.12*dir;
  ctx.save();
  ctx.translate(x,y); ctx.rotate(ang);
  ctx.lineJoin='round';
  if(k===1){
    sawGearPath(R);
    ctx.fillStyle='rgba(206,214,235,0.96)'; ctx.fill();
    ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=Math.max(2,R*0.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.40,0,Math.PI*2);
    ctx.fillStyle='rgba(118,128,158,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=Math.max(1.5,R*0.04); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.17,0,Math.PI*2);
    ctx.fillStyle='rgba(34,40,56,0.95)'; ctx.fill();
  } else if(k===2){
    sawStarPath(R,8,0.34);
    ctx.fillStyle='rgba(10,12,20,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba('+objColorCur+',0.9)'; ctx.lineWidth=Math.max(2,R*0.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.22,0,Math.PI*2);
    ctx.fillStyle='rgba(180,170,230,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=Math.max(1.5,R*0.04); ctx.stroke();
  } else {
    sawSpikyPath(R);
    ctx.fillStyle='rgba(8,10,16,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=Math.max(2,R*0.06); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.33,0,Math.PI*2);
    ctx.fillStyle='rgba(58,64,82,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=Math.max(1.5,R*0.04); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.11,0,Math.PI*2);
    ctx.fillStyle='rgba(17,21,31,0.95)'; ctx.fill();
  }
  ctx.restore();
  ctx.lineJoin='miter';
}
function drawSlope(s){
  const gx=egx(s), gy=egy(s), x=gx*B-camX, o=s.o||0, R=x+(s.w||1)*B, sh=s.h||1;
  if(R+cullPad<0 || x-cullPad>W) return;
  const bot=groundY-gy*B, top=groundY-(gy+sh)*B;
  ctx.fillStyle='rgba(5,8,20,0.9)';
  ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=2.5; ctx.lineJoin='round';
  ctx.beginPath();
  if(o===0){ ctx.moveTo(x,bot); ctx.lineTo(R,bot); ctx.lineTo(R,top); }
  else if(o===1){ ctx.moveTo(x,bot); ctx.lineTo(x,top); ctx.lineTo(R,bot); }
  else if(o===2){ ctx.moveTo(x,top); ctx.lineTo(R,top); ctx.lineTo(R,bot); }
  else { ctx.moveTo(x,top); ctx.lineTo(R,top); ctx.lineTo(x,bot); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineJoin='miter';
}
function drawSpeed(s){
  const cfg=SPDS[s.t], x0=egx(s)*B-camX;
  if(x0+3*B+cullPad<0 || x0-B-cullPad>W) return;
  const yT=groundY-(egy(s)+1.55)*B, hh=1.4*B, aw=0.5*B, gap=0.34*B;
  ctx.strokeStyle='rgba('+cfg.c+',0.95)';
  ctx.lineWidth=Math.max(3,B*0.11);
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(let i=0;i<cfg.n;i++){
    const bx=x0+i*gap;
    ctx.beginPath();
    if(cfg.rev){ ctx.moveTo(bx+aw,yT); ctx.lineTo(bx,yT+hh/2); ctx.lineTo(bx+aw,yT+hh); }
    else { ctx.moveTo(bx,yT); ctx.lineTo(bx+aw,yT+hh/2); ctx.lineTo(bx,yT+hh); }
    ctx.stroke();
  }
  ctx.lineJoin='miter'; ctx.lineCap='butt';
}
function flame(cx,bot,w,h,ph,outer,inner){
  const t=ftick*0.22+ph, f1=Math.sin(t)*w*0.16, f2=Math.sin(t*1.7+1)*h*0.07;
  ctx.fillStyle=outer;
  ctx.beginPath(); ctx.moveTo(cx-w/2,bot);
  ctx.quadraticCurveTo(cx-w*0.62,bot-h*0.55,cx+f1,bot-h-f2);
  ctx.quadraticCurveTo(cx+w*0.62,bot-h*0.55,cx+w/2,bot); ctx.closePath(); ctx.fill();
  ctx.fillStyle=inner;
  ctx.beginPath(); ctx.moveTo(cx-w*0.24,bot);
  ctx.quadraticCurveTo(cx-w*0.3,bot-h*0.35,cx+f1*0.6,bot-h*0.58-f2*0.5);
  ctx.quadraticCurveTo(cx+w*0.3,bot-h*0.35,cx+w*0.24,bot); ctx.closePath(); ctx.fill();
}
function dcol(d, def){ return d.c ? chStr(d.c) : def; }
function drawDecoObj(d){
  const x=egx(d)*B-camX, bot=groundY-egy(d)*B;
  if(x+2*B+cullPad<0 || x-B-cullPad>W) return;
  const cx=x+B/2, cy=bot-B/2;
  ctx.save();
  if(d.r){ ctx.translate(cx,cy); ctx.rotate((d.r||0)*Math.PI/2); ctx.translate(-cx,-cy); }
  let c;
  switch(d.k){
    case 0:
      c=dcol(d,'10,14,30');
      ctx.fillStyle='rgba('+c+','+(d.c?0.5:0.55)+')';
      ctx.beginPath();
      ctx.moveTo(x+B*0.15,bot); ctx.lineTo(x+B/2,bot-B*0.7); ctx.lineTo(x+B*0.85,bot);
      ctx.closePath(); ctx.fill();
      break;
    case 1: {
      c=dcol(d,'255,255,255');
      ctx.strokeStyle='rgba('+c+',0.30)'; ctx.lineWidth=Math.max(2,B*0.07);
      for(let j=0;j<2;j++){
        ctx.beginPath();
        ctx.ellipse(cx, bot-B+B*0.25+j*B*0.5, B*0.10, B*0.2, 0, 0, Math.PI*2);
        ctx.stroke();
      }
      break;
    }
    case 2: {
      c=dcol(d,'255,255,255');
      const r=B*(0.45+0.15*pulse)+B*0.05*Math.sin(ftick*0.07+d.gx);
      ctx.strokeStyle='rgba('+c+','+(0.16+0.18*pulse)+')';
      ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
      break;
    }
    case 3:
      c=dcol(d,'140,240,255');
      ctx.fillStyle='rgba('+c+',0.35)';
      ctx.strokeStyle='rgba('+c+',0.6)'; ctx.lineWidth=1.5;
      [[0.2,0.45],[0.5,0.75],[0.78,0.4]].forEach(function(q){
        ctx.beginPath();
        ctx.moveTo(x+B*(q[0]-0.12),bot); ctx.lineTo(x+B*q[0],bot-B*q[1]); ctx.lineTo(x+B*(q[0]+0.12),bot);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      break;
    case 4:
      c=dcol(d,'255,255,255');
      ctx.strokeStyle='rgba('+c+',0.4)'; ctx.lineWidth=Math.max(3,B*0.09);
      ctx.lineJoin='round'; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(x+B*0.25,cy-B*0.35); ctx.lineTo(x+B*0.6,cy); ctx.lineTo(x+B*0.25,cy+B*0.35);
      ctx.stroke();
      break;
    case 5:
      c=dcol(d,'255,255,255');
      ctx.strokeStyle='rgba('+c+',0.22)'; ctx.lineWidth=2;
      ctx.strokeRect(x+2,bot-B+2,B-4,B-4);
      ctx.strokeRect(x+B*0.25,bot-B*0.75,B*0.5,B*0.5);
      break;
    case 6:
      c=dcol(d,'120,200,255');
      ctx.fillStyle='rgba('+c+',0.22)';
      ctx.beginPath(); ctx.arc(cx,cy,B*0.4,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba('+c+',0.7)'; ctx.lineWidth=2; ctx.stroke();
      break;
    case 7: case 25: {
      c=dcol(d, d.k===7?'255,235,120':'255,255,255');
      const tw=d.k===25 ? 0.6+0.4*Math.sin(ftick*0.1+d.gx*1.7) : 1;
      const pts=d.k===7?5:4, R=B*0.42*tw, r=B*(d.k===7?0.18:0.08)*tw;
      ctx.fillStyle='rgba('+c+','+(d.k===7?0.5:0.85)+')';
      ctx.strokeStyle='rgba('+c+',0.8)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      for(let p=0;p<pts*2;p++){ const ang=-Math.PI/2+p*Math.PI/pts, rad=(p%2?r:R);
        const px=cx+Math.cos(ang)*rad, py=cy+Math.sin(ang)*rad;
        if(p===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.closePath(); ctx.fill(); if(d.k===7) ctx.stroke();
      break;
    }
    case 8:
      c=dcol(d,'255,255,255');
      ctx.fillStyle='rgba('+c+',0.10)';
      ctx.fillRect(x-B*0.1, bot-B*0.62, B*1.2, B*0.24);
      ctx.strokeStyle='rgba('+c+',0.3)'; ctx.lineWidth=2;
      ctx.strokeRect(x-B*0.1, bot-B*0.62, B*1.2, B*0.24);
      break;
    case 9:
      c=dcol(d,'255,255,255');
      ctx.fillStyle='rgba('+c+',0.25)';
      for(let a=0;a<3;a++) for(let q=0;q<3;q++){
        ctx.beginPath(); ctx.arc(x+B*(0.25+a*0.25), bot-B*(0.25+q*0.25), B*0.05,0,Math.PI*2); ctx.fill();
      }
      break;
    case 10: {
      c=dcol(d,'150,220,255');
      ctx.strokeStyle='rgba('+c+',0.5)'; ctx.lineWidth=2.5; ctx.lineCap='round';
      ctx.beginPath();
      for(let p=0;p<=8;p++){ const px=x+p/8*B, py=cy+Math.sin(p/8*Math.PI*2+ftick*0.05)*B*0.18;
        if(p===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.stroke(); ctx.lineCap='butt';
      break;
    }
    case 11:
      c=dcol(d,'255,180,255');
      ctx.strokeStyle='rgba('+c+',0.55)'; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(cx,cy-B*0.4); ctx.lineTo(cx+B*0.4,cy); ctx.lineTo(cx,cy+B*0.4); ctx.lineTo(cx-B*0.4,cy);
      ctx.closePath(); ctx.stroke();
      break;
    case 12:
      c=dcol(d,'255,255,255');
      ctx.fillStyle='rgba('+c+',0.35)';
      [[0.3,0.62,0.2],[0.5,0.5,0.26],[0.72,0.62,0.18],[0.5,0.68,0.2]].forEach(function(q){
        ctx.beginPath(); ctx.arc(x+B*q[0], bot-B*(1-q[1]), B*q[2], 0, Math.PI*2); ctx.fill(); });
      break;
    case 13:
      c=dcol(d,'255,230,80');
      ctx.fillStyle='rgba('+c+',0.85)';
      ctx.beginPath();
      ctx.moveTo(x+B*0.58,bot-B*0.95); ctx.lineTo(x+B*0.25,bot-B*0.45); ctx.lineTo(x+B*0.48,bot-B*0.45);
      ctx.lineTo(x+B*0.38,bot-B*0.05); ctx.lineTo(x+B*0.76,bot-B*0.58); ctx.lineTo(x+B*0.52,bot-B*0.58);
      ctx.closePath(); ctx.fill();
      break;
    case 14:
      c=dcol(d,'255,90,140');
      ctx.fillStyle='rgba('+c+',0.8)';
      ctx.beginPath();
      ctx.moveTo(cx,bot-B*0.18);
      ctx.bezierCurveTo(x+B*0.05,bot-B*0.5, x+B*0.2,bot-B*0.92, cx,bot-B*0.66);
      ctx.bezierCurveTo(x+B*0.8,bot-B*0.92, x+B*0.95,bot-B*0.5, cx,bot-B*0.18);
      ctx.fill();
      break;
    case 15:
      c=dcol(d,'255,255,255');
      ctx.fillStyle='rgba('+c+',0.55)';
      ctx.fillRect(cx-B*0.1,cy-B*0.38,B*0.2,B*0.76); ctx.fillRect(cx-B*0.38,cy-B*0.1,B*0.76,B*0.2);
      break;
    case 16:
      c=dcol(d,'255,255,255');
      ctx.strokeStyle='rgba('+c+',0.55)'; ctx.lineWidth=2.5; ctx.lineJoin='round';
      ctx.beginPath(); ctx.moveTo(cx,cy-B*0.38); ctx.lineTo(cx+B*0.4,cy+B*0.32); ctx.lineTo(cx-B*0.4,cy+B*0.32);
      ctx.closePath(); ctx.stroke();
      break;
    case 17:
      c=dcol(d,'150,255,210');
      ctx.strokeStyle='rgba('+c+',0.55)'; ctx.lineWidth=2.5;
      ctx.beginPath();
      for(let k=0;k<6;k++){ const a=k*Math.PI/3; const px=cx+Math.cos(a)*B*0.42, py=cy+Math.sin(a)*B*0.42; if(k) ctx.lineTo(px,py); else ctx.moveTo(px,py); }
      ctx.closePath(); ctx.stroke();
      break;
    case 18:
      c=dcol(d,'200,210,235');
      ctx.translate(cx,cy); ctx.rotate(ftick*0.02*((Math.round(d.gx)&1)?-1:1));
      sawGearPath(B*0.45, 10);
      ctx.fillStyle='rgba('+c+',0.25)'; ctx.fill();
      ctx.strokeStyle='rgba('+c+',0.6)'; ctx.lineWidth=2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,B*0.12,0,Math.PI*2); ctx.stroke();
      break;
    case 19:
      c=dcol(d,'255,255,255');
      ctx.fillStyle='rgba('+c+',0.14)'; ctx.fillRect(x+B*0.25,bot-B,B*0.5,B);
      ctx.fillStyle='rgba('+c+',0.3)';
      ctx.fillRect(x+B*0.15,bot-B,B*0.7,B*0.12); ctx.fillRect(x+B*0.15,bot-B*0.12,B*0.7,B*0.12);
      break;
    case 20:
      c=dcol(d,'255,255,255');
      ctx.lineWidth=Math.max(3,B*0.08); ctx.lineCap='round'; ctx.lineJoin='round';
      for(let j=0;j<3;j++){
        const a=0.2+0.6*((Math.sin(ftick*0.12-j*0.9)+1)/2);
        ctx.strokeStyle='rgba('+c+','+a+')';
        const bx=x+B*(0.12+j*0.27);
        ctx.beginPath(); ctx.moveTo(bx,cy-B*0.22); ctx.lineTo(bx+B*0.18,cy); ctx.lineTo(bx,cy+B*0.22); ctx.stroke();
      }
      break;
    case 21:
      c=dcol(d,'255,255,255');
      ctx.fillStyle='rgba('+c+',0.3)'; ctx.fillRect(x+B*0.08,bot-B*0.92,B*0.84,B*0.84);
      break;
    case 22:
      c=dcol(d,'255,255,255');
      ctx.fillStyle='rgba('+c+',0.3)';
      ctx.beginPath(); ctx.arc(cx,bot,B*0.48,Math.PI,0); ctx.closePath(); ctx.fill();
      break;
    case 23:
      c=dcol(d,'90,230,110');
      ctx.strokeStyle='rgba('+c+',0.8)'; ctx.lineWidth=Math.max(2,B*0.06); ctx.lineCap='round';
      [[-0.3,0.45],[-0.15,0.7],[0,0.55],[0.15,0.75],[0.3,0.42]].forEach(function(q,i){
        const sw=Math.sin(ftick*0.04+i+d.gx)*B*0.05;
        ctx.beginPath(); ctx.moveTo(cx+q[0]*B,bot); ctx.quadraticCurveTo(cx+q[0]*B*1.2,bot-q[1]*B*0.5,cx+q[0]*B*1.4+sw,bot-q[1]*B); ctx.stroke();
      });
      break;
    case 24: {
      c=dcol(d,'255,255,220');
      const g=ctx.createLinearGradient(0,bot,0,bot-B*3);
      g.addColorStop(0,'rgba('+c+','+(0.35+0.15*pulse)+')'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.moveTo(x+B*0.3,bot); ctx.lineTo(x+B*0.7,bot); ctx.lineTo(x+B*0.95,bot-B*3); ctx.lineTo(x+B*0.05,bot-B*3); ctx.closePath(); ctx.fill();
      break;
    }
    case 26: {
      c=dcol(d,'130,210,255');
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,B*0.9);
      g.addColorStop(0,'rgba('+c+','+(0.5+0.25*pulse)+')'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g; ctx.fillRect(cx-B,cy-B,B*2,B*2);
      break;
    }
    case 27: {
      c=dcol(d,'255,140,40');
      const fl=Math.sin(ftick*0.3+d.gx)*B*0.05;
      ctx.fillStyle='rgba(90,70,60,0.9)'; ctx.fillRect(cx-B*0.06,bot-B*0.45,B*0.12,B*0.45);
      ctx.fillStyle='rgba('+c+',0.85)';
      ctx.beginPath(); ctx.moveTo(cx-B*0.16,bot-B*0.45); ctx.quadraticCurveTo(cx-B*0.18,bot-B*0.75,cx+fl,bot-B*0.98);
      ctx.quadraticCurveTo(cx+B*0.18,bot-B*0.75,cx+B*0.16,bot-B*0.45); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,240,160,0.9)';
      ctx.beginPath(); ctx.ellipse(cx,bot-B*0.56,B*0.06,B*0.12,0,0,Math.PI*2); ctx.fill();
      break;
    }
    case 28: case 29: case 32: case 33: {
      c=dcol(d, d.k===33?'70,150,255':'255,110,30');
      const inner=d.k===33?'rgba(210,240,255,0.95)':'rgba(255,225,110,0.95)';
      ctx.globalCompositeOperation='lighter';
      if(d.k===29){
        [[0.18,0.36,0.6],[0.5,0.44,0.85],[0.82,0.36,0.55]].forEach(function(q,i){
          flame(x+B*q[0], bot, B*q[1], B*q[2], d.gx*1.3+i*2.1, 'rgba('+c+',0.85)', inner);
        });
      } else if(d.k===32) flame(cx, bot, B*0.75, B*2.6, d.gx, 'rgba('+c+',0.85)', inner);
      else flame(cx, bot, B*0.8, B*0.95, d.gx, 'rgba('+c+',0.85)', inner);
      break;
    }
    case 30: {
      c=dcol(d,'255,150,50');
      ctx.globalCompositeOperation='lighter';
      for(let j=0;j<7;j++){
        const ph=(ftick*0.012+j/7+d.gx*0.37)%1;
        const px=x+B*(0.15+0.7*((j*0.37+d.gx*0.13)%1))+Math.sin(ftick*0.05+j)*B*0.08, py=bot-ph*B*1.6;
        ctx.fillStyle='rgba('+c+','+(1-ph)+')';
        ctx.fillRect(px-B*0.04, py-B*0.04, B*0.08, B*0.08);
      }
      break;
    }
    case 31: {
      c=dcol(d,'255,110,30');
      ctx.fillStyle='rgba(70,74,90,0.95)'; ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x+B*0.1,bot-B*0.45); ctx.lineTo(x+B*0.9,bot-B*0.45); ctx.lineTo(x+B*0.7,bot-B*0.2); ctx.lineTo(x+B*0.3,bot-B*0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(cx-B*0.06,bot-B*0.2,B*0.12,B*0.2); ctx.fillRect(cx-B*0.22,bot-B*0.05,B*0.44,B*0.05);
      ctx.globalCompositeOperation='lighter';
      flame(cx, bot-B*0.45, B*0.7, B*0.75, d.gx, 'rgba('+c+',0.85)', 'rgba(255,225,110,0.95)');
      break;
    }
    case 34: {
      c=dcol(d,'255,120,30');
      ctx.globalCompositeOperation='lighter';
      const fl=Math.sin(ftick*0.4+d.gx)*B*0.03;
      ctx.fillStyle='rgba('+c+',0.55)';
      ctx.beginPath(); ctx.moveTo(cx+B*0.05,cy-B*0.26); ctx.quadraticCurveTo(cx-B*0.5,cy-B*0.12+fl,x-B*0.4,cy+fl); ctx.quadraticCurveTo(cx-B*0.5,cy+B*0.12+fl,cx+B*0.05,cy+B*0.26); ctx.closePath(); ctx.fill();
      const g=ctx.createRadialGradient(cx+B*0.1,cy,0,cx+B*0.1,cy,B*0.3);
      g.addColorStop(0,'rgba(255,250,200,1)'); g.addColorStop(0.5,'rgba('+c+',0.95)'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx+B*0.1,cy,B*0.3,0,Math.PI*2); ctx.fill();
      break;
    }
    case 35: {
      c=dcol(d,'255,255,255');
      ctx.globalCompositeOperation='lighter';
      const g=ctx.createLinearGradient(0,bot,0,bot-B);
      g.addColorStop(0,'rgba('+c+',0.6)'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g; ctx.fillRect(x,bot-B,B,B);
      break;
    }
    case 36: {
      c=dcol(d,'255,255,255');
      ctx.globalCompositeOperation='lighter';
      const g=ctx.createRadialGradient(x,bot,0,x,bot,B);
      g.addColorStop(0,'rgba('+c+',0.6)'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g; ctx.fillRect(x,bot-B,B,B);
      break;
    }
    case 37: case 41: {
      c=dcol(d,'255,255,255');
      ctx.globalCompositeOperation='lighter';
      const R=d.k===37?B*1.6:B*0.95, oy=d.k===37?cy:bot;
      const g=ctx.createRadialGradient(cx,oy,0,cx,oy,R);
      g.addColorStop(0,'rgba('+c+','+(0.45+0.15*pulse)+')'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g;
      if(d.k===37) ctx.fillRect(cx-R,cy-R,R*2,R*2); else ctx.fillRect(cx-R,bot-R,R*2,R);
      break;
    }
    case 38: {
      c=dcol(d,'255,255,255');
      ctx.globalCompositeOperation='lighter';
      [[B*0.22,0.12],[B*0.12,0.25],[B*0.05,0.8]].forEach(function(q){
        ctx.strokeStyle='rgba('+c+','+q[1]+')'; ctx.lineWidth=q[0];
        ctx.beginPath(); ctx.arc(cx,cy,B*0.36,0,Math.PI*2); ctx.stroke();
      });
      break;
    }
    case 39: {
      c=dcol(d,'255,255,255');
      ctx.globalCompositeOperation='lighter';
      [[B*0.22,0.12],[B*0.12,0.25],[B*0.05,0.8]].forEach(function(q){
        ctx.strokeStyle='rgba('+c+','+q[1]+')'; ctx.lineWidth=q[0];
        ctx.strokeRect(x+B*0.15,bot-B*0.85,B*0.7,B*0.7);
      });
      break;
    }
    case 40: {
      c=dcol(d,'255,255,255');
      ctx.globalCompositeOperation='lighter';
      const g=ctx.createLinearGradient(0,cy-B*0.2,0,cy+B*0.2);
      g.addColorStop(0,'rgba('+c+',0)'); g.addColorStop(0.5,'rgba('+c+',0.85)'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g; ctx.fillRect(x,cy-B*0.2,B,B*0.4);
      break;
    }
    case 42: {
      c=dcol(d,'255,255,255');
      ctx.globalCompositeOperation='lighter';
      const g=ctx.createLinearGradient(0,bot,0,bot-B*0.95);
      g.addColorStop(0,'rgba('+c+',0.7)'); g.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.moveTo(x+B*0.05,bot); ctx.lineTo(cx,bot-B*0.95); ctx.lineTo(x+B*0.95,bot); ctx.closePath(); ctx.fill();
      break;
    }
    case DECO_TEXT:
      c=dcol(d,'255,255,255');
      ctx.font='900 '+Math.round(B*0.55)+'px "Arial Black",Arial';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.lineWidth=5; ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineJoin='round';
      ctx.strokeText(d.tx||'', x+B*0.1, cy);
      ctx.fillStyle='rgb('+c+')'; ctx.fillText(d.tx||'', x+B*0.1, cy);
      break;
  }
  ctx.restore();
}
function drawPortal(p){
  const x=(egx(p)+0.5)*B-camX;
  if(x<-80-cullPad || x>W+80+cullPad) return;
  const yC=groundY-(egy(p)+1.5)*B;
  const small=(p.m==='mini');
  const rh=1.6*B, rw=0.55*B;
  const col = p.m==='ship' ? '255,102,255'
            : p.m==='ball' ? '255,60,60'
            : p.m==='wave' ? '70,150,255'
            : p.m==='gdown' ? '70,150,255'
            : p.m==='gup' ? '255,225,77'
            : p.m==='ufo' ? '255,150,40'
            : p.m==='spider' ? '170,70,255'
            : p.m==='robot' ? '235,235,245'
            : p.m==='mini' ? '255,110,210'
            : p.m==='big' ? '60,255,170'
            : '102,255,102';
  ctx.save(); ctx.translate(x,yC);
  if(p.r) ctx.rotate((p.r&3)*Math.PI/2);
  ctx.fillStyle='rgba('+col+',0.22)';
  ctx.strokeStyle='rgba('+col+',0.95)'; ctx.lineWidth=4;
  ctx.beginPath(); ctx.ellipse(0,0,rw,rh,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,0,rw*0.55,rh*0.8,0,0,Math.PI*2); ctx.stroke();
  if(p.m==='gdown' || p.m==='gup'){
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    if(p.m==='gdown'){
      ctx.moveTo(0,-rh*0.35); ctx.lineTo(0,rh*0.35);
      ctx.moveTo(-rw*0.35,rh*0.1); ctx.lineTo(0,rh*0.35); ctx.lineTo(rw*0.35,rh*0.1);
    } else {
      ctx.moveTo(0,rh*0.35); ctx.lineTo(0,-rh*0.35);
      ctx.moveTo(-rw*0.35,-rh*0.1); ctx.lineTo(0,-rh*0.35); ctx.lineTo(rw*0.35,-rh*0.1);
    }
    ctx.stroke();
  } else if(p.m==='mini' || p.m==='big'){
    ctx.fillStyle='#fff';
    const r=small?rw*0.18:rw*0.36;
    ctx.beginPath(); ctx.arc(0,-rh*0.25,r,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0,rh*0.25,r,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
const ORB_COL={y:'255,225,77', p:'255,123,213', b:'70,150,255', r:'255,70,70', k:'30,30,34', d:'70,255,110', g:'40,215,70', q:'255,70,190'};
function drawOrb(o, used){
  const x=(egx(o)+0.5)*B-camX, y=groundY-(egy(o)+0.5)*B;
  if(x<-60-cullPad || x>W+60+cullPad) return;
  const c = ORB_COL[o.k]||ORB_COL.y, dsh=(o.k==='d'||o.k==='q');
  const pul = 1+0.1*Math.sin(ftick*0.15+o.gx);
  const r = B*0.42*pul, al = used?0.25:1;
  ctx.fillStyle='rgba('+(o.k==='k'?'255,255,255':c)+','+(0.16*al)+')';
  ctx.beginPath(); ctx.arc(x,y,r*1.7,0,Math.PI*2); ctx.fill();
  if(dsh){
    ctx.strokeStyle='rgba('+c+','+(0.9*al)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(x,y,r*1.35,0,Math.PI*2); ctx.stroke();
  }
  ctx.fillStyle='rgba('+c+','+(0.9*al)+')';
  ctx.strokeStyle='rgba(255,255,255,'+(0.9*al)+')'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
  if(dsh){
    ctx.save(); ctx.translate(x,y);
    ctx.strokeStyle='rgba(255,255,255,'+al+')'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(-r*0.5,0); ctx.lineTo(r*0.55,0); ctx.moveTo(r*0.2,-r*0.35); ctx.lineTo(r*0.55,0); ctx.lineTo(r*0.2,r*0.35); ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle='rgba(255,255,255,'+(0.7*al)+')';
    ctx.beginPath(); ctx.arc(x-r*0.25,y-r*0.3,r*0.28,0,Math.PI*2); ctx.fill();
  }
}

function drawPad(pd){
  const x=(egx(pd)+0.5)*B-camX, gy=egy(pd);
  if(x<-60-cullPad || x>W+60+cullPad) return;
  const c = pd.k==='p' ? '255,123,213' : pd.k==='b' ? '70,150,255' : '255,225,77';
  const w=B*0.74, h=B*0.18, pul=0.6+0.4*Math.abs(Math.sin(ftick*0.12+pd.gx));
  const ceil=(pd.r===1);
  const baseY = ceil ? groundY-(gy+1)*B : groundY-gy*B;
  const d = ceil ? -1 : 1;
  ctx.fillStyle='rgba('+c+','+(0.22*pul)+')';
  ctx.beginPath(); ctx.ellipse(x, baseY-d*h*0.5, w*0.75, h*1.7, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba('+c+',0.95)';
  ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2; ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(x-w/2, baseY); ctx.lineTo(x-w*0.3, baseY-d*h);
  ctx.lineTo(x+w*0.3, baseY-d*h); ctx.lineTo(x+w/2, baseY);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineJoin='miter';
}
function drawStart(s, active, idx){
  const x=s.gx*B-camX, baseY=groundY-(s.gy||0)*B;
  if(x+B<0 || x>W) return;
  const top=baseY-B*1.55;
  ctx.save();
  ctx.globalAlpha = active?1:0.5;
  ctx.strokeStyle='#7CFC66'; ctx.lineWidth=active?3:2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x+3,baseY); ctx.lineTo(x+3,top); ctx.stroke();
  ctx.fillStyle = active?'#7CFC66':'rgba(124,252,102,0.7)';
  ctx.strokeStyle='#063'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(x+3,top); ctx.lineTo(x+B*0.7,top+B*0.26);
  ctx.lineTo(x+3,top+B*0.52); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#04220f'; ctx.font='bold '+Math.round(B*0.28)+'px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(''+(idx+1), x+B*0.3, top+B*0.26);
  if(active){
    ctx.strokeStyle='rgba(124,252,102,0.9)'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.strokeRect(x+1, baseY-B+1, B-2, B-2); ctx.setLineDash([]);
  }
  ctx.restore();
}
function drawTrigger(t){
  const x=t.gx*B-camX, bot=groundY-(t.gy||0)*B, cx=x+B/2, cy=bot-B/2;
  if(x+B<0 || x>W) return;
  if(state==='play') return;
  ctx.save();
  ctx.globalAlpha *= 0.95;
  ctx.lineWidth=2; ctx.strokeStyle='#fff';
  if(t.type==='spawn'){
    ctx.fillStyle='rgba(255,160,40,0.6)'; ctx.strokeStyle='#ffd27a';
    ctx.beginPath(); ctx.arc(cx,cy,B*0.34,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.moveTo(cx-B*0.1,cy-B*0.16); ctx.lineTo(cx+B*0.16,cy); ctx.lineTo(cx-B*0.1,cy+B*0.16); ctx.closePath(); ctx.fill();
    trigLabel('S'+(t.g||0)+(t.dl?' '+t.dl+'s':''), cx, bot-B*0.5);
  } else if(t.type==='toggle'){
    ctx.fillStyle=t.on?'rgba(80,230,90,0.6)':'rgba(255,70,70,0.6)';
    ctx.fillRect(x+B*0.18, bot-B*0.82, B*0.64, B*0.64);
    ctx.strokeRect(x+B*0.18, bot-B*0.82, B*0.64, B*0.64);
    trigLabel((t.on?'ON ':'OFF ')+(t.g||0), cx, bot-B*0.5);
  } else if(t.type==='color'){
    ctx.fillStyle='rgb('+t.col.join(',')+')';
    ctx.beginPath();
    ctx.moveTo(cx,cy-B*0.34); ctx.lineTo(cx+B*0.34,cy); ctx.lineTo(cx,cy+B*0.34); ctx.lineTo(cx-B*0.34,cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    trigLabel(CH_NAMES[t.ch]||('C'+t.ch), cx, bot-B*0.5);
  } else if(t.type==='alpha'){
    ctx.fillStyle='rgba(180,180,200,0.45)';
    ctx.beginPath(); ctx.arc(cx,cy,B*0.34,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(cx,cy,B*0.34,-Math.PI/2,Math.PI/2); ctx.fill();
    trigLabel('A'+(t.g||0), cx, bot-B*0.5);
  } else {
    ctx.fillStyle='rgba(40,150,255,0.5)';
    ctx.strokeStyle='#7fd0ff';
    ctx.fillRect(x+B*0.18, bot-B*0.82, B*0.64, B*0.64);
    ctx.strokeRect(x+B*0.18, bot-B*0.82, B*0.64, B*0.64);
    const ang=Math.atan2(-(t.dy||0), (t.dx||0)||0.0001);
    ctx.save();
    ctx.translate(cx,cy); ctx.rotate(ang);
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(-B*0.2,0); ctx.lineTo(B*0.2,0);
    ctx.moveTo(B*0.06,-B*0.13); ctx.lineTo(B*0.2,0); ctx.lineTo(B*0.06,B*0.13);
    ctx.stroke();
    ctx.restore();
    trigLabel('G'+(t.g||0), cx, bot-B*0.5);
  }
  if(t.tg) trigLabel('#'+t.tg, cx, bot-B*1.05);
  if(t.sp){
    ctx.strokeStyle='rgba(255,210,122,0.9)'; ctx.lineWidth=2; ctx.setLineDash([4,3]);
    ctx.strokeRect(x+2, bot-B+2, B-4, B-4); ctx.setLineDash([]);
  }
  ctx.restore();
}
function trigLabel(txt, x, y){
  ctx.font='900 '+Math.round(B*0.26)+'px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,0.8)'; ctx.strokeText(txt,x,y);
  ctx.fillStyle='#fff'; ctx.fillText(txt,x,y);
}
function pivotOf(o){
  const k=o._k, x=egx(o), y=egy(o);
  if(k==='blocks') return [x+o.w/2, y+o.h/2];
  if(k==='portals') return [x+0.5, y+1.5];
  if(k==='speeds') return [x+0.5, y+0.85];
  if(k==='slopes') return [x+(o.w||1)/2, y+(o.h||1)/2];
  return [x+0.5, y+0.5];
}
let objColorCur='255,255,255';
function drawWrapped(o, fn, arg){
  let a=1;
  if(state==='edit'){ if(typeof edLayer!=='undefined' && edLayer>=0 && (o.el|0)!==edLayer) a=0.28; if(o.inv) a*=0.5; }
  else {
    if(o.g && groupDis[o.g]) return;
    if(o.g && groupAlpha[o.g]!=null) a=groupAlpha[o.g];
    if(o.inv){ const d=Math.abs(pivotOf(o)[0]*B-(P.x+PB/2))/B; a*=Math.max(0,Math.min(1,(d-2)/5)); }
  }
  if(a<=0.004) return;
  objColorCur=chStr(o.c||CH_OBJ);
  const rot=o.rot||0, sc=o.sc||1, fx=o.fx, fy=o.fy;
  if(!rot && sc===1 && !fx && !fy && a===1){ cullPad=0; fn(o,arg); return; }
  ctx.save();
  ctx.globalAlpha*=a;
  if(rot || sc!==1 || fx || fy){
    const pv=pivotOf(o), px=pv[0]*B-camX, py=groundY-pv[1]*B;
    ctx.translate(px,py);
    if(rot) ctx.rotate(rot*Math.PI/180);
    ctx.scale(sc*(fx?-1:1), sc*(fy?-1:1));
    ctx.translate(-px,-py);
  }
  cullPad=B*3*sc;
  fn(o,arg);
  cullPad=0;
  ctx.restore();
}
function drawDecoLayer(decos, front){
  if(!decos) return;
  const arr=[];
  for(let i=0;i<decos.length;i++){
    const z=(decos[i].z!=null?decos[i].z:2);
    if(front ? z>=5 : z<5) arr.push(decos[i]);
  }
  arr.sort(function(a,b){ return (a.z!=null?a.z:2)-(b.z!=null?b.z:2); });
  for(let i=0;i<arr.length;i++) drawWrapped(arr[i], drawDecoObj);
}
function drawLevelObjects(L, live){
  let i;
  drawDecoLayer(L.decos, false);
  for(i=0;i<L.blocks.length;i++) if(L.blocks[i].t===T_BRICKBG) drawWrapped(L.blocks[i], drawBlock);
  for(i=0;i<L.slopes.length;i++) drawWrapped(L.slopes[i], drawSlope);
  for(i=0;i<L.speeds.length;i++) drawWrapped(L.speeds[i], drawSpeed);
  for(i=0;i<L.portals.length;i++) drawWrapped(L.portals[i], drawPortal);
  for(i=0;i<L.blocks.length;i++) if(L.blocks[i].t!==T_BRICKBG) drawWrapped(L.blocks[i], drawBlock);  for(i=0;i<L.spikes.length;i++) drawWrapped(L.spikes[i], drawSpike);
  for(i=0;i<L.saws.length;i++) drawWrapped(L.saws[i], drawSaw);
  for(i=0;i<L.pads.length;i++) drawWrapped(L.pads[i], drawPad);
  for(i=0;i<L.orbs.length;i++) drawWrapped(L.orbs[i], drawOrb, live?orbUsed[i]:false);
  if(!live) for(i=0;i<L.triggers.length;i++){
    let a=1;
    if(edLayer>=0 && (L.triggers[i].el|0)!==edLayer) a=0.28;
    ctx.save(); ctx.globalAlpha=a; drawTrigger(L.triggers[i]); ctx.restore();
  }
  drawDecoLayer(L.decos, true);
}

// ---------- player ----------
const ICON_DARK='#0a0f1e';
function iconRR(c,x,y,w,h,r){ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); }
function iconCube(c,s,p,f,c1,c2){
  const h=s/2;
  c.fillStyle=c1; c.strokeStyle=ICON_DARK; c.lineWidth=3;
  iconRR(c,-h,-h,s,s,(p+f)%2?9:5); c.fill();
  c.save(); c.clip();
  c.fillStyle=c2; c.strokeStyle=c2; c.lineWidth=s*0.08;
  if(p===0) c.strokeRect(-h*0.62,-h*0.62,h*1.24,h*1.24);
  else if(p===1){ c.beginPath(); c.moveTo(-h,-h); c.lineTo(h,h); c.moveTo(h,-h); c.lineTo(-h,h); c.stroke(); }
  else if(p===2){ c.beginPath(); c.arc(0,0,h*0.62,0,Math.PI*2); c.stroke(); }
  else if(p===3) c.fillRect(-h,h*0.28,s,h*0.72);
  else if(p===4){
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(q){
      c.beginPath(); c.moveTo(q[0]*h,q[1]*h); c.lineTo(q[0]*h*0.3,q[1]*h); c.lineTo(q[0]*h,q[1]*h*0.3); c.closePath(); c.fill();
    });
  } else { c.fillRect(-h*0.74,-h*0.74,h*1.48,h*1.48); c.fillStyle=c1; c.fillRect(-h*0.52,-h*0.52,h*1.04,h*1.04); }
  c.restore();
  iconRR(c,-h,-h,s,s,(p+f)%2?9:5); c.strokeStyle=ICON_DARK; c.lineWidth=3; c.stroke();
  c.fillStyle=ICON_DARK; c.strokeStyle=ICON_DARK;
  if(f===0){
    c.fillRect(-s*0.28,-s*0.30,s*0.16,s*0.30); c.fillRect(s*0.12,-s*0.30,s*0.16,s*0.30);
    c.fillRect(-s*0.21,s*0.12,s*0.42,s*0.14);
  } else if(f===1){
    c.beginPath(); c.arc(-s*0.18,-s*0.16,s*0.08,0,Math.PI*2); c.arc(s*0.18,-s*0.16,s*0.08,0,Math.PI*2); c.fill();
    c.beginPath(); c.moveTo(-s*0.22,s*0.2); c.lineTo(-s*0.07,s*0.07); c.lineTo(s*0.07,s*0.2); c.lineTo(s*0.22,s*0.07); c.lineWidth=3; c.stroke();
  } else if(f===2){
    c.beginPath(); c.moveTo(-s*0.33,-s*0.26); c.lineTo(-s*0.05,-s*0.12); c.lineTo(-s*0.05,s*0.02); c.lineTo(-s*0.33,-s*0.06); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(s*0.33,-s*0.26); c.lineTo(s*0.05,-s*0.12); c.lineTo(s*0.05,s*0.02); c.lineTo(s*0.33,-s*0.06); c.closePath(); c.fill();
    c.fillRect(-s*0.2,s*0.17,s*0.4,s*0.08);
  } else if(f===3){
    c.fillRect(-s*0.34,-s*0.22,s*0.68,s*0.2);
    c.fillStyle='rgba(255,255,255,0.75)'; c.fillRect(-s*0.28,-s*0.19,s*0.12,s*0.05);
    c.fillStyle=ICON_DARK; c.fillRect(-s*0.12,s*0.14,s*0.24,s*0.08);
  } else {
    c.fillStyle='#fff';
    c.beginPath(); c.arc(-s*0.17,-s*0.12,s*0.11,0,Math.PI*2); c.arc(s*0.17,-s*0.12,s*0.11,0,Math.PI*2); c.fill();
    c.fillStyle=ICON_DARK;
    c.beginPath(); c.arc(-s*0.14,-s*0.11,s*0.05,0,Math.PI*2); c.arc(s*0.2,-s*0.11,s*0.05,0,Math.PI*2); c.fill();
    c.lineWidth=3; c.beginPath(); c.arc(0,s*0.08,s*0.17,0.2*Math.PI,0.8*Math.PI); c.stroke();
  }
}
function iconShip(c,s,p,f,c1,c2){
  c.fillStyle=c1; c.strokeStyle=ICON_DARK; c.lineWidth=3;
  c.beginPath();
  if(p===0){ c.moveTo(-s*0.64,-s*0.04); c.quadraticCurveTo(-s*0.72,s*0.45,-s*0.12,s*0.5); c.lineTo(s*0.48,s*0.46); c.quadraticCurveTo(s*0.82,s*0.36,s*0.66,0); c.closePath(); }
  else if(p===1){ c.moveTo(-s*0.66,s*0.36); c.lineTo(-s*0.18,-s*0.2); c.lineTo(s*0.7,0.05*s); c.lineTo(-s*0.18,s*0.46); c.closePath(); }
  else if(p===2){ c.moveTo(-s*0.62,0); c.lineTo(-s*0.2,-s*0.1); c.lineTo(s*0.66,s*0.02); c.lineTo(s*0.66,s*0.22); c.lineTo(-s*0.2,s*0.46); c.closePath(); }
  else if(p===3){ c.moveTo(-s*0.66,s*0.2); c.lineTo(-s*0.5,-s*0.06); c.lineTo(s*0.1,-s*0.06); c.lineTo(s*0.74,s*0.12); c.lineTo(s*0.5,s*0.42); c.lineTo(-s*0.5,s*0.42); c.closePath(); }
  else if(p===4){ c.ellipse(0,s*0.2,s*0.7,s*0.27,0,0,Math.PI*2); }
  else { c.moveTo(-s*0.62,-s*0.02); c.lineTo(s*0.4,-s*0.02); c.lineTo(s*0.72,s*0.2); c.lineTo(s*0.4,s*0.46); c.lineTo(-s*0.62,s*0.46); c.closePath(); }
  c.fill(); c.stroke();
  c.fillStyle=c2;
  if(f===0) c.fillRect(-s*0.48, s*0.15, s*0.96, s*0.11);
  else if(f===1){ c.beginPath(); c.moveTo(-s*0.3,s*0.26); c.lineTo(s*0.22,s*0.26); c.lineTo(-s*0.46,s*0.62); c.closePath(); c.fill(); c.stroke(); }
  else if(f===2){ [-0.25,0.05,0.35].forEach(function(x){ c.beginPath(); c.arc(x*s,s*0.22,s*0.07,0,Math.PI*2); c.fill(); }); }
  else if(f===3){ c.beginPath(); c.moveTo(-s*0.56,s*0.04); c.lineTo(-s*0.74,-s*0.36); c.lineTo(-s*0.32,s*0.02); c.closePath(); c.fill(); c.stroke(); }
  else { c.beginPath(); c.moveTo(s*0.3,s*0.06); c.lineTo(s*0.66,s*0.2); c.lineTo(s*0.3,s*0.36); c.closePath(); c.fill(); }
  c.fillStyle=c2; c.beginPath(); c.moveTo(-s*0.64,s*0.1); c.lineTo(-s*0.9,-s*0.06); c.lineTo(-s*0.9,s*0.3); c.closePath(); c.fill();
}
function iconBall(c,s,p,f,c1,c2){
  const r=s/2;
  c.fillStyle=c1; c.strokeStyle=ICON_DARK; c.lineWidth=3;
  c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.fill();
  c.save(); c.clip();
  c.strokeStyle=c2; c.fillStyle=c2; c.lineWidth=s*0.07;
  if(p===0){ c.beginPath(); c.arc(0,0,r*0.62,0,Math.PI*2); c.stroke(); }
  else if(p===1){ c.beginPath(); c.moveTo(-r,0); c.lineTo(r,0); c.moveTo(0,-r); c.lineTo(0,r); c.stroke(); }
  else if(p===2){ for(let a=0;a<Math.PI*2;a+=Math.PI/3){ c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(a)*r,Math.sin(a)*r); c.stroke(); } }
  else if(p===3) c.fillRect(-r,r*0.1,s,r);
  else if(p===4){ for(let a=0;a<Math.PI*2;a+=Math.PI/3){ c.beginPath(); c.arc(Math.cos(a)*r*0.62,Math.sin(a)*r*0.62,r*0.15,0,Math.PI*2); c.fill(); } }
  else { c.beginPath(); c.arc(0,-r*0.5,r*0.5,Math.PI/2,Math.PI*1.5); c.arc(0,r*0.5,r*0.5,-Math.PI/2,Math.PI/2,true); c.stroke(); }
  c.restore();
  c.strokeStyle=ICON_DARK; c.lineWidth=3; c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.stroke();
  c.fillStyle=ICON_DARK;
  if(f===0){ c.beginPath(); c.moveTo(0,0); c.arc(0,0,r*0.5,-0.5,0.5); c.closePath(); c.fill(); }
  else if(f===1){ c.beginPath(); c.arc(0,0,r*0.22,0,Math.PI*2); c.fill(); }
  else if(f===2){ c.beginPath(); c.arc(-r*0.3,-r*0.15,r*0.12,0,Math.PI*2); c.arc(r*0.3,-r*0.15,r*0.12,0,Math.PI*2); c.fill(); }
  else if(f===3){ c.fillRect(-r*0.75,-r*0.12,r*1.5,r*0.24); }
  else { c.lineWidth=3; c.beginPath(); c.arc(0,0,r*0.3,0,Math.PI*2); c.stroke(); }
}
function iconWave(c,s,p,f,c1,c2){
  const w=s*0.58;
  c.fillStyle=c1; c.strokeStyle=ICON_DARK; c.lineWidth=3;
  c.beginPath();
  if(p===0){ c.moveTo(w*0.86,0); c.lineTo(-w*0.62,-w*0.6); c.lineTo(-w*0.2,0); c.lineTo(-w*0.62,w*0.6); }
  else if(p===1){ c.moveTo(w*0.95,0); c.lineTo(-w*0.7,-w*0.36); c.lineTo(-w*0.45,0); c.lineTo(-w*0.7,w*0.36); }
  else if(p===2){ c.moveTo(w*0.86,0); c.lineTo(-w*0.6,-w*0.62); c.lineTo(-w*0.6,w*0.62); }
  else if(p===3){ c.moveTo(w*0.9,0); c.lineTo(w*0.05,-w*0.55); c.lineTo(w*0.05,-w*0.2); c.lineTo(-w*0.7,-w*0.6); c.lineTo(-w*0.35,0); c.lineTo(-w*0.7,w*0.6); c.lineTo(w*0.05,w*0.2); c.lineTo(w*0.05,w*0.55); }
  else if(p===4){ c.moveTo(w*0.9,0); c.lineTo(-w*0.1,-w*0.5); c.lineTo(-w*0.7,0); c.lineTo(-w*0.1,w*0.5); }
  else { c.moveTo(w*0.9,0); c.quadraticCurveTo(-w*0.2,-w*0.8,-w*0.65,0); c.quadraticCurveTo(-w*0.2,w*0.8,w*0.9,0); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle=c2; c.strokeStyle=c2; c.lineWidth=2.5;
  if(f===0){ c.beginPath(); c.moveTo(-w*0.36,-w*0.24); c.lineTo(w*0.42,0); c.lineTo(-w*0.36,w*0.24); c.stroke(); }
  else if(f===1){ c.beginPath(); c.moveTo(w*0.45,0); c.lineTo(-w*0.25,-w*0.25); c.lineTo(-w*0.25,w*0.25); c.closePath(); c.fill(); }
  else if(f===2){ c.fillStyle=ICON_DARK; c.beginPath(); c.arc(w*0.1,0,w*0.13,0,Math.PI*2); c.fill(); }
  else if(f===3){ c.beginPath(); c.moveTo(-w*0.4,0); c.lineTo(w*0.6,0); c.stroke(); }
  else { c.fillStyle=c2; c.beginPath(); c.arc(-w*0.05,0,w*0.16,0,Math.PI*2); c.fill(); c.fillStyle=ICON_DARK; c.beginPath(); c.arc(-w*0.05,0,w*0.07,0,Math.PI*2); c.fill(); }
}
function iconUfo(c,s,p,f,c1,c2){
  c.save(); c.translate(0,-s*0.16); c.scale(0.62,0.62);
  const ci=selectedIcons.cube|0;
  iconCube(c,s,ci%6,Math.floor(ci/6)%5,c1,c2);
  c.restore();
  c.fillStyle=c1; c.strokeStyle=ICON_DARK; c.lineWidth=3;
  c.beginPath();
  if(p===0) c.ellipse(0,s*0.2,s*0.58,s*0.22,0,0,Math.PI*2);
  else if(p===1){ if(c.roundRect) c.roundRect(-s*0.6,s*0.06,s*1.2,s*0.28,s*0.12); else c.rect(-s*0.6,s*0.06,s*1.2,s*0.28); }
  else if(p===2){ c.moveTo(-s*0.6,s*0.1); c.lineTo(s*0.6,s*0.1); c.quadraticCurveTo(s*0.4,s*0.5,0,s*0.5); c.quadraticCurveTo(-s*0.4,s*0.5,-s*0.6,s*0.1); }
  else if(p===3) c.ellipse(0,s*0.22,s*0.62,s*0.18,0,0,Math.PI*2);
  else if(p===4){ c.moveTo(-s*0.64,s*0.2); c.lineTo(0,s*0.04); c.lineTo(s*0.64,s*0.2); c.lineTo(0,s*0.42); }
  else { c.ellipse(0,s*0.14,s*0.5,s*0.15,0,0,Math.PI*2); c.moveTo(s*0.62,s*0.3); c.ellipse(0,s*0.3,s*0.62,s*0.15,0,0,Math.PI*2); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle=c2;
  if(f===0) [-0.34,0,0.34].forEach(function(x){ c.beginPath(); c.arc(x*s,s*0.21,s*0.055,0,Math.PI*2); c.fill(); });
  else if(f===1) c.fillRect(-s*0.45,s*0.17,s*0.9,s*0.07);
  else if(f===2) [-0.4,-0.2,0,0.2,0.4].forEach(function(x){ c.beginPath(); c.arc(x*s,s*0.22,s*0.04,0,Math.PI*2); c.fill(); });
  else if(f===3){ c.strokeStyle=c2; c.lineWidth=2.5; c.beginPath(); c.ellipse(0,s*0.21,s*0.42,s*0.1,0,0,Math.PI*2); c.stroke(); }
  else { c.beginPath(); c.arc(0,s*0.24,s*0.1,0,Math.PI*2); c.fill(); }
}
let robotPose=null;
function iconRobot(c,s,p,f,c1,c2){
  const A=robotPose;
  let ph=0, air=false, rise=false, boost=false;
  if(A){ ph=A.x*0.05; air=A.air; rise=A.vy<0; boost=A.boost; }
  c.lineWidth=3; c.strokeStyle=ICON_DARK; c.lineJoin='round';
  const TR=2.53, SR=0.73, TL=0.32, SL=0.25;
  function poly(pts,col){
    c.fillStyle=col; c.beginPath();
    pts.forEach(function(q,i){ if(i) c.lineTo(q[0]*s,q[1]*s); else c.moveTo(q[0]*s,q[1]*s); });
    c.closePath(); c.fill(); c.stroke();
  }
  function leg(hx,col,t,k,ft){
    c.save(); c.translate(hx*s,-0.02*s);
    const ta=TR+t, sa=SR+k;
    c.rotate(ta);
    c.fillStyle=col; iconRR(c,-0.10*s,-0.09*s,(TL+0.18)*s,0.18*s,0.09*s); c.fill(); c.stroke();
    c.translate(TL*s,0);
    c.rotate(sa-ta);
    c.fillStyle=col; iconRR(c,-0.04*s,-0.045*s,(SL+0.08)*s,0.09*s,0.04*s); c.fill(); c.stroke();
    c.translate(SL*s,0);
    c.rotate(-sa+ft);
    if(A && air && boost){
      const fl=0.12+0.05*Math.sin(A.x*0.6);
      c.fillStyle='#ffb340';
      c.beginPath(); c.moveTo(-0.05*s,0.16*s); c.lineTo(0.15*s,0.16*s); c.lineTo(0.05*s,(0.16+fl)*s); c.closePath(); c.fill();
    }
    poly([[-0.12,0.14],[-0.03,-0.02],[0.07,-0.02],[0.26,0.14]],col);
    c.restore();
  }
  function headPic(){
    const hw=0.35, hh=0.26;
    function X(u){ return (-hw+u*2*hw)*s; }
    function Y(v){ return (-hh+v*2*hh)*s; }
    const R=[
      [[0,0.52],[0.28,0.35],[0.51,0.72],[0.68,0.64],[0.81,0.81],[1,0.66]],
      [[0,0.6],[0.25,0.3],[0.5,0.65],[0.75,0.35],[1,0.6]],
      [[0,0.7],[0.35,0.4],[0.6,0.55],[1,0.3]],
      [[0,0.55],[0.3,0.55],[0.3,0.4],[0.7,0.4],[0.7,0.65],[1,0.65]],
      [[0,0.5],[0.15,0.7],[0.3,0.4],[0.45,0.7],[0.6,0.4],[0.75,0.7],[0.9,0.4],[1,0.55]],
      [[0,0.35],[0.5,0.75],[1,0.35]]
    ][p%6];
    const SU=[[0.65,0.36,0.065],[0.25,0.3,0.065],[0.8,0.25,0.05],[0.45,0.3,0.08],[0.65,0.36,0.065]][f%5];
    c.save();
    c.fillStyle=c2; iconRR(c,X(0),Y(0),2*hw*s,2*hh*s,0.03*s); c.fill();
    c.save();
    iconRR(c,X(0),Y(0),2*hw*s,2*hh*s,0.03*s); c.clip();
    c.fillStyle=c1; c.beginPath(); c.moveTo(X(0),Y(0)); c.lineTo(X(1),Y(0));
    for(let i=R.length-1;i>=0;i--) c.lineTo(X(R[i][0]),Y(R[i][1]));
    c.closePath(); c.fill();
    c.restore();
    c.beginPath();
    R.forEach(function(q,i){ if(i) c.lineTo(X(q[0]),Y(q[1])); else c.moveTo(X(q[0]),Y(q[1])); });
    c.stroke();
    iconRR(c,X(0),Y(0),2*hw*s,2*hh*s,0.03*s); c.stroke();
    c.fillStyle='#fff';
    c.beginPath();
    if(f%5===4){
      const sx=X(SU[0]), sy=Y(SU[1]), r=SU[2]*s*1.3;
      c.moveTo(sx,sy-r); c.lineTo(sx+r,sy); c.lineTo(sx,sy+r); c.lineTo(sx-r,sy); c.closePath();
    } else c.arc(X(SU[0]),Y(SU[1]),SU[2]*s,0,Math.PI*2);
    c.fill(); c.stroke();
    c.restore();
  }
  let ft1=0, fk1=0, ft2=0, fk2=0, bob=0, toe=0;
  if(A){
    if(!air){
      ft1=Math.sin(ph)*0.5;           fk1=Math.cos(ph)*0.45;
      ft2=Math.sin(ph+Math.PI)*0.5;   fk2=Math.cos(ph+Math.PI)*0.45;
      bob=-Math.abs(Math.sin(ph))*0.025;
    } else if(boost){ ft1=-0.9; fk1=0.8; ft2=-0.8; fk2=0.7; toe=0.1; }
    else if(rise){ ft1=0.3; fk1=-0.6; ft2=0.15; fk2=-0.45; toe=-0.3; }
    else { ft1=-0.35; fk1=0.45; ft2=-0.2; fk2=0.3; toe=0.2; }
  }
  leg(-0.17,c1,ft2,fk2,toe);
  c.save(); c.translate(0.05*s,(-0.2+bob)*s); c.rotate(0.05);
  headPic();
  c.restore();
  leg(-0.10,c1,ft1,fk1,toe);
}
let spiderPose=null;
function iconSpider(c,s,p,f,c1,c2){
  const A=spiderPose;
  const ph=A?A.x*0.06:0, air=A?A.air:false;
  c.lineJoin='round'; c.lineCap='round'; c.lineWidth=3; c.strokeStyle=ICON_DARK;
  const K=s/303;
  function X(ix){ return (ix-255)*K; }
  function Y(iy){ return (iy-156.5)*K; }
  function R(r){ return r*K; }
  function trace(cmds){
    c.beginPath();
    cmds.forEach(function(q){
      if(q[0]==='M') c.moveTo(X(q[1]),Y(q[2]));
      else if(q[0]==='L') c.lineTo(X(q[1]),Y(q[2]));
      else c.quadraticCurveTo(X(q[1]),Y(q[2]),X(q[3]),Y(q[4]));
    });
    c.closePath();
  }
  function leg(cmds,px,py,ang,dy,hl,shade){
    c.save();
    c.translate(0,(dy/303)*s);
    c.translate(X(px),Y(py)); c.rotate(ang); c.translate(-X(px),-Y(py));
    trace(cmds); c.fillStyle=c2; c.fill();
    if(shade){ c.fillStyle='rgba(0,0,0,'+shade+')'; c.fill(); }
    c.stroke();
    if(hl){
      c.strokeStyle='rgba(255,255,255,0.4)'; c.lineWidth=2.2;
      c.beginPath(); c.moveTo(X(hl[0]),Y(hl[1])); c.quadraticCurveTo(X(hl[2]),Y(hl[3]),X(hl[4]),Y(hl[5])); c.stroke();
    }
    c.restore();
  }
  const L1=[['M',105,140],['Q',15,180,22,303],['Q',90,240,165,160]];
  const L2=[['M',172,190],['Q',178,138,228,138],['Q',282,140,280,180],['Q',272,240,206,308],['L',168,308],['Q',160,250,172,190]];
  const L3=[['M',264,230],['Q',262,215,305,222],['Q',350,222,350,240],['L',336,305],['L',272,305]];
  const L4=[['M',398,215],['Q',404,152,448,152],['Q',495,155,490,210],['Q',495,262,472,306],['L',428,306],['Q',420,255,398,215]];
  let a1=0,a2=0,a3=0,a4=0,d1=0,d2=0,d3=0,d4=0;
  if(A){
    if(!air){
      a1=0.12*Math.sin(ph); a2=0.12*Math.sin(ph+Math.PI);
      a3=0.1*Math.sin(ph+1.6); a4=0.12*Math.sin(ph+Math.PI*1.5);
      d1=-Math.max(0,Math.sin(ph))*30; d2=-Math.max(0,Math.sin(ph+Math.PI))*30;
      d3=-Math.max(0,Math.sin(ph+1.6))*22; d4=-Math.max(0,Math.sin(ph+Math.PI*1.5))*30;
    } else { a1=-0.3; a2=-0.12; a3=0.1; a4=0.3; d1=-55; d2=-48; d3=-40; d4=-52; }
  }
  // body shape variants (6 skins patterns)
  const BV=[[95,230,135],[55,232,142],[150,230,118],[120,205,150],[75,252,128],[108,218,96]][p%6];
  const ax=BV[0], fx=BV[1], fy=BV[2];
  const body=[['M',ax,5],['L',440,5],['L',440,180],['L',388,220],['L',285,195],['L',fx,fy]];
  // back legs first
  leg(L3,305,225,a3,d3,null,0.4);
  leg(L1,130,140,a1,d1,[95,155,40,185,38,260],0.15);
  // body
  trace(body); c.fillStyle=c1; c.fill();
  c.save(); c.clip();
  c.fillStyle='rgba(0,0,0,0.2)';
  trace([['M',ax,5],['L',228,5],['L',228,fy],['L',fx,fy]]); c.fill();
  c.restore();
  trace(body); c.stroke();
  // eye (5 variants)
  const ex=343, ey=92;
  if(f===1){
    [[315,78],[388,78]].forEach(function(q){
      c.fillStyle='#e6e6e6'; c.beginPath(); c.arc(X(q[0]),Y(q[1]),R(26),0,Math.PI*2); c.fill(); c.stroke();
      c.fillStyle='#fff'; c.beginPath(); c.arc(X(q[0])-R(8),Y(q[1])-R(8),R(7),0,Math.PI*2); c.fill();
    });
  } else if(f===2){
    c.fillStyle=ICON_DARK; iconRR(c,X(285),Y(62),R(150),R(55),R(14)); c.fill();
    c.fillStyle='#e6e6e6';
    iconRR(c,X(300),Y(76),R(46),R(18),R(5)); c.fill();
    iconRR(c,X(366),Y(76),R(46),R(18),R(5)); c.fill();
  } else if(f===4){
    c.fillStyle='#e6e6e6'; iconRR(c,X(ex)-R(44),Y(ey)-R(44),R(88),R(88),R(14)); c.fill(); c.stroke();
    c.fillStyle='#fff'; c.beginPath(); c.arc(X(ex)-R(16),Y(ey)-R(18),R(10),0,Math.PI*2); c.fill();
  } else {
    c.fillStyle='#e6e6e6'; c.beginPath(); c.arc(X(ex),Y(ey),R(46),0,Math.PI*2); c.fill();
    c.lineWidth=5; c.stroke(); c.lineWidth=3;
    c.fillStyle='#fff';
    c.beginPath(); c.arc(X(ex)-R(14),Y(ey)-R(20),R(12),0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(X(ex)-R(30),Y(ey)+R(4),R(8),0,Math.PI*2); c.fill();
    if(f===3){
      c.fillStyle=ICON_DARK; c.beginPath(); c.arc(X(ex)+R(10),Y(ey)+R(4),R(18),0,Math.PI*2); c.fill();
    }
  }
  // front legs over the body
  leg(L2,225,145,a2,d2,[188,200,190,155,235,155],0);
  leg(L4,445,155,a4,d4,[415,210,430,165,455,168],0.2);
}
function drawIconShape(c, iconType, idx, s, c1, c2){
  idx=Math.max(0, Math.min(ICON_N-1, idx|0));
  c1=c1||ICON_COLS[selectedIcons.c1]; c2=c2||ICON_COLS[selectedIcons.c2];
  const p=idx%6, f=Math.floor(idx/6)%5;
  c.save(); c.lineJoin='round'; c.lineCap='round';
  if(iconType==='ship') iconShip(c,s,p,f,c1,c2);
  else if(iconType==='wave') iconWave(c,s,p,f,c1,c2);
  else if(iconType==='ball') iconBall(c,s,p,f,c1,c2);
  else if(iconType==='ufo') iconUfo(c,s,p,f,c1,c2);
  else if(iconType==='robot') iconRobot(c,s,p,f,c1,c2);
  else if(iconType==='spider') iconSpider(c,s,p,f,c1,c2);
  else iconCube(c,s,p,f,c1,c2);
  c.restore();
}
function drawFullIcon(c, mode, idx, s){
  c.save();
  if(selectedIcons.glow){ c.shadowColor=ICON_COLS[selectedIcons.c2]; c.shadowBlur=s*0.3; }
  drawIconShape(c, mode, idx, s);
  if(mode==='ship'){
    c.translate(0,-s*0.18); c.scale(0.55,0.55);
    drawIconShape(c, 'cube', selectedIcons.cube, s);
  }
  c.restore();
}
function drawPlayer(){
  ctx.save();
  ctx.translate(P.x-camX+PB/2, P.y+PB/2);
  ctx.rotate(P.rot);
  ctx.scale(PB/B, gdir*PB/B);
  if(mode==='robot') robotPose={x:P.x, air:!P.onGround, vy:P.vy*gdir, boost:robotBoost>0};
  if(mode==='spider') spiderPose={x:P.x, air:!P.onGround};
  drawFullIcon(ctx, mode, selectedIcons[mode]||0, B-4);
  robotPose=null; spiderPose=null;
  ctx.restore();
}
function drawWaveTrail(){
  if(!waveTrail.length) return;
  const col=hexToArr(ICON_COLS[selectedIcons.c1]).join(','), fade=12*B;
  const hx=P.x+PB/2-camX;
  const gc=ctx.createLinearGradient(hx-fade,0,hx,0);
  gc.addColorStop(0,'rgba('+col+',0)'); gc.addColorStop(1,'rgba('+col+',0.85)');
  const gw=ctx.createLinearGradient(hx-fade,0,hx,0);
  gw.addColorStop(0,'rgba(255,255,255,0)'); gw.addColorStop(1,'rgba(255,255,255,0.9)');
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  for(let k=0;k<waveTrail.length;k++){
    const p=waveTrail[k].pts, w=waveTrail[k].w, n=p.length/2;
    if(n<2 || p[p.length-2]-camX<-B) continue;
    ctx.beginPath();
    let started=false;
    for(let i=0;i<n;i++){
      const x=p[i*2]-camX;
      if(x<hx-fade-B && i<n-1 && p[i*2+2]-camX<hx-fade-B) continue;
      if(!started){ ctx.moveTo(x,p[i*2+1]); started=true; } else ctx.lineTo(x,p[i*2+1]);
    }
    if(!started) continue;
    ctx.strokeStyle=gc; ctx.lineWidth=w*0.42; ctx.stroke();
    ctx.strokeStyle=gw; ctx.lineWidth=w*0.14; ctx.stroke();
  }
  ctx.restore();
}
function drawCheckpoints(){
  for(let i=0;i<checkpoints.length;i++){
    const cp=checkpoints[i].P, x=cp.x-camX+B/2, y=cp.y+B/2;
    if(x<-B || x>W+B) continue;
    ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
    ctx.fillStyle='rgba(90,255,110,0.85)'; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
    ctx.fillRect(-B*0.18,-B*0.18,B*0.36,B*0.36); ctx.strokeRect(-B*0.18,-B*0.18,B*0.36,B*0.36);
    ctx.restore();
  }
}
function drawTrail(tr, alpha){
  if(!tr || tr.length<4) return;
  ctx.strokeStyle='rgba(120,255,140,'+alpha+')'; ctx.lineWidth=3; ctx.lineJoin='round';
  ctx.beginPath();
  let started=false;
  for(let i=0;i<tr.length;i+=2){
    const x=tr[i]-camX;
    if(x<-B*2 || x>W+B*2){ started=false; continue; }
    if(!started){ ctx.moveTo(x,tr[i+1]); started=true; } else ctx.lineTo(x,tr[i+1]);
  }
  ctx.stroke(); ctx.lineJoin='miter';
}

function drawHitboxes(){
  const L=curL;
  ctx.save(); ctx.lineWidth=2;
  ctx.strokeStyle='rgba(60,150,255,0.95)';
  L.blocks.forEach(function(b){
    if(b._nc || isOff(b)) return;
    const cx=egx(b)+b._cx, cy=egy(b)+b._cy, x=(cx-b._hw)*B-camX;
    if(x>W || x+b._hw*2*B<0) return;
    ctx.strokeRect(x, groundY-(cy+b._hh)*B, b._hw*2*B, b._hh*2*B);
  });
  L.slopes.forEach(function(s){
    if(isOff(s)) return;
    const sw=s.w||1, sh=s.h||1, sc=s.sc||1, ccx=egx(s)+sw/2, ccy=egy(s)+sh/2, o=s.o||0;
    const x0=(ccx-sw*sc/2)*B-camX, x1=(ccx+sw*sc/2)*B-camX, bb=groundY-(ccy-sh*sc/2)*B, bt=groundY-(ccy+sh*sc/2)*B;
    if(x0>W || x1<0) return;
    ctx.beginPath();
    if(o===0||o===3){ ctx.moveTo(x0,bb); ctx.lineTo(x1,bt); } else { ctx.moveTo(x0,bt); ctx.lineTo(x1,bb); }
    ctx.stroke();
  });
  ctx.strokeStyle='rgba(255,50,50,0.95)';
  L.spikes.forEach(function(s){
    if(isOff(s)) return;
    const cx=(egx(s)+0.5)*B+s._ox-camX, cy=groundY-(egy(s)+0.5)*B+s._oy;
    if(cx<-B*3 || cx>W+B*3) return;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(Math.atan2(s._s,s._c));
    ctx.strokeRect(-s._hw,-s._hh,s._hw*2,s._hh*2); ctx.restore();
  });
  L.saws.forEach(function(s){
    if(isOff(s)) return;
    const cx=(egx(s)+0.5)*B-camX, cy=groundY-(egy(s)+0.5)*B, r=SAW_HIT[s.sz||0]*B*(s.sc||1);
    if(cx<-r || cx>W+r) return;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  });
  ctx.strokeStyle='rgba(80,255,120,0.9)';
  L.orbs.forEach(function(o){
    if(isOff(o)) return;
    const cx=(egx(o)+0.5)*B-camX, cy=groundY-(egy(o)+0.5)*B, r=Math.sqrt(1.1)*B*(o.sc||1);
    if(cx<-r || cx>W+r) return;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  });
  ctx.strokeStyle='rgba(255,225,77,0.9)';
  L.pads.forEach(function(pd){
    if(isOff(pd)) return;
    const sc=pd.sc||1, cx=(egx(pd)+0.5)*B-camX, cy=groundY-(egy(pd)+0.5)*B;
    if(cx<-B || cx>W+B) return;
    ctx.strokeRect(cx-B*0.55*sc, cy-B*0.62*sc, B*1.1*sc, B*1.24*sc);
  });
  if(!P.dead){
    const hbi=(mode==='wave')?PB*0.30:0;
    ctx.strokeStyle='rgba(255,90,90,1)';
    ctx.strokeRect(P.x-camX+hbi, P.y+hbi, PB-hbi*2, PB-hbi*2);
    const mh=6*PB/B+hbi, mv=4*PB/B+hbi;
    ctx.strokeStyle='rgba(120,0,0,1)';
    ctx.strokeRect(P.x-camX+mh, P.y+mv, PB-mh*2, PB-mv*2);
  }
  ctx.restore();
}

// ---------- frame ----------
let camYs=null;
function renderGame(){
  const edt = state==='play' && playCtx.type==='edtest';
  if(edt) setView(edZoom, edVT);
  else {
    setView(OPT.cam, 0);
    const vg=groundY-H*0.8, vf=(groundY-4.5*B)-H*0.5;
    if(camYs===null || state!=='play') camYs=vg;
    else if(!P.dead){
      const py=P.y+PB/2;
      let tgt=camYs;
      if(py < camYs+H*0.3) tgt=py-H*0.3;
      else if(py > camYs+H*0.68) tgt=py-H*0.68;
      tgt=Math.min(vg, tgt);
      camYs+=(tgt-camYs)*0.12;
    }
    VT=camYs+(vf-camYs)*shipAnim;
  }
  applyView();
  if(shake>0.5){
    ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);
    shake*=0.86;
  } else shake=0;
  pulse*=0.93;
  if(AC){
    while(kickTimes.length && kickTimes[0] <= AC.currentTime){
      pulse=1; kickTimes.shift();
    }
  }
  drawBackground(curL);
  drawGround(curL);

  if(shipAnim>0.02){
    const cy=ceilingY();
    ctx.globalAlpha=shipAnim;
    ctx.fillStyle=rgbA(chCur[CH_G]||[30,60,150],1+pulse*0.2,1);
    ctx.fillRect(0,VT,W,Math.max(0,cy-VT));
    drawFloorLine(cy+1);
    ctx.globalAlpha=1;
  }
  if(gdir<0){
    ctx.fillStyle='rgba('+chStr(CH_LINE)+',0.9)';
    ctx.fillRect(0,ceilingY()-2,W,3);
  }

  const ex=curL.endX*B-camX;
  if(ex>-60 && ex<W+60){
    ctx.save();
    ctx.shadowColor='#fff'; ctx.shadowBlur=18;
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillRect(ex,VT,5,groundY-VT);
    ctx.restore();
  }

  drawLevelObjects(curL, true);
  if(state==='play' && practice) drawCheckpoints();

  if(state==='play' && !edt){
    const ax=3*B-camX;
    if(ax>-600 && ax<W){
      ctx.font='900 '+Math.round(B*0.62)+'px "Arial Black",Arial';
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.lineWidth=5; ctx.strokeStyle='rgba(0,0,0,0.6)';
      ctx.strokeText('Attempt '+attempts, ax, groundY-3.2*B);
      ctx.fillStyle='#fff';
      ctx.fillText('Attempt '+attempts, ax, groundY-3.2*B);
    }
  }
  if(edt) drawTrail(edTrail, 0.5);

  drawWaveTrail();
  if(!P.dead) drawPlayer();
  if(OPT.hit && state==='play') drawHitboxes();

  if(P.dead){
    const r=deadT*B*0.14, a=Math.max(0,1-deadT/28);
    ctx.strokeStyle='rgba(255,255,255,'+a+')'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.arc(deathX-camX,deathY,r,0,Math.PI*2); ctx.stroke();
  }
  for(let i=0;i<particles.length;i++){
    const p=particles[i], a=p.life/p.max;
    ctx.fillStyle='rgba('+p.col+','+a+')';
    ctx.fillRect(p.x-camX-p.size/2, p.y-p.size/2, p.size, p.size);
  }
  if((curL.bg|0)!==9) drawDust();

  hudView();
  if(state==='play' && !edt){
    const pw=Math.min(SW*0.5,420), px0=(SW-pw)/2;
    const pct=Math.max(0,Math.min(100, P.x/(curL.endX*B)*100));
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(px0,12,pw,10);
    ctx.fillStyle=practice?'#5aff6e':'#6cff5c'; ctx.fillRect(px0+1,13,(pw-2)*pct/100,8);
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1.5;
    ctx.strokeRect(px0,12,pw,10);
    ctx.font='bold 13px Arial'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff';
    ctx.fillText((OPT.dec?pct.toFixed(2):Math.floor(pct))+'%', px0+pw+10, 17);
    ctx.font='bold 12px Arial';
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText(curL.name + (playCtx.type==='test'?' (TEST)':''), px0, 34);
    const tags=[];
    if(practice) tags.push(['PRACTICE','#5aff6e']);
    if(macro.rec) tags.push(['● REC','#ff5555']);
    if(macro.play) tags.push(['▶ BOT','#7fd0ff']);
    if(speedHack!==1) tags.push([speedHack+'x SPEED','#ffd84a']);
    ctx.font='900 13px Arial';
    let tx=14;
    tags.forEach(function(t){
      const w=ctx.measureText(t[0]).width+14;
      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(tx,SH-34,w,22);
      ctx.fillStyle=t[1]; ctx.fillText(t[0], tx+7, SH-23);
      tx+=w+6;
    });
  }
}
