/* =====================================================================
   Matix Arcade (1.0.8) — replaces the old Games hub with real built-in
   math games that use drawn art from assets/games/img:
     🚀 Asteroid Answers   🎈 Balloon Pop     🍎 Fruit Market Sums
     🍕 Pizza Fractions    🦉 Owl Runner      🃏 Memory Match
   Every game reads the grade picker (Grade 1 → College), so the maths
   grows with you. Best scores are kept on this device.
   ===================================================================== */
(function(){
'use strict';
var D=document,W=window;
function $(id){return D.getElementById(id);}
function T(s){try{return typeof W.tr==='function'?W.tr(s):s;}catch(e){return s;}}
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}
function rnd(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function clamp(x,a,b){return x<a?a:(x>b?b:x);}
var IMG_DIR='/arcade/img/';

/* ---------- images ---------- */
var IMG={},IMG_LIST=['bg_space.jpg','ship.png','asteroid0.png','asteroid1.png','asteroid2.png','bg_sky.jpg','balloon_red.png','balloon_blue.png','balloon_green.png','balloon_yellow.png','balloon_purple.png','balloon_pink.png',
  'bg_market.jpg','basket.png','fruit_apple.png','fruit_orange.png','fruit_watermelon.png','fruit_lemon.png','fruit_grapes.png','pizza.png','bg_table.jpg','owl0.png','owl1.png','bg_road.jpg','gate.png','coin.png','card_back.png','card_front.png','heart.png'];
function loadImages(cb){
  var left=0;
  IMG_LIST.forEach(function(n){
    if(IMG[n])return;left++;
    var im=new Image();im.onload=im.onerror=function(){left--;if(!left)cb();};im.src=IMG_DIR+n;IMG[n]=im;
  });
  if(!left)cb();
}
function ok(im){return im&&im.complete&&im.naturalWidth>0;}
function cover(ctx,im,w,h,oy){
  if(!ok(im)){ctx.fillStyle='#14152a';ctx.fillRect(0,0,w,h);return;}
  var s=Math.max(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*s,ih=im.naturalHeight*s;
  ctx.drawImage(im,(w-iw)/2,(h-ih)/2+(oy||0),iw,ih);
}

/* ---------- grade levels + question maker ---------- */
var LEVELS=[['1','Grade 1'],['2','Grade 2'],['3','Grade 3'],['4','Grade 4'],['5','Grade 5'],['6','Grade 6'],['7','Grade 7'],['8','Grade 8'],['9','Grade 9'],['10','Grade 10'],['11','Grade 11'],['12','Grade 12'],['13','College']];
function level(){var v=parseInt(ls('mx_arcade_level')||'0',10);if(v>=1&&v<=13)return v;
  try{var g=(W.mxCourse&&W.mxCourse.progress&&W.mxCourse.progress.grade)||'';var n=g==='college'?13:parseInt(String(g).replace('g',''),10);if(n>=1&&n<=13)return n;}catch(e){}return 3;}
function makeQ(L){
  var a,b,c,x;
  switch(L){
    case 1:a=rnd(1,9);b=rnd(1,10-a);return {q:a+' + '+b,a:a+b};
    case 2:if(Math.random()<.5){a=rnd(2,12);b=rnd(2,9);return {q:a+' + '+b,a:a+b};}a=rnd(8,20);b=rnd(1,a-1);return {q:a+' − '+b,a:a-b};
    case 3:if(Math.random()<.6){a=pick([2,3,4,5,10]);b=rnd(1,10);return {q:a+' × '+b,a:a*b};}a=rnd(15,60);b=rnd(10,39);return {q:a+' + '+b,a:a+b};
    case 4:if(Math.random()<.65){a=rnd(3,9);b=rnd(3,10);return {q:a+' × '+b,a:a*b};}b=rnd(2,9);a=b*rnd(2,9);return {q:a+' ÷ '+b,a:a/b};
    case 5:if(Math.random()<.5){a=rnd(11,25);b=rnd(3,9);return {q:a+' × '+b,a:a*b};}b=rnd(3,12);a=b*rnd(3,12);return {q:a+' ÷ '+b,a:a/b};
    case 6:if(Math.random()<.5){a=pick([10,20,25,50]);b=pick([20,40,60,80,100,200]);return {q:a+'% of '+b,a:a*b/100};}a=rnd(-9,9);b=rnd(-9,9);return {q:a+' + ('+b+')',a:a+b};
    case 7:a=rnd(2,6);x=rnd(-5,9);b=rnd(-9,9);c=a*x+b;return {q:a+'x '+(b<0?'− '+(-b):'+ '+b)+' = '+c+'   x = ?',a:x};
    case 8:if(Math.random()<.5){a=rnd(2,15);return {q:'√'+(a*a),a:a};}a=rnd(2,5);b=rnd(2,4);return {q:a+(b===2?'²':(b===3?'³':'⁴')),a:Math.pow(a,b)};
    case 9:a=rnd(2,5);b=rnd(-6,6);x=rnd(-4,5);return {q:'f(x) = '+a+'x'+(b<0?' − '+(-b):' + '+b)+'   f('+x+') = ?',a:a*x+b};
    case 10:c=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[12,16,20]]);return {q:'legs '+c[0]+' and '+c[1]+'   hyp = ?',a:c[2]};
    case 11:if(Math.random()<.5){a=pick([2,3,10]);b=rnd(1,a===10?4:6);return {q:'log'+(a===2?'₂':(a===3?'₃':'₁₀'))+' '+Math.pow(a,b),a:b};}a=rnd(2,4);b=rnd(2,5);return {q:a+'^'+b,a:Math.pow(a,b)};
    case 12:a=rnd(2,4);x=rnd(1,4);return {q:'f(x) = x'+(a===2?'²':(a===3?'³':'⁴'))+"   f′("+x+') = ?',a:a*Math.pow(x,a-1)};
    default:if(Math.random()<.5){a=rnd(1,6);b=rnd(1,6);c=rnd(1,6);x=rnd(1,6);return {q:'det [ '+a+' '+b+' ; '+c+' '+x+' ]',a:a*x-b*c};}a=rnd(-3,5);b=rnd(1,5);c=rnd(-3,5);x=rnd(1,5);return {q:'('+a+', '+b+') · ('+c+', '+x+')',a:a*c+b*x};
  }
}
function wrongs(ans,n,L){
  var out={},list=[],tries=0;
  var span=Math.max(3,Math.round(Math.abs(ans)*0.25));
  while(list.length<n&&tries<200){
    tries++;
    var w=ans+pick([-1,1])*rnd(1,span);
    if(Math.random()<.25)w=ans+pick([-10,10,-2,2]);
    if(L<6&&w<0)continue;
    if(w===ans||out[w])continue;
    out[w]=1;list.push(w);
  }
  return list;
}

/* ---------- shared game shell ---------- */
var G=null;
function best(id){return parseInt(ls('mx_arcade_best_'+id)||'0',10)||0;}
function setBest(id,v){if(v>best(id))ls('mx_arcade_best_'+id,String(v));}
function startGame(def){
  var had=!!(G&&G.pushed);if(G)G.pushed=false;
  stopGame(true);
  var ov=D.createElement('div');ov.id='mxgOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',T(def.name));
  ov.innerHTML='<div class="mxg-hud"><button type="button" class="mxg-ib" id="mxgX" aria-label="'+E(T('Exit game'))+'">✕</button>'
    +'<div class="mxg-tt"><b>'+def.icon+' '+E(T(def.name))+'</b><span id="mxgQ" aria-live="polite"></span></div>'
    +'<div class="mxg-stat"><span id="mxgLives" aria-label="'+E(T('Lives'))+'"></span><span class="mxg-sc" id="mxgScore">0</span></div>'
    +'<button type="button" class="mxg-ib" id="mxgPause" aria-label="'+E(T('Pause'))+'">⏸</button></div>'
    +'<canvas id="mxgCv"></canvas><div class="mxg-end" id="mxgEnd" hidden></div><div class="mxg-msg" id="mxgMsg"></div>';
  D.body.appendChild(ov);D.body.classList.add('mxg-on');
  var pushed=had;if(!had){try{history.pushState({mxg:1},'');pushed=true;}catch(e){}}
  var cv=$('mxgCv'),ctx=cv.getContext('2d');
  G={def:def,ov:ov,cv:cv,ctx:ctx,w:0,h:0,score:0,lives:3,t:0,run:true,paused:false,raf:0,last:0,L:level(),state:{},pushed:pushed};
  function size(){var r=cv.getBoundingClientRect(),dpr=Math.min(2,W.devicePixelRatio||1);G.w=r.width;G.h=r.height;cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(def.resize)def.resize(G);}
  G.size=size;W.addEventListener('resize',size);
  $('mxgX').onclick=function(){stopGame();};
  $('mxgPause').onclick=function(){G.paused=!G.paused;this.textContent=G.paused?'▶':'⏸';this.setAttribute('aria-label',T(G.paused?'Resume':'Pause'));if(!G.paused){G.last=performance.now();}};
  function pt(e){var r=cv.getBoundingClientRect();var p=e.touches?e.touches[0]||e.changedTouches[0]:e;return {x:p.clientX-r.left,y:p.clientY-r.top};}
  cv.addEventListener('pointerdown',function(e){if(G&&!G.paused&&def.down){var p=pt(e);def.down(G,p.x,p.y);}});
  cv.addEventListener('pointerup',function(e){if(G&&!G.paused&&def.up){var p=pt(e);def.up(G,p.x,p.y);}});
  ov.addEventListener('keydown',function(e){if(e.key==='Escape')stopGame();else if(G&&def.key)def.key(G,e.key);});
  ov.tabIndex=-1;
  loadImages(function(){
    if(!G)return;size();def.init(G);hud();
    G.last=performance.now();
    var loop=function(now){
      if(!G||!G.run)return;
      var dt=Math.min(0.05,(now-G.last)/1000);G.last=now;
      if(!G.paused&&!D.hidden){G.t+=dt;def.update(G,dt);}
      def.draw(G,G.ctx);
      if(G.paused){G.ctx.fillStyle='rgba(0,0,0,.45)';G.ctx.fillRect(0,0,G.w,G.h);label(G.ctx,T('Paused'),G.w/2,G.h/2,40,'#fff');}
      G.raf=requestAnimationFrame(loop);
    };
    G.raf=requestAnimationFrame(loop);
    try{ov.focus();}catch(e){}
  });
}
function stopGame(keep){
  if(!G)return;var back=G.pushed&&!keep;G.pushed=false;G.run=false;cancelAnimationFrame(G.raf);W.removeEventListener('resize',G.size);
  if(G.ov&&G.ov.parentNode)G.ov.parentNode.removeChild(G.ov);D.body.classList.remove('mxg-on');G=null;
  if(back){try{history.back();}catch(e){}}
  if(!keep){var c=$('content');if(c&&c.querySelector('.mxr-arcade'))renderArcade(c);}
}
function hud(){
  if(!G)return;$('mxgScore').textContent=G.score;
  var h='';if(G.def.lives!==false)for(var i=0;i<3;i++)h+='<img src="'+IMG_DIR+'heart.png" alt="" class="'+(i<G.lives?'':'lost')+'">';
  if(G.def.timer)h+='<span class="mxg-time">⏱ '+Math.max(0,Math.ceil(G.def.timer-G.t))+'</span>';
  $('mxgLives').innerHTML=h;
}
function setQ(s){var q=$('mxgQ');if(q)q.textContent=s;}
function flash(s,col){var m=$('mxgMsg');if(!m)return;m.textContent=s;m.style.color=col||'#fff';m.classList.remove('on');void m.offsetWidth;m.classList.add('on');}
function addScore(n){G.score=Math.max(0,G.score+n);hud();}
function hurt(){G.lives--;hud();if(navigator.vibrate)try{navigator.vibrate(60);}catch(e){}if(G.lives<=0)gameOver();}
function gameOver(){
  if(!G||G.over)return;G.over=true;G.paused=true;
  var id=G.def.id,prev=best(id);setBest(id,G.score);
  var end=$('mxgEnd');end.hidden=false;
  end.innerHTML='<div class="mxg-card"><div class="mxg-big">'+(G.score>prev&&G.score>0?'🏆':'🎮')+'</div><h2>'+E(T(G.score>prev&&G.score>0?'New best score!':'Game over'))+'</h2>'
    +'<p class="mxg-final">'+G.score+'</p><p>'+E(T('Best'))+': '+Math.max(prev,G.score)+'</p>'
    +'<div class="mxg-btns"><button type="button" class="mxm-btn pri" id="mxgAgain">↻ '+E(T('Play again'))+'</button><button type="button" class="mxm-btn sec" id="mxgQuit">'+E(T('Back to games'))+'</button></div></div>';
  var def=G.def;
  $('mxgAgain').onclick=function(){startGame(def);};
  $('mxgQuit').onclick=function(){stopGame();};
  try{$('mxgAgain').focus();}catch(e){}
  if(G.score>prev&&G.score>0&&typeof W.lxConfetti==='function')try{W.lxConfetti();}catch(e){}
}
function label(ctx,s,x,y,size,col,stroke){
  ctx.font='800 '+size+'px "Arial Rounded MT Bold",system-ui,-apple-system,Roboto,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  if(stroke!==false){ctx.lineWidth=Math.max(3,size/6);ctx.strokeStyle='rgba(10,10,25,.85)';ctx.lineJoin='round';ctx.strokeText(s,x,y);}
  ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y);
}
function burst(list,x,y,col){for(var i=0;i<18;i++){var a=Math.random()*6.28,v=80+Math.random()*220;list.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.6+Math.random()*.4,col:col});}}
function drawParts(ctx,list,dt){
  for(var i=list.length-1;i>=0;i--){var p=list[i];p.life-=dt;if(p.life<=0){list.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;
    ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,4,0,6.283);ctx.fill();}
  ctx.globalAlpha=1;
}

