import { Helios, spring, interpolate } from '@helios-project/core';

// ── Config ────────────────────────────────────────────────────────────────────
const W = 1920, H = 1080, FPS = 30, DUR = 15;
const canvas = document.getElementById('canvas');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');

// ── Helios ────────────────────────────────────────────────────────────────────
const helios = new Helios({
  duration: DUR, fps: FPS, width: W, height: H,
  inputProps: {
    brand:   'Anvelope',
    city:    'Ungheni',
    phone:   '068 263 644',
    address: 'Strada Decebal 62/1, Ungheni',
    hours:   'Luni–Sâmbătă  8:00 – 20:00',
    email:   'info@anvelope-ungheni.md',
  },
});
helios.bindToDocumentTimeline();
window.helios = helios;

// ── Helpers ───────────────────────────────────────────────────────────────────
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
function interp(v, input, output, ease) {
  let t = clamp((v-input[0])/(input[1]-input[0]),0,1);
  if (ease==='eio') t = t<.5?2*t*t:-1+(4-2*t)*t;
  if (ease==='eo')  t = t*t*(3-2*t);
  return output[0]+t*(output[1]-output[0]);
}
function springV(frame,from,to,stiff=55,damp=11){
  let p=from,v=0,dt=1/FPS;
  for(let i=0;i<Math.max(0,frame);i++){v+=((-stiff*(p-to)-damp*v))*dt;p+=v*dt;}
  return p;
}

// ── Grain ─────────────────────────────────────────────────────────────────────
const grainC=document.createElement('canvas'); grainC.width=grainC.height=256;
const gCtx=grainC.getContext('2d');
function refreshGrain(){
  const id=gCtx.createImageData(256,256);
  for(let i=0;i<id.data.length;i+=4){const v=(Math.random()*80)|0;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=18;}
  gCtx.putImageData(id,0,0);
}
refreshGrain();

// ── Particles ─────────────────────────────────────────────────────────────────
const SMOKE=Array.from({length:60},()=>({
  x:Math.random()*W,y:H*0.6+Math.random()*H*0.5,vx:(Math.random()-.5)*0.3,
  vy:-(0.15+Math.random()*0.3),r:40+Math.random()*120,
  alpha:0.02+Math.random()*0.05,phase:Math.random()*Math.PI*2
}));
const DUST=Array.from({length:80},(_,i)=>{
  const s=(i*2654435761)>>>0,rn=n=>((s^(s>>n))%1000)/1000;
  return{x:rn(3)*W,y:rn(7)*H,r:1+rn(11)*2,speed:0.2+rn(13)*0.5,
    hue:rn(17)*30+10,alpha:0.1+rn(19)*0.3,drift:(rn(23)-.5)*0.25};
});

function drawParticles(frame){
  const t=frame/FPS;
  SMOKE.forEach(p=>{
    const x=p.x+Math.sin(t*0.3+p.phase)*30+p.vx*frame;
    const y=((p.y+p.vy*frame)%(H+200)+H+200)%(H+200)-100;
    const g=ctx.createRadialGradient(x,y,0,x,y,p.r);
    g.addColorStop(0,`rgba(30,20,20,${p.alpha})`);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();
  });
  DUST.forEach(p=>{
    const y=((p.y-p.speed*frame)%H+H)%H,x=p.x+p.drift*frame;
    const g=ctx.createRadialGradient(x,y,0,x,y,p.r*3);
    g.addColorStop(0,`hsla(${p.hue},30%,90%,${p.alpha})`);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(x,y,p.r*3,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  });
}

// ── Tire ring ─────────────────────────────────────────────────────────────────
function drawTireRing(cx,cy,scale,rotation,opacity){
  ctx.save();ctx.globalAlpha=opacity;ctx.translate(cx,cy);ctx.rotate(rotation);ctx.scale(scale,scale);
  const R=130,LW=26,gap=Math.PI*0.27;
  ctx.beginPath();ctx.arc(0,0,R,gap,-gap,false);
  ctx.strokeStyle='#d8d8d8';ctx.lineWidth=LW;ctx.lineCap='round';
  ctx.shadowColor='rgba(255,255,255,0.4)';ctx.shadowBlur=18;ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,R+LW*0.28,gap+0.15,-gap-0.15,false);
  ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=5;ctx.shadowBlur=12;ctx.stroke();
  ctx.shadowBlur=0;
  for(let i=0;i<5;i++){
    const r=R-LW*0.5-2-i*9;if(r<30)continue;
    ctx.beginPath();ctx.arc(0,0,r,gap+0.12,-gap-0.12,false);
    ctx.strokeStyle=`rgba(255,255,255,${0.18-i*0.025})`;ctx.lineWidth=1.8;ctx.stroke();
  }
  ctx.beginPath();ctx.arc(0,0,R-LW*0.5-56,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fill();
  const lColors=['rgba(255,255,255,0.55)','rgba(255,255,255,0.35)','rgba(255,255,255,0.2)','rgba(255,255,255,0.12)','rgba(255,255,255,0.07)'];
  const lLens=[170,210,180,140,90],lY=[-8,2,12,22,32];
  for(let i=0;i<5;i++){
    const sx=R*Math.cos(-gap)+10,sy=lY[i]+R*Math.sin(-gap)*(i>2?0.3:0.1);
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+lLens[i],sy+i*3);
    ctx.strokeStyle=lColors[i];ctx.lineWidth=2-i*0.25;ctx.lineCap='round';ctx.stroke();
  }
  ctx.restore();
}

