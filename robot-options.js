(() => {
  const W = 500, H = 600;
  const card = { x: 120, y: 126, width: 260, height: 350 };
  const images = {};
  const sources = {
    photo: 'assets/maze-robot.jpg',
    motor: 'assets/demo-servo.png',
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
  function support(ctx, x) {
    ctx.save();ctx.translate(x,card.y+card.height/2);
    const metal=ctx.createLinearGradient(0,-21,36,21);
    metal.addColorStop(0,'#6b737b');metal.addColorStop(.3,'#e4e7e9');metal.addColorStop(.6,'#aab4bd');metal.addColorStop(1,'#4d565d');
    ctx.shadowColor='#0003';ctx.shadowBlur=4;ctx.shadowOffsetY=3;
    ctx.fillStyle=metal;ctx.beginPath();ctx.roundRect(0,-21,36,42,3);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#737a80';ctx.stroke();
    ctx.fillStyle='#69747e';ctx.beginPath();ctx.ellipse(18,0,11,15,0,0,2*Math.PI);ctx.fill();
    ctx.strokeStyle='#d7dde1';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#414b53';ctx.beginPath();ctx.ellipse(18,0,5,8,0,0,2*Math.PI);ctx.fill();
    for(const [x,y] of [[5,-16],[31,16]]){ctx.fillStyle='#e1e4e7';ctx.beginPath();ctx.arc(x,y,2,0,2*Math.PI);ctx.fill();ctx.fillStyle='#394148';ctx.fillRect(x-1,y-.5,2,1);}
    const shaft=ctx.createLinearGradient(0,-5,0,5);shaft.addColorStop(0,'#555');shaft.addColorStop(.35,'#eee');shaft.addColorStop(.65,'#a2a6ab');shaft.addColorStop(1,'#454b52');
    ctx.fillStyle=shaft;ctx.fillRect(-20,-5,20,10);ctx.fillStyle='#41464a';ctx.fillRect(-24,-10,8,20);
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
      motor(ctx,mix(-12,100,attachment),false);support(ctx,mix(512,400,attachment));
    }
  }

  function animate(scene) {
    if(scene.busy) return;
    scene.busy=true;
    const start=performance.now(),oldBack=scene.back;
    const play=document.querySelector('[data-play="motors"]');
    play.disabled=true;
    function frame(now) {
      const time=now-start;
      const attachment=time<650?ease(clamp(time/650)):1-ease(clamp((time-2650)/550));
      const angle=(oldBack?Math.PI:0)+(oldBack?-1:1)*Math.PI*ease(clamp((time-650)/1950));
      drawMotorScene(scene,angle,attachment);
      if(time<3200) scene.frame=requestAnimationFrame(frame);
      else {scene.busy=false;scene.back=!oldBack;play.disabled=false;}
    }
    scene.frame=requestAnimationFrame(frame);
  }
  Promise.all(Object.entries(sources).map(([key,url])=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{images[key]=image;resolve();};image.onerror=reject;image.src=url;
  }))).then(()=>{
    const stage=document.querySelector('[data-demo="motors"]');
    const scene={ctx:stage.querySelector('canvas').getContext('2d'),frontTexture:texture(false),backTexture:texture(true),busy:false,back:false};
    const play=document.querySelector('[data-play="motors"]');
    drawMotorScene(scene);
    stage.addEventListener('click',()=>animate(scene));
    play.addEventListener('click',()=>animate(scene));
    document.querySelector('[data-reset="motors"]').addEventListener('click',()=>{
      cancelAnimationFrame(scene.frame);scene.busy=false;scene.back=false;play.disabled=false;
      drawMotorScene(scene);
    });
  });
})();