/* =====================================================================
   🚀 Asteroid Answers
   ===================================================================== */
var ASTEROIDS={id:'asteroids',icon:'🚀',name:'Asteroid Answers',thumb:'asteroid1.png',bg:'bg_space.jpg',
  desc:'Blast the asteroid with the right answer before it hits your ship.',
  init:function(g){var s=g.state;s.rocks=[];s.parts=[];s.laser=null;s.speed=38;s.scroll=0;s.combo=0;this.next(g);},
  next:function(g){
    var s=g.state,q=makeQ(g.L),n=g.L>=5?4:3,vals=shuffle([q.a].concat(wrongs(q.a,n-1,g.L)));
    s.q=q;setQ(q.q+' = ?');s.rocks=[];
    var lane=g.w/n;
    vals.forEach(function(v,i){s.rocks.push({v:v,x:lane*(i+.5)+rnd(-12,12),y:-60-rnd(0,60),r:Math.min(54,lane*.4),rot:Math.random()*6,spin:(Math.random()-.5)*1.4,img:'asteroid'+(i%3)+'.png',hit:0});});
  },
  update:function(g,dt){
    var s=g.state;s.scroll=(s.scroll+dt*20)%g.h;
    var sp=s.speed+g.t*0.9;
    for(var i=0;i<s.rocks.length;i++){var r=s.rocks[i];r.y+=sp*dt;r.rot+=r.spin*dt;if(r.hit>0)r.hit-=dt;}
    if(s.rocks.length&&s.rocks.some(function(r){return r.y-r.r>g.h-120;})){
      flash(T('Too slow!')+' '+s.q.q+' = '+s.q.a,'#fca5a5');s.combo=0;hurt();if(!g.over)this.next(g);
    }
    if(s.laser){s.laser.t-=dt;if(s.laser.t<=0)s.laser=null;}
  },
  draw:function(g,ctx){
    var s=g.state;cover(ctx,IMG['bg_space.jpg'],g.w,g.h,0);
    s.rocks.forEach(function(r){
      ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.rot);if(ok(IMG[r.img]))ctx.drawImage(IMG[r.img],-r.r,-r.r,r.r*2,r.r*2);ctx.restore();
      if(r.hit>0){ctx.fillStyle='rgba(239,68,68,.45)';ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,6.283);ctx.fill();}
      label(ctx,String(r.v),r.x,r.y,Math.round(r.r*.62),'#fff');
    });
    var sx=g.w/2,sy=g.h-70;
    if(s.laser){ctx.strokeStyle='#38bdf8';ctx.lineWidth=6;ctx.shadowColor='#38bdf8';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(sx,sy-50);ctx.lineTo(s.laser.x,s.laser.y);ctx.stroke();ctx.shadowBlur=0;}
    if(ok(IMG['ship.png']))ctx.drawImage(IMG['ship.png'],sx-40,sy-50,80,100);
    drawParts(ctx,s.parts,1/60);
  },
  down:function(g,x,y){
    var s=g.state;
    for(var i=0;i<s.rocks.length;i++){var r=s.rocks[i];if(Math.hypot(x-r.x,y-r.y)<r.r+14){this.shoot(g,r);return;}}
  },
  key:function(g,k){var i=parseInt(k,10)-1;var s=g.state;var sorted=s.rocks.slice().sort(function(a,b){return a.x-b.x;});if(sorted[i])this.shoot(g,sorted[i]);},
  shoot:function(g,r){
    var s=g.state;s.laser={x:r.x,y:r.y,t:.15};
    if(r.v===s.q.a){s.combo++;burst(s.parts,r.x,r.y,'#fbbf24');burst(s.parts,r.x,r.y,'#f97316');addScore(10*Math.min(5,s.combo));flash(s.combo>2?(s.combo+'× '+T('combo!')):T('Boom!'),'#fde68a');this.next(g);}
    else{r.hit=.4;s.combo=0;flash(s.q.q+' = '+s.q.a,'#fca5a5');hurt();}
  }
};