// ── Text with chromatic aberration ────────────────────────────────────────────
function drawTextCA(text,x,y,font,color,caAmt,align='left'){
  ctx.save();ctx.font=font;ctx.textBaseline='middle';ctx.textAlign=align;
  if(caAmt>0){
    ctx.fillStyle=`rgba(255,0,0,0.45)`;ctx.fillText(text,x-caAmt,y-caAmt*0.3);
    ctx.fillStyle=`rgba(0,80,255,0.35)`;ctx.fillText(text,x+caAmt,y+caAmt*0.3);
  }
  ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
}

// ── Sweeps ────────────────────────────────────────────────────────────────────
function drawSweep(cx,cy,progress,alpha){
  ctx.save();
  const x=cx-450+progress*1350,sw=180;
  const g=ctx.createLinearGradient(x-sw,cy-180,x+sw,cy+180);
  g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(0.5,`rgba(255,80,50,${alpha})`);g.addColorStop(1,'rgba(255,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(x-sw,cy-200,sw*2,400);ctx.restore();
}
function drawInfoSweep(progress,infoY,alpha){
  ctx.save();
  const x=-300+progress*(W+600),sw=120;
  const g=ctx.createLinearGradient(x-sw,0,x+sw,0);
  g.addColorStop(0,'rgba(255,220,180,0)');g.addColorStop(0.5,`rgba(255,220,180,${alpha})`);g.addColorStop(1,'rgba(255,220,180,0)');
  ctx.fillStyle=g;ctx.fillRect(x-sw,infoY-10,sw*2,280);ctx.restore();
}

// ── Company info ──────────────────────────────────────────────────────────────
function drawInfo(cx,y,opacity,props){
  if(opacity<=0)return;
  ctx.save();ctx.globalAlpha=opacity;ctx.textAlign='center';
  const lw=420,lg=ctx.createLinearGradient(cx-lw/2,y,cx+lw/2,y);
  lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(0.5,'rgba(255,255,255,0.35)');lg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.strokeStyle=lg;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-lw/2,y);ctx.lineTo(cx+lw/2,y);ctx.stroke();
  y+=30;
  const rows=[
    {text:`📞  ${props.phone}`,size:34,color:'#ffffff',weight:'bold'},
    {text:`📍  ${props.address}`,size:26,color:'#cccccc',weight:'normal'},
    {text:`🕗  ${props.hours}`,size:26,color:'#cccccc',weight:'normal'},
    {text:`✉  ${props.email}`,size:24,color:'#aaaaaa',weight:'normal'},
  ];
  rows.forEach((r,i)=>{
    ctx.font=`${r.weight} ${r.size}px system-ui,sans-serif`;
    ctx.fillStyle=r.color;ctx.shadowColor='rgba(200,50,30,0.25)';ctx.shadowBlur=10;
    ctx.fillText(r.text,cx,y+i*52);
  });
  ctx.restore();
}

