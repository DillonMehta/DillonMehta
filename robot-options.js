(() => {
  const W = 500, H = 600;
  const card = { x: 120, y: 126, width: 260, height: 350 };
  const images = {};
  const sources = {
    photo: 'assets/maze-robot.jpg',
    motor: 'assets/demo-servo.png',
    arm: 'assets/industrial-arm-grip.png',
    pail: 'assets/demo-paint-pail.png',
  };
  const ease = t => t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  const clamp = t => Math.max(0, Math.min(1, t));
  const mix = (a,b,t) => a+(b-a)*t;
  const scenes = new Map();

  function texture(back) {
    const c = document.createElement('canvas');
    c.width = 520; c.height = 700;
    const ctx = c.getContext('2d'); ctx.scale(2,2);
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,260,350);
    ctx.fillStyle = '#111'; ctx.textBaseline = 'top';
    if (back) {
      ctx.font = 'bold 23px "Times New Roman"'; ctx.fillText('Maze robot',19,20);
      ctx.font = '18px "Times New Roman"';
      let y=65;
      y=drawWrappedText(ctx,'I designed the PCB, soldered the electronics, and wrote C++ motion control.',19,y,222,25)+18;
      y=drawWrappedText(ctx,'Encoder and IMU feedback correct the robot’s path during timed navigation.',19,y,222,25)+18;
      drawWrappedText(ctx,'I learned to tune mechanics, sensing, and code as one system.',19,y,222,25);
    } else {
      drawFittedImage(ctx,images.photo,0,0,260,304,'cover');
      ctx.font='bold 21px "Times New Roman"'; ctx.fillText('Maze robot',0,319);
    }
    return c;
  }

  function resetCanvas(ctx) { ctx.setTransform(2,0,0,2,0,0); ctx.clearRect(0,0,W,H); }
  function shadow(ctx, strength=1) {
    ctx.save(); ctx.translate(250,493); ctx.scale(1,.09);
    const g=ctx.createRadialGradient(0,0,0,0,0,165);
    g.addColorStop(0,`rgba(0,0,0,${.17*strength})`);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(-180,-180,360,360);ctx.restore();
  }
  function project(x,y,angle,z=0) {
    const dy=y-card.height/2;
    const depth=dy*Math.sin(angle)+z*Math.cos(angle);
    const factor=950/(950-depth);
    return {x:250+(x-card.width/2)*factor,y:card.y+card.height/2+(dy*Math.cos(angle)-z*Math.sin(angle))*factor};
  }
  function motor(ctx, x, mirror) {
    ctx.save();ctx.translate(x,card.y+card.height/2);if(mirror)ctx.scale(-1,1);
    ctx.shadowColor='#0002';ctx.shadowBlur=4;ctx.shadowOffsetY=4;
    ctx.drawImage(images.motor,-106,-39,112,75);ctx.shadowBlur=0;
    const metal=ctx.createLinearGradient(0,-6,0,6);metal.addColorStop(0,'#555');metal.addColorStop(.35,'#eee');metal.addColorStop(.65,'#a2a6ab');metal.addColorStop(1,'#454b52');
    ctx.fillStyle=metal;ctx.fillRect(0,-5,20,10);ctx.fillStyle='#41464a';ctx.fillRect(16,-10,8,20);
    ctx.restore();
  }
  function drawMotorScene(scene, angle=scene.back?Math.PI:0, attachment=0) {
    const {ctx}=scene;resetCanvas(ctx);shadow(ctx,.7+.3*Math.abs(Math.cos(angle)));
    const corners=[project(0,0,angle),project(260,0,angle),project(260,350,angle),project(0,350,angle)];
    const back=Math.cos(angle)<0;
    const source=back?[{x:0,y:350},{x:260,y:350},{x:260,y:0},{x:0,y:0}]:[{x:0,y:0},{x:260,y:0},{x:260,y:350},{x:0,y:350}];
    const t=back?scene.backTexture:scene.frontTexture;
    const far=corners.map((_,i)=>project(i===0||i===3?0:260,i<2?0:350,angle,-3));
    ctx.fillStyle='#b7b5b0';ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y);for(const p of corners.slice(1))ctx.lineTo(p.x,p.y);for(const p of [...far].reverse())ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fill();
    textureTriangle(ctx,t,[source[0],source[1],source[2]],[corners[0],corners[1],corners[2]],260,350);
    textureTriangle(ctx,t,[source[0],source[2],source[3]],[corners[0],corners[2],corners[3]],260,350);
    ctx.save();ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y);for(const p of corners.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.clip();
    ctx.fillStyle=`rgba(0,0,0,${.18*(1-Math.abs(Math.cos(angle)))})`;ctx.fillRect(40,0,420,600);ctx.restore();
    if(attachment>0) {
      motor(ctx,mix(-12,100,attachment),false);motor(ctx,mix(512,400,attachment),true);
    }
  }

  const clips={
    base:[[.65,.35],[.84,.35],[1,.54],[1,1],[.38,1],[.38,.61],[.56,.47],[.65,.44]],
    upper:[[.53,.015],[.68,.015],[.82,.34],[.81,.51],[.69,.50],[.60,.32],[.46,.20],[.46,.08]],
    forearm:[[.29,.22],[.38,.20],[.51,.10],[.53,.02],[.66,.03],[.67,.17],[.56,.27],[.41,.38],[.30,.39]],
    hand:[[.025,.25],[.24,.20],[.32,.21],[.39,.23],[.41,.37],[.32,.41],[.26,.42],[.03,.41]],
  };
  function part(ctx,name) {
    ctx.save();ctx.beginPath();clips[name].forEach((p,i)=>{if(i)ctx.lineTo(p[0]*1536,p[1]*1024);else ctx.moveTo(p[0]*1536,p[1]*1024);});ctx.closePath();ctx.clip();ctx.drawImage(images.arm,0,0,1536,1024);ctx.restore();
  }
  function pivot(ctx,x,y,angle) {ctx.translate(x,y);ctx.rotate(angle);ctx.translate(-x,-y);}
  function arm(ctx, base, tip, mirror=false, orientation=Math.PI/2) {
    const scale=.38;
    const tx=1150+(tip.x-base.x)/scale*(mirror?-1:1),ty=440+(tip.y-base.y)/scale;
    const direction=mirror?Math.PI-orientation:orientation;
    const offsetLength=Math.hypot(450,30);
    const wx=tx-offsetLength*Math.cos(direction),wy=ty-offsetLength*Math.sin(direction);
    const dx=wx-1150,dy=wy-440,L1=Math.hypot(250,300),L2=Math.hypot(340,180);
    const bend=-Math.acos(Math.max(-.999,Math.min(.999,(dx*dx+dy*dy-L1*L1-L2*L2)/(2*L1*L2))));
    const upper=Math.atan2(dy,dx)-Math.atan2(L2*Math.sin(bend),L1+L2*Math.cos(bend));
    const restUpper=Math.atan2(-300,-250),restForearm=Math.atan2(180,-340);
    const shoulder=upper-restUpper;
    const elbow=bend-(restForearm-restUpper);
    const wrist=direction-Math.atan2(30,-450)-shoulder-elbow;
    ctx.save();ctx.translate(base.x,base.y);ctx.scale(mirror?-scale:scale,scale);ctx.translate(-1150,-440);
    part(ctx,'base');pivot(ctx,1150,440,shoulder);part(ctx,'upper');pivot(ctx,900,140,elbow);part(ctx,'forearm');pivot(ctx,560,320,wrist);part(ctx,'hand');ctx.restore();
  }

  const letters={
    A:['05 20 45','13 33'],B:['05 00 30 41 32 02','02 32 43 34 05'],C:['40 10 01 04 15 45'],D:['05 00 20 41 44 25 05'],E:['40 00 05 45','02 32'],F:['40 00 05','02 32'],G:['40 10 01 04 15 45 43 23'],H:['00 05','40 45','02 42'],I:['00 40','20 25','05 45'],J:['00 40 44 35 15 04'],K:['00 05','40 02 45'],L:['00 05 45'],M:['05 00 22 40 45'],N:['05 00 45 40'],O:['10 30 41 44 35 15 04 01 10'],P:['05 00 30 41 32 02'],Q:['10 30 41 44 35 15 04 01 10','23 45'],R:['05 00 30 41 32 02','22 45'],S:['40 10 01 12 32 43 34 05'],T:['00 40','20 25'],U:['00 04 15 35 44 40'],V:['00 25 40'],W:['00 15 22 35 40'],X:['00 45','40 05'],Y:['00 22 40','22 25'],Z:['00 40 05 45'],',':['24 15'],'.':['25 25.05'],'+':['02 42','20 25'],"'":['20 21'],
  };
  function strokes() {
    const lines=['I DESIGNED THE PCB,','SOLDERED THE ELECTRONICS','AND WROTE C++ CONTROL.','','ENCODERS AND AN IMU','CORRECT THE ROBOT\'S PATH.','','I LEARNED TO TUNE','MECHANICS AND CODE','AS ONE SYSTEM.'];
    const segments=[];let previous={x:145,y:190};
    for(const [row,line] of lines.entries()) for(const [col,ch] of [...line].entries()) {
      for(const stroke of letters[ch]??[]) {
        const points=stroke.split(' ').map(p=>({x:140+col*10+Number(p[0])*1.8,y:180+row*25+Number(p.slice(1))*2.8}));
        const first=points[0];segments.push({a:previous,b:first,ink:false,length:Math.hypot(first.x-previous.x,first.y-previous.y)});
        for(let i=1;i<points.length;i++)segments.push({a:points[i-1],b:points[i],ink:true,length:Math.max(.4,Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y))});
        previous=points.at(-1);
      }
    }
    return {segments,total:segments.reduce((sum,s)=>sum+s.length,0)};
  }
  const writing=strokes();
  function ink(ctx,progress) {
    let remaining=writing.total*progress,tip=writing.segments[0].a,lift=0;
    ctx.strokeStyle='#141719';ctx.lineWidth=1.1;ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of writing.segments) {
      const p=clamp(remaining/s.length);tip={x:mix(s.a.x,s.b.x,p),y:mix(s.a.y,s.b.y,p)};
      if(s.ink){ctx.beginPath();ctx.moveTo(s.a.x,s.a.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();}
      else lift=Math.sin(p*Math.PI)*7;
      remaining-=s.length;if(remaining<=0)break;
    }
    return {tip,lift};
  }
  function pail(ctx,handle,tilt) {
    ctx.save();ctx.translate(handle.x,handle.y);ctx.rotate(tilt);
    ctx.drawImage(images.pail,-32,-1,64,66);ctx.restore();
    return {x:handle.x+Math.cos(tilt)*29-Math.sin(tilt)*20,y:handle.y+Math.sin(tilt)*29+Math.cos(tilt)*20};
  }
  function liquid(ctx,p,now,lip) {
    ctx.save();ctx.beginPath();ctx.rect(card.x,card.y,card.width,card.height);ctx.clip();
    const front=card.y+(card.height+45)*p;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(card.x,card.y);ctx.lineTo(card.x+260,card.y);
    for(let x=260;x>=0;x-=2) {
      const wave=(Math.sin(x*.067+now*.006)*6+Math.sin(x*.123-now*.003)*3)*(1-p);
      const y=front-Math.abs(x-130)*.19*(1-p)+wave;
      ctx.lineTo(card.x+x,y);
    }
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(185,189,192,.35)';ctx.lineWidth=1.2;ctx.beginPath();
    for(let x=0;x<=260;x+=2){const y=front-Math.abs(x-130)*.19*(1-p)+(Math.sin(x*.067+now*.006)*6+Math.sin(x*.123-now*.003)*3)*(1-p);if(x===0)ctx.moveTo(card.x+x,y);else ctx.lineTo(card.x+x,y);}ctx.stroke();
    ctx.restore();
    if(p>.015&&p<.98) {
      const target={x:250+Math.sin(now*.002)*12,y:card.y+22};
      ctx.lineWidth=14;ctx.lineCap='round';ctx.strokeStyle='#cfd1d3';ctx.beginPath();ctx.moveTo(lip.x,lip.y);ctx.bezierCurveTo(lip.x+2,lip.y+35,target.x,target.y-30,target.x,target.y);ctx.stroke();
      ctx.lineWidth=11;ctx.strokeStyle='#fff';ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(target.x,target.y,28+Math.sin(now*.012)*3,9,0,0,Math.PI*2);ctx.fill();
    }
  }
  function drawPaintScene(scene,time=null) {
    const {ctx}=scene;resetCanvas(ctx);shadow(ctx);ctx.drawImage(scene.frontTexture,card.x,card.y,260,350);
    if(time===null) return;
    const enter=ease(clamp(time/850));
    const poured=clamp((time-1000)/2100);
    const written=clamp((time-3850)/10500);
    const painterExit=ease(clamp((time-3350)/800));
    const writerEnter=ease(clamp((time-3300)/550));
    const writerExit=ease(clamp((time-14400)/750));
    const bucketHandle={x:mix(540,243,enter)+180*painterExit,y:mix(390,61,enter)+220*painterExit};
    const tilt=-.85*Math.sin(clamp((time-850)/2600)*Math.PI);
    if(poured>0)liquid(ctx,poured,time,{x:bucketHandle.x+Math.cos(tilt)*29-Math.sin(tilt)*20,y:bucketHandle.y+Math.sin(tilt)*29+Math.cos(tilt)*20});
    if(poured===1) {
      ctx.fillStyle='#fff';ctx.fillRect(card.x,card.y,260,350);ctx.fillStyle='#111';ctx.font='bold 22px "Times New Roman"';ctx.fillText('Maze robot',140,155);
    }
    const {tip,lift}=ink(ctx,written);
    if(time<4200) {
      arm(ctx,{x:530-enter*30+180*painterExit,y:330},bucketHandle,false,Math.PI);
      pail(ctx,bucketHandle,tilt);
    }
    if(time>3300&&time<15150) {
      const nib={x:mix(-50,tip.x,writerEnter)-160*writerExit,y:mix(510,tip.y-lift,writerEnter)+150*writerExit};
      const grasp={x:nib.x+3,y:nib.y-25};
      arm(ctx,{x:mix(-135,12,writerEnter)-190*writerExit,y:440},grasp,true,0);
      ctx.save();ctx.translate(nib.x,nib.y);ctx.rotate(.1);ctx.fillStyle='#17191c';ctx.fillRect(-2,-33,4,27);
      const g=ctx.createLinearGradient(-2,0,2,0);g.addColorStop(0,'#777');g.addColorStop(.5,'#ddd');g.addColorStop(1,'#555');ctx.fillStyle=g;ctx.fillRect(-2,-31,4,12);ctx.fillStyle='#32363b';ctx.beginPath();ctx.moveTo(-2,-6);ctx.lineTo(2,-6);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.restore();
    }
  }

  function animate(scene,paint) {
    if(scene.busy) return;scene.busy=true;
    const start=performance.now(),oldBack=scene.back;
    document.querySelector(`[data-play="${scene.name}"]`).disabled=true;
    const duration=paint?15300:3200;
    function frame(now) {
      const time=now-start;
      if(paint)drawPaintScene(scene,time);
      else {
        const attachment=time<650?ease(clamp(time/650)):1-ease(clamp((time-2650)/550));
        const angle=(oldBack?Math.PI:0)+(oldBack?-1:1)*Math.PI*ease(clamp((time-650)/1950));
        drawMotorScene(scene,angle,attachment);
      }
      if(time<duration)scene.frame=requestAnimationFrame(frame);
      else{scene.busy=false;scene.back=!oldBack;document.querySelector(`[data-play="${scene.name}"]`).disabled=false;}
    }
    scene.frame=requestAnimationFrame(frame);
  }
  function reset(scene) {
    cancelAnimationFrame(scene.frame);scene.busy=false;scene.back=false;
    document.querySelector(`[data-play="${scene.name}"]`).disabled=false;
    if(scene.name==='motors')drawMotorScene(scene);else drawPaintScene(scene);
  }
  Promise.all(Object.entries(sources).map(([key,url])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[key]=image;resolve();};image.onerror=reject;image.src=url;}))).then(()=>{
    for(const button of document.querySelectorAll('[data-demo]')) {
      const scene={name:button.dataset.demo,ctx:button.querySelector('canvas').getContext('2d'),frontTexture:texture(false),backTexture:texture(true),busy:false,back:false};
      scenes.set(scene.name,scene);reset(scene);button.addEventListener('click',()=>animate(scene,scene.name==='paint'));
    }
    for(const button of document.querySelectorAll('[data-play]'))button.addEventListener('click',()=>animate(scenes.get(button.dataset.play),button.dataset.play==='paint'));
    for(const button of document.querySelectorAll('[data-reset]'))button.addEventListener('click',()=>reset(scenes.get(button.dataset.reset)));
  });
})();