/* =====================================================================
   🎈 Balloon Pop
   ===================================================================== */
var BALLOONS={id:'balloons',icon:'🎈',name:'Balloon Pop',thumb:'balloon_red.png',bg:'bg_sky.jpg',timer:60,lives:false,
  desc:'Pop every balloon that follows the rule. Watch out, the rule changes!',
  init:function(g){var s=g.state;s.b=[];s.parts=[];s.spawn=0;s.ruleT=0;this.rule(g);},
  rule:function(g){
    var s=g.state,L=g.L;
    if(L<=2){var r=pick([['Pop the EVEN numbers',function(v){return v%2===0;},function(){return rnd(1,20);}],['Pop numbers bigger than 10',function(v){return v>10;},function(){return rnd(1,20);}],['Pop the ODD numbers',function(v){return v%2===1;},function(){return rnd(1,20);}]]);s.r=r;}
    else if(L<=6){var k=L<=3?pick([2,5,10]):rnd(3,9);s.r=['Pop multiples of '+k,function(v){return v%k===0;},function(){return Math.random()<.45?k*rnd(1,10):rnd(1,k*10);}];}
    else{var q=makeQ(L),ws=wrongs(q.a,4,L);s.r=['Pop: '+q.q,function(v){return v===q.a;},function(){return Math.random()<.4?q.a:pick(ws);}];}
    s.ruleT=g.t;setQ(T(s.r[0]));flash(T(s.r[0]),'#fff');
  },
  update:function(g,dt){
    var s=g.state;
    if(g.t>=this.timer){gameOver();return;}
    if(g.t-s.ruleT>15)this.rule(g);
    s.spawn-=dt;
    if(s.spawn<=0){s.spawn=Math.max(.45,1.0-g.t*.008);var cols=['red','blue','green','yellow','purple','pink'];
      s.b.push({x:rnd(50,Math.max(60,g.w-50)),y:g.h+90,v:s.r[2](),vy:70+Math.random()*50+g.t*.8,img:'balloon_'+pick(cols)+'.png',sw:Math.random()*6});}
    for(var i=s.b.length-1;i>=0;i--){var b=s.b[i];b.y-=b.vy*dt;b.sw+=dt;if(b.y<-120)s.b.splice(i,1);}
    if(Math.floor(g.t*4)!==Math.floor((g.t-dt)*4))hud();
  },
  draw:function(g,ctx){
    var s=g.state;cover(ctx,IMG['bg_sky.jpg'],g.w,g.h);
    s.b.forEach(function(b){var x=b.x+Math.sin(b.sw*1.6)*10;if(ok(IMG[b.img]))ctx.drawImage(IMG[b.img],x-48,b.y-60,96,140);label(ctx,String(b.v),x,b.y-8,30,'#fff');});
    drawParts(ctx,s.parts,1/60);
  },
  down:function(g,x,y){
    var s=g.state;
    for(var i=s.b.length-1;i>=0;i--){var b=s.b[i],bx=b.x+Math.sin(b.sw*1.6)*10;
      if(Math.abs(x-bx)<52&&y>b.y-70&&y<b.y+50){
        s.b.splice(i,1);
        if(s.r[1](b.v)){burst(s.parts,bx,b.y,'#fff');burst(s.parts,bx,b.y,'#fbbf24');addScore(10);}
        else{addScore(-5);flash(b.v+' '+T('does not fit the rule'),'#b91c1c');}
        return;}
    }
  }
};