// ── Post FX ───────────────────────────────────────────────────────────────────
function applyVignette(s=0.65){
  ctx.save();
  const g=ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.85);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${s})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();
}
function applyGlow(intensity){
  if(intensity<=0)return;
  ctx.save();ctx.globalAlpha=intensity*0.18;ctx.filter='blur(8px)';
  ctx.drawImage(canvas,0,0);ctx.filter='none';ctx.restore();
}
function applyGrain(){
  if(Math.random()<0.5)refreshGrain();
  ctx.save();ctx.globalCompositeOperation='overlay';
  const p=ctx.createPattern(grainC,'repeat');ctx.fillStyle=p;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over';ctx.restore();
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(frame, props) {
  const t=frame/FPS, pulse=0.5+0.5*Math.sin(t*1.1);
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);

  const masterAlpha=interp(frame,[0,15],[0,1],'eio');
  ctx.save();ctx.globalAlpha=masterAlpha;
  // Volumetric light cone
  const a=0.04+pulse*0.03;
  const cone=ctx.createLinearGradient(W/2,0,W/2,H*0.7);
  cone.addColorStop(0,`rgba(255,250,240,${a*2})`);cone.addColorStop(0.5,`rgba(200,180,150,${a})`);cone.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2-W*0.22,H*0.7);ctx.lineTo(W/2+W*0.22,H*0.7);ctx.closePath();ctx.fill();
  drawParticles(frame);
  ctx.restore();

  if(masterAlpha<0.01){applyGrain();return;}

  // Camera dolly
  const dolly=interp(frame,[180,240],[1.0,1.06],'eio');
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(dolly,dolly);ctx.translate(-W/2,-H/2);
  ctx.globalAlpha=masterAlpha;

  const logoY=H*0.44;
  const ringTargetX=W/2+55;

  // Ring entry
  const ringX=interp(frame,[0,90],[W+300,ringTargetX],'eio');
  const ringRot=frame<90?interp(frame,[0,90],[-Math.PI*0.5,0],'eio'):Math.sin(t*0.7)*0.018;
  const ringOp=interp(frame,[0,45],[0,1],'eio');

  // Floor reflection
  ctx.save();ctx.globalAlpha=0.04*masterAlpha;
  const flG=ctx.createLinearGradient(0,logoY+220,0,H);
  flG.addColorStop(0,'rgba(255,255,255,0.1)');flG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=flG;ctx.fillRect(0,logoY+220,W,H-logoY-220);ctx.restore();

  drawTireRing(ringX,logoY,1.0,ringRot,ringOp);

  // Red accent glow
  if(ringOp>0){
    ctx.save();ctx.globalAlpha=ringOp*0.35*masterAlpha;
    const rg=ctx.createRadialGradient(ringX,logoY+180,0,ringX,logoY+180,240);
    rg.addColorStop(0,'rgba(180,10,10,0.4)');rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg;ctx.fillRect(ringX-240,logoY+60,480,240);ctx.restore();
  }

  // Logo text
  const textOp=interp(frame,[90,150],[0,1],'eio');
  const anvelopeX=interp(frame,[90,150],[ringTargetX-700,ringTargetX-218],'eio');
  const ungheniX=interp(frame,[105,165],[ringTargetX+700,ringTargetX+208],'eio');
  if(textOp>0){
    ctx.save();ctx.globalAlpha=textOp*masterAlpha;
    const caAmt=interp(frame,[90,120],[4,0.5]);
    const font='bold 112px Georgia,serif';
    ctx.textBaseline='middle';
    ctx.shadowColor='rgba(255,255,255,0.3)';ctx.shadowBlur=15;
    drawTextCA(props.brand,anvelopeX,logoY,font,'#ffffff',caAmt,'right');
    ctx.shadowColor='rgba(200,0,0,0.5)';ctx.shadowBlur=20;
    drawTextCA(props.city,ungheniX,logoY,font,'#cc1010',caAmt,'left');
    ctx.restore();
  }

  // Light sweep (6-7.7s)
  if(frame>=180&&frame<=230){
    const sp=interp(frame,[180,230],[0,1]);
    const sa=interp(frame,[180,192],[0,0.8])*interp(frame,[215,230],[1,0]);
    drawSweep(W/2,logoY,sp,sa);
  }

  // Company info
  const infoY=logoY+240;
  const infoOp=interp(frame,[240,300],[0,1],'eo')*masterAlpha;
  drawInfo(W/2,infoY,infoOp,props);

  // Info sweep (12-14.3s)
  if(frame>=360&&frame<=430){
    const gp=interp(frame,[360,430],[0,1]);
    const ga=interp(frame,[360,375],[0,0.5])*interp(frame,[415,430],[1,0]);
    drawInfoSweep(gp,infoY,ga*infoOp);
  }

  ctx.restore(); // end dolly

  applyVignette(0.6+pulse*0.05);
  applyGlow(masterAlpha*0.6);
  applyGrain();
}

helios.subscribe(state => render(state.currentFrame, state.inputProps));
render(0, helios.getState().inputProps);