/* =====================================================================
   🍎 Fruit Market Sums
   ===================================================================== */
var FRUITS={id:'fruit',icon:'🍎',name:'Fruit Market Sums',thumb:'fruit_apple.png',bg:'bg_market.jpg',timer:75,
  desc:'Fill the basket so the prices add up to exactly the target.',
  init:function(g){var s=g.state;s.parts=[];s.fly=[];this.order(g);},
  order:function(g){
    var s=g.state,L=g.L,hi=L<=2?9:(L<=4?20:(L<=6?40:60)),neg=L>=7;
    var parts=[],n=rnd(2,L<=2?3:4);for(var i=0;i<n;i++)parts.push(neg&&Math.random()<.3?-rnd(1,9):rnd(1,hi));
    s.target=parts.reduce(function(a,b){return a+b;},0);s.sum=0;s.picked=[];
    var vals=shuffle(parts.concat(wrongs(rnd(1,hi),Math.max(2,7-n),L).map(function(v){return neg&&Math.random()<.2?-Math.abs(v)||-1:Math.abs(v)||1;})));
    var names=['apple','orange','watermelon','lemon','grapes'];
    s.items=vals.map(function(v,i){return {v:v,img:'fruit_'+names[i%5]+'.png',used:false};});
    this.layout(g);setQ(T('Target')+': '+s.target);
  },
  resize:function(g){if(g.state.items)this.layout(g);},
  layout:function(g){
    var s=g.state,n=s.items.length,cols=Math.min(n,g.w<520?3:5),rows=Math.ceil(n/cols),sz=Math.min(110,(g.w-40)/cols-10);
    s.sz=sz;s.items.forEach(function(it,i){var r=Math.floor(i/cols),c=i%cols,inRow=Math.min(cols,n-r*cols);it.x=g.w/2+(c-(inRow-1)/2)*(sz+16);it.y=g.h*0.36+r*(sz+34);});
  },
  update:function(g,dt){
    var s=g.state;if(g.t>=this.timer){gameOver();return;}
    for(var i=s.fly.length-1;i>=0;i--){var f=s.fly[i];f.p+=dt*2.6;if(f.p>=1)s.fly.splice(i,1);}
    if(Math.floor(g.t*4)!==Math.floor((g.t-dt)*4))hud();
  },
  draw:function(g,ctx){
    var s=g.state;cover(ctx,IMG['bg_market.jpg'],g.w,g.h);
    label(ctx,T('Target')+' '+s.target,g.w/2,g.h*0.14,Math.min(54,g.w/9),'#fff');
    s.items.forEach(function(it){if(it.used)return;if(ok(IMG[it.img]))ctx.drawImage(IMG[it.img],it.x-s.sz/2,it.y-s.sz/2,s.sz,s.sz);
      ctx.fillStyle=it.v<0?'#dc2626':'#fff';ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=2;
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(it.x-30,it.y+s.sz/2-6,60,30,10);else ctx.rect(it.x-30,it.y+s.sz/2-6,60,30);ctx.fill();ctx.stroke();
      label(ctx,(it.v<0?'−':'$')+Math.abs(it.v),it.x,it.y+s.sz/2+9,20,it.v<0?'#fff':'#1f2937',false);});
    var bw=Math.min(300,g.w*.6),bx=g.w/2-bw/2,by=g.h-bw*0.58-20;
    if(ok(IMG['basket.png']))ctx.drawImage(IMG['basket.png'],bx,by,bw,bw*0.58);
    s.fly.forEach(function(f){var x=f.x+(g.w/2-f.x)*f.p,y=f.y+(by+30-f.y)*f.p-Math.sin(f.p*3.14)*120;if(ok(IMG[f.img]))ctx.drawImage(IMG[f.img],x-30,y-30,60,60);});
    label(ctx,T('Basket')+': '+s.sum,g.w/2,by+bw*0.36,Math.min(34,g.w/14),s.sum>s.target?'#fca5a5':'#fff');
    drawParts(ctx,s.parts,1/60);
  },
  down:function(g,x,y){
    var s=g.state;
    for(var i=0;i<s.items.length;i++){var it=s.items[i];if(it.used)continue;
      if(Math.abs(x-it.x)<s.sz/2+6&&Math.abs(y-it.y)<s.sz/2+18){
        it.used=true;s.sum+=it.v;s.fly.push({x:it.x,y:it.y,p:0,img:it.img});
        if(s.sum===s.target){burst(s.parts,g.w/2,g.h-120,'#22c55e');burst(s.parts,g.w/2,g.h-120,'#fbbf24');addScore(15+s.target%10);flash(T('Exactly right!'),'#bbf7d0');var self=this;setTimeout(function(){if(G)self.order(G);},450);}
        if(s.sum!==s.target&&s.items.filter(function(z){return !z.used;}).length===0){flash(T('Out of fruit!'),'#fca5a5');hurt();if(!g.over)this.order(g);}
        return;}
    }
  },
  /* a "start over" tap on the basket */
  up:function(g,x,y){var s=g.state,bw=Math.min(300,g.w*.6);if(y>g.h-bw*0.58-20&&Math.abs(x-g.w/2)<bw/2&&s.sum!==0&&s.sum!==s.target){s.items.forEach(function(it){it.used=false;});s.sum=0;flash(T('Basket emptied'),'#fff');}}
};

/* =====================================================================
   🍕 Pizza Fractions
   ===================================================================== */
var PIZZA={id:'pizza',icon:'🍕',name:'Pizza Fractions',thumb:'pizza.png',bg:'bg_table.jpg',
  desc:'Tap the slices to serve exactly the fraction the customer orders.',
  init:function(g){var s=g.state;s.parts=[];this.order(g);},
  order:function(g){
    var s=g.state,L=g.L,den=pick(L<=3?[2,3,4]:(L<=5?[2,3,4,6,8]:[3,4,5,6,8,10,12])),num=rnd(1,den-1);
    var mult=L>=4?pick([1,1,2,L>=6?3:2]):1;s.slices=Math.min(12,den*mult);if(s.slices%den)s.slices=den;
    s.num=num;s.den=den;s.sel={};
    var txt=num+'/'+den;
    if(L>=6&&Math.random()<.35){var pct=num/den*100;if(Math.abs(pct-Math.round(pct))<1e-9)txt=Math.round(pct)+'%';else if(den===2||den===4||den===5||den===10)txt=String(+(num/den).toFixed(2));}
    s.txt=txt;setQ(T('Serve')+' '+txt+' '+T('of the pizza'));
  },
  geom:function(g){var r=Math.min(g.w,g.h-170)*0.4;return {cx:g.w/2,cy:g.h*0.5,r:r};},
  update:function(g,dt){},
  draw:function(g,ctx){
    var s=g.state,o=this.geom(g);cover(ctx,IMG['bg_table.jpg'],g.w,g.h);
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.arc(o.cx,o.cy,o.r*1.12,0,6.283);ctx.fill();
    for(var i=0;i<s.slices;i++){
      var a0=-Math.PI/2+i*2*Math.PI/s.slices,a1=a0+2*Math.PI/s.slices,am=(a0+a1)/2,on=s.sel[i],off=on?o.r*0.08:0;
      ctx.save();ctx.translate(Math.cos(am)*off,Math.sin(am)*off);
      ctx.beginPath();ctx.moveTo(o.cx,o.cy);ctx.arc(o.cx,o.cy,o.r,a0,a1);ctx.closePath();ctx.clip();
      if(ok(IMG['pizza.png']))ctx.drawImage(IMG['pizza.png'],o.cx-o.r,o.cy-o.r,o.r*2,o.r*2);
      if(on){ctx.fillStyle='rgba(34,197,94,.28)';ctx.fill();}
      ctx.restore();
      ctx.save();ctx.translate(Math.cos(am)*off,Math.sin(am)*off);
      ctx.strokeStyle=on?'#16a34a':'rgba(120,60,20,.9)';ctx.lineWidth=on?5:3;ctx.beginPath();ctx.moveTo(o.cx,o.cy);ctx.arc(o.cx,o.cy,o.r,a0,a1);ctx.closePath();ctx.stroke();ctx.restore();
    }
    var n=Object.keys(s.sel).length;
    label(ctx,T('Order')+': '+s.txt,g.w/2,o.cy-o.r-46,Math.min(44,g.w/10),'#fff');
    label(ctx,n+' / '+s.slices,g.w/2,o.cy+o.r+36,30,'#fff');
    var bw=200,bh=56,bx=g.w/2-bw/2,by=g.h-bh-20;s.btn={x:bx,y:by,w:bw,h:bh};
    ctx.fillStyle='#16a34a';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,bw,bh,28);else ctx.rect(bx,by,bw,bh);ctx.fill();
    label(ctx,'🍽 '+T('Serve'),g.w/2,by+bh/2,26,'#fff',false);
    drawParts(ctx,s.parts,1/60);
  },
  down:function(g,x,y){
    var s=g.state,o=this.geom(g),b=s.btn;
    if(b&&x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h){this.serve(g);return;}
    var dx=x-o.cx,dy=y-o.cy;if(Math.hypot(dx,dy)>o.r*1.1)return;
    var a=Math.atan2(dy,dx)+Math.PI/2;if(a<0)a+=2*Math.PI;var i=Math.floor(a/(2*Math.PI/s.slices))%s.slices;
    if(s.sel[i])delete s.sel[i];else s.sel[i]=1;
  },
  key:function(g,k){if(k==='Enter')this.serve(g);},
  serve:function(g){
    var s=g.state,n=Object.keys(s.sel).length;
    if(n*s.den===s.num*s.slices){burst(s.parts,g.w/2,g.h/2,'#22c55e');burst(s.parts,g.w/2,g.h/2,'#fbbf24');addScore(20);flash(n+'/'+s.slices+' = '+s.txt+' ✔','#bbf7d0');this.order(g);}
    else{flash(T('That is')+' '+n+'/'+s.slices+', '+T('not')+' '+s.txt,'#fca5a5');s.sel={};hurt();}
  }
};

/* =====================================================================
   🦉 Owl Runner
   ===================================================================== */
var RUNNER={id:'runner',icon:'🦉',name:'Owl Runner',thumb:'owl0.png',bg:'bg_road.jpg',
  desc:'Steer Hoot into the lane with the right answer. Swipe, tap a lane, or use the arrow keys.',
  init:function(g){var s=g.state;s.lane=1;s.x=null;s.scroll=0;s.speed=150;s.row=null;s.parts=[];s.coins=[];s.sx=null;this.row(g);},
  lx:function(g,i){var road=Math.min(g.w,g.h*0.62),x0=(g.w-road)/2;return x0+road*(i+.5)/3;},
  row:function(g){var s=g.state,q=makeQ(g.L),vals=shuffle([q.a].concat(wrongs(q.a,2,g.L)));s.q=q;s.row={y:-80,vals:vals};setQ(q.q+' = ?');},
  update:function(g,dt){
    var s=g.state;s.speed=150+g.t*3;s.scroll=(s.scroll+s.speed*dt);
    var tx=this.lx(g,s.lane);s.x=s.x==null?tx:s.x+(tx-s.x)*Math.min(1,dt*12);
    if(s.row){s.row.y+=s.speed*dt;
      if(s.row.y>g.h-150){var v=s.row.vals[s.lane];
        if(v===s.q.a){addScore(10);burst(s.parts,s.x,g.h-150,'#fbbf24');s.coins.push({x:s.x,y:g.h-150,t:0});flash(T('Correct!'),'#fde68a');}
        else{flash(s.q.q+' = '+s.q.a,'#fca5a5');hurt();}
        if(!g.over)this.row(g);}
    }
    s.coins.forEach(function(c){c.t+=dt;});s.coins=s.coins.filter(function(c){return c.t<.8;});
  },
  draw:function(g,ctx){
    var s=g.state,im=IMG['bg_road.jpg'];
    if(ok(im)){var sc=Math.max(g.w/im.naturalWidth,g.h/im.naturalHeight),iw=im.naturalWidth*sc,ih=im.naturalHeight*sc,off=(s.scroll%ih);
      ctx.drawImage(im,(g.w-iw)/2,off-ih,iw,ih);ctx.drawImage(im,(g.w-iw)/2,off,iw,ih);}
    if(s.row){var self=this;s.row.vals.forEach(function(v,i){var x=self.lx(g,i),gw=Math.min(150,g.w/3.4);if(ok(IMG['gate.png']))ctx.drawImage(IMG['gate.png'],x-gw/2,s.row.y-gw*0.3,gw,gw*0.6);label(ctx,String(v),x,s.row.y-gw*0.11,Math.round(gw*0.2),'#1f2937',false);});}
    var fr=Math.floor(g.t*8)%2;if(ok(IMG['owl'+fr+'.png']))ctx.drawImage(IMG['owl'+fr+'.png'],s.x-45,g.h-200,90,101);
    s.coins.forEach(function(c){if(ok(IMG['coin.png'])){ctx.globalAlpha=1-c.t/.8;ctx.drawImage(IMG['coin.png'],c.x-20,c.y-80*c.t-20,40,40);ctx.globalAlpha=1;}});
    drawParts(ctx,s.parts,1/60);
  },
  down:function(g,x,y){g.state.sx=x;},
  up:function(g,x,y){var s=g.state;if(s.sx!=null&&Math.abs(x-s.sx)>40){s.lane=clamp(s.lane+(x>s.sx?1:-1),0,2);}else{var best_=0,d=1e9;for(var i=0;i<3;i++){var dd=Math.abs(x-this.lx(g,i));if(dd<d){d=dd;best_=i;}}s.lane=best_;}s.sx=null;},
  key:function(g,k){var s=g.state;if(k==='ArrowLeft')s.lane=Math.max(0,s.lane-1);else if(k==='ArrowRight')s.lane=Math.min(2,s.lane+1);}
};

/* =====================================================================
   🃏 Memory Match
   ===================================================================== */
var MEMORY={id:'memory',icon:'🃏',name:'Memory Match',thumb:'card_back.png',bg:'bg_space.jpg',lives:false,
  desc:'Flip two cards: match each question with its answer in as few moves as you can.',
  init:function(g){
    var s=g.state,pairs=[],seen={};
    while(pairs.length<6){var q=makeQ(g.L);if(seen[q.a])continue;seen[q.a]=1;pairs.push(q);}
    var cards=[];pairs.forEach(function(q,i){cards.push({k:i,t:q.q,open:false,done:false,f:0});cards.push({k:i,t:String(q.a),open:false,done:false,f:0});});
    s.cards=shuffle(cards);s.open=[];s.moves=0;s.found=0;s.lock=0;s.parts=[];setQ(T('Moves')+': 0');this.resize(g);
  },
  resize:function(g){var s=g.state;if(!s.cards)return;var cols=g.w>g.h?4:3,rows=Math.ceil(12/cols),cw=Math.min((g.w-30)/cols-10,((g.h-40)/rows-12)/1.3),ch=cw*1.3;
    s.cards.forEach(function(c,i){var r=Math.floor(i/cols),cl=i%cols;c.w=cw;c.h=ch;c.x=g.w/2+(cl-(cols-1)/2)*(cw+10)-cw/2;c.y=g.h/2+(r-(rows-1)/2)*(ch+12)-ch/2;});},
  update:function(g,dt){var s=g.state;s.cards.forEach(function(c){var tg=(c.open||c.done)?1:0;c.f+=(tg-c.f)*Math.min(1,dt*10);});
    if(s.lock>0){s.lock-=dt;if(s.lock<=0){s.open.forEach(function(c){c.open=false;});s.open=[];}}},
  draw:function(g,ctx){
    var s=g.state;cover(ctx,IMG['bg_space.jpg'],g.w,g.h);
    s.cards.forEach(function(c){
      var sx=Math.abs(Math.cos(c.f*Math.PI)),front=c.f>.5,w=c.w*Math.max(.04,sx);
      var im=IMG[front?'card_front.png':'card_back.png'];
      if(ok(im))ctx.drawImage(im,c.x+(c.w-w)/2,c.y,w,c.h);
      if(front&&sx>.3){var fs=Math.min(c.w*.2,(c.w*.85)/Math.max(3,c.t.length)*1.7);label(ctx,c.t,c.x+c.w/2,c.y+c.h/2,Math.round(fs),c.done?'#16a34a':'#312e81',false);}
    });
    drawParts(ctx,s.parts,1/60);
  },
  down:function(g,x,y){
    var s=g.state;if(s.lock>0)return;
    for(var i=0;i<s.cards.length;i++){var c=s.cards[i];
      if(x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.h){
        if(c.open||c.done)return;c.open=true;s.open.push(c);
        if(s.open.length===2){s.moves++;setQ(T('Moves')+': '+s.moves);
          var a=s.open[0],b=s.open[1];
          if(a.k===b.k){a.done=b.done=true;s.open=[];s.found++;burst(s.parts,b.x+b.w/2,b.y+b.h/2,'#22c55e');addScore(Math.max(5,25-s.moves));
            if(s.found===6){var self=this;setTimeout(function(){if(G)gameOver();},700);}}
          else s.lock=.9;}
        return;}
    }
  }
};

var GAMES=[ASTEROIDS,BALLOONS,FRUITS,PIZZA,RUNNER,MEMORY];

/* ---------- arcade page (replaces the old Games hub) ---------- */
function renderArcade(c){
  var L=level();
  c.innerHTML='<div class="mxr-arcade">'
    +'<div class="mxr-hero"><div><h1>🎮 '+E(T('Matix Arcade'))+'</h1><p>'+E(T('Real games, real maths. Pick your grade and the questions grow with you.'))+'</p></div></div>'
    +'<label class="mxr-lv"><span>'+E(T('Difficulty'))+'</span><select id="mxaLv" aria-label="'+E(T('Difficulty'))+'">'+LEVELS.map(function(l){return '<option value="'+l[0]+'"'+(+l[0]===L?' selected':'')+'>'+E(T(l[1]))+'</option>';}).join('')+'</select></label>'
    +'<div class="mxr-grid">'+GAMES.map(function(g,i){
      return '<button type="button" class="mxr-card" data-i="'+i+'" aria-label="'+E(T(g.name)+'. '+T(g.desc))+'">'
        +'<span class="mxr-art" style="background-image:url('+IMG_DIR+g.bg+')"><img src="'+IMG_DIR+g.thumb+'" alt=""></span>'
        +'<span class="mxr-tx"><b>'+g.icon+' '+E(T(g.name))+'</b><small>'+E(T(g.desc))+'</small><em>🏆 '+E(T('Best'))+': '+best(g.id)+'</em></span></button>';
    }).join('')+'</div></div>';
  $('mxaLv').onchange=function(){ls('mx_arcade_level',this.value);};
  c.querySelectorAll('.mxr-card').forEach(function(b){b.onclick=function(){startGame(GAMES[+b.dataset.i]);};});
}
W.renderGames=function(c){renderArcade(c);};
W.renderGamePlay=function(c){renderArcade(c);};
W.mxArcade={start:function(id){var g=GAMES.filter(function(x){return x.id===id;})[0];if(g)startGame(g);},games:GAMES,makeQ:makeQ};
/* Android back button closes a running game */
W.addEventListener('popstate',function(){if(G){G.pushed=false;stopGame();}});
})();
