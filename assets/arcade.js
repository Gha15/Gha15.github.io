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
  'bg_market.jpg','basket.png','fruit_apple.png','fruit_orange.png','fruit_watermelon.png','fruit_lemon.png','fruit_grapes.png','pizza.png','bg_table.jpg','owl0.png','owl1.png','bg_road.jpg','gate.png','coin.png','card_back.png','card_front.png','heart.png','bomb.png','castle.png','monster0.png','monster1.png','monster2.png','car_orange.png','car_purple.png','stone.png','snake.png','bolt.png'];
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
/* Home = play on your own. Class = two teams take turns on one screen; every game's score goes to the team that played it. */
var CLS=(function(){var d={on:false,turn:'A',A:0,B:0,nA:'Team A',nB:'Team B'};try{var v=JSON.parse(ls('mx_arcade_class')||'null');if(v)for(var k in d)if(v[k]!==undefined)d[k]=v[k];}catch(e){}return d;})();
function saveCls(){ls('mx_arcade_class',JSON.stringify(CLS));}
function teamName(t){return CLS['n'+t]||('Team '+t);}
function best(id){return parseInt(ls('mx_arcade_best_'+id)||'0',10)||0;}
function setBest(id,v){if(v>best(id))ls('mx_arcade_best_'+id,String(v));}
function startGame(def){
  var had=!!(G&&G.pushed);if(G)G.pushed=false;
  stopGame(true);
  var ov=D.createElement('div');ov.id='mxgOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',T(def.name));
  ov.innerHTML='<div class="mxg-hud"><button type="button" class="mxg-ib" id="mxgX" aria-label="'+E(T('Exit game'))+'">✕</button>'
    +'<div class="mxg-tt"><b>'+def.icon+' '+E(T(def.name))+(CLS.on?' \u00b7 '+E(teamName(CLS.turn)):'')+'</b><span id="mxgQ" aria-live="polite"></span></div>'
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
  cv.addEventListener('pointermove',function(e){if(G&&!G.paused&&def.move){var p=pt(e);def.move(G,p.x,p.y);}});
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
  if(CLS.on){
    var t=CLS.turn,nt=t==='A'?'B':'A';CLS[t]+=G.score;CLS.turn=nt;saveCls();
    end.innerHTML='<div class="mxg-card"><div class="mxg-big">\uD83C\uDFEB</div><h2>'+E(teamName(t))+' '+E(T('scored'))+' '+G.score+'</h2>'
      +'<div class="mxg-teams"><div class="'+(CLS.A>=CLS.B?'lead':'')+'"><span>'+E(teamName('A'))+'</span><b>'+CLS.A+'</b></div><div class="'+(CLS.B>CLS.A?'lead':'')+'"><span>'+E(teamName('B'))+'</span><b>'+CLS.B+'</b></div></div>'
      +'<div class="mxg-btns"><button type="button" class="mxm-btn pri" id="mxgAgain">\u25B6 '+E(teamName(nt))+': '+E(T('your turn'))+'</button><button type="button" class="mxm-btn sec" id="mxgQuit">'+E(T('Pick another game'))+'</button></div></div>';
  }
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

/* =====================================================================
   1.0.10: eight more games, each with real ways to lose
   ===================================================================== */
function rr(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function qText(q){return /\?$/.test(q.q)?q.q:q.q+' = ?';}
function ansText(q){return /\?$/.test(q.q)?q.q.replace(/\?$/,String(q.a)):q.q+' = '+q.a;}
function choices(q,L,n){return shuffle([q.a].concat(wrongs(q.a,(n||4)-1,L)));}
/* answer buttons drawn on the canvas (tap them, or press 1-4) */
function choiceBtns(g,ctx,opts,top,h){
  var cols=g.w<520?2:4,gap=10,bw=(g.w-20-gap*(cols-1))/cols,bh=Math.min(h,64),out=[];
  opts.forEach(function(o,i){var r=Math.floor(i/cols),c=i%cols,x=10+c*(bw+gap),y=top+r*(bh+gap);out.push({x:x,y:y,w:bw,h:bh,v:o});
    ctx.fillStyle='rgba(255,255,255,.94)';rr(ctx,x,y,bw,bh,16);ctx.fill();label(ctx,String(o),x+bw/2,y+bh/2,Math.min(28,bh*.44),'#1f2937',false);
    label(ctx,String(i+1),x+16,y+14,11,'#9ca3af',false);});
  g.state.btns=out;
}
function btnsTop(g){return g.h-(g.w<520?150:82);}
function hitBtn(g,x,y){var b=g.state.btns||[];for(var i=0;i<b.length;i++){var r=b[i];if(x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h)return r;}return null;}
function keyBtn(g,k){var i=parseInt(k,10)-1,b=g.state.btns;return b&&b[i]?b[i]:null;}
function timeBar(ctx,x,y,w,p){ctx.fillStyle='rgba(255,255,255,.18)';rr(ctx,x,y,w,10,5);ctx.fill();ctx.fillStyle=p>.35?'#22c55e':'#ef4444';rr(ctx,x,y,Math.max(0,w*p),10,5);ctx.fill();}

/* ⚡ True or False Rush */
var TRUEFALSE={id:'truefalse',icon:'⚡',name:'True or False Rush',thumb:'bolt.png',bg:'bg_space.jpg',
  desc:'Is it right or wrong? Decide before the time bar runs out. The bar gets shorter and shorter.',
  init:function(g){g.state.parts=[];g.state.streak=0;this.next(g);},
  next:function(g){var s=g.state,q=makeQ(g.L),truth=Math.random()<.5,shown=truth?q.a:pick(wrongs(q.a,3,g.L));
    s.truth=truth;s.q=q;s.text=/\?$/.test(q.q)?q.q.replace(/\?$/,String(shown)):q.q+' = '+shown;s.limit=Math.max(1.8,5.5-g.t*0.035);s.left=s.limit;setQ(T('True or false?'));},
  update:function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+ansText(s.q),'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_space.jpg'],g.w,g.h);
    var cw=Math.min(g.w-30,680),cx=(g.w-cw)/2,cy=g.h*0.16,ch=g.h*0.3;ctx.fillStyle='rgba(15,16,40,.88)';rr(ctx,cx,cy,cw,ch,24);ctx.fill();
    label(ctx,s.text,g.w/2,cy+ch/2,Math.min(52,cw/Math.max(5,s.text.length)*1.75),'#fff');
    timeBar(ctx,cx,cy+ch+14,cw,clamp(s.left/s.limit,0,1));
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w/2,cy-22,24,'#fbbf24');
    var bw=Math.min(260,(g.w-50)/2),bh=Math.min(120,g.h*0.2),by=g.h-bh-28;s.tb={x:g.w/2-bw-10,y:by,w:bw,h:bh};s.fb={x:g.w/2+10,y:by,w:bw,h:bh};
    ctx.fillStyle='#16a34a';rr(ctx,s.tb.x,by,bw,bh,24);ctx.fill();label(ctx,'✔ '+T('TRUE'),s.tb.x+bw/2,by+bh/2,30,'#fff',false);
    ctx.fillStyle='#dc2626';rr(ctx,s.fb.x,by,bw,bh,24);ctx.fill();label(ctx,'✘ '+T('FALSE'),s.fb.x+bw/2,by+bh/2,30,'#fff',false);
    drawParts(ctx,s.parts,1/60);},
  down:function(g,x,y){var s=g.state;function inb(b){return b&&x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;}if(inb(s.tb))this.answer(g,true);else if(inb(s.fb))this.answer(g,false);},
  key:function(g,k){if(k==='ArrowLeft'||k==='t'||k==='T'||k==='1')this.answer(g,true);else if(k==='ArrowRight'||k==='f'||k==='F'||k==='2')this.answer(g,false);},
  answer:function(g,v){var s=g.state;if(v===s.truth){s.streak++;addScore(5+Math.min(10,s.streak)*2+Math.round(s.left*2));burst(s.parts,g.w/2,g.h*0.3,'#22c55e');}
    else{s.streak=0;flash(T('Nope!')+' '+ansText(s.q),'#fca5a5');hurt();}if(!g.over)this.next(g);}
};

/* 🐍 Number Snake */
var SNAKE={id:'snake',icon:'🐍',name:'Number Snake',thumb:'snake.png',bg:'bg_table.jpg',
  desc:'Steer the snake to the coin with the right answer. Wrong coins, walls and your own tail cost a life. Swipe, tap or use the arrows.',
  init:function(g){g.state.parts=[];this.layout(g);this.reset(g);this.food(g);},
  resize:function(g){if(g.state.snake){this.layout(g);this.reset(g);this.food(g);}},
  layout:function(g){var s=g.state;s.cols=g.w<520?11:16;s.cell=Math.floor(Math.min(g.w/s.cols,(g.h-16)/9));s.rows=Math.max(8,Math.floor((g.h-16)/s.cell));s.ox=(g.w-s.cols*s.cell)/2;s.oy=(g.h-s.rows*s.cell)/2;},
  reset:function(g){var s=g.state,cx=Math.floor(s.cols/2),cy=Math.floor(s.rows/2);s.snake=[{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}];s.dir={x:1,y:0};s.nd={x:1,y:0};s.acc=0;s.grow=0;s.safe=1.2;},
  food:function(g){var s=g.state,q=makeQ(g.L),vals=shuffle([q.a].concat(wrongs(q.a,2,g.L)));s.q=q;setQ(qText(q));s.foods=[];
    vals.forEach(function(v){var p,t=0;do{p={x:rnd(0,s.cols-1),y:rnd(0,s.rows-1)};t++;}while(t<300&&(s.snake.some(function(c){return c.x===p.x&&c.y===p.y;})||s.foods.some(function(f){return Math.abs(f.x-p.x)+Math.abs(f.y-p.y)<3;})||Math.abs(p.x-s.snake[0].x)+Math.abs(p.y-s.snake[0].y)<3));p.v=v;s.foods.push(p);});},
  update:function(g,dt){var s=g.state;if(s.safe>0)s.safe-=dt;s.acc+=dt;if(s.acc<Math.max(.085,.2-g.t*.0012))return;s.acc=0;
    s.dir=s.nd;var h=s.snake[0],n={x:h.x+s.dir.x,y:h.y+s.dir.y};
    if(n.x<0||n.y<0||n.x>=s.cols||n.y>=s.rows||s.snake.some(function(c,i){return i<s.snake.length-1&&c.x===n.x&&c.y===n.y;})){
      if(s.safe>0)return;flash(T('Crash!'),'#fca5a5');hurt();if(!g.over){this.reset(g);this.food(g);}return;}
    s.snake.unshift(n);
    var fi=-1;s.foods.forEach(function(f,i){if(f.x===n.x&&f.y===n.y)fi=i;});
    if(fi>-1){var f=s.foods[fi],px=s.ox+(f.x+.5)*s.cell,py=s.oy+(f.y+.5)*s.cell;
      if(f.v===s.q.a){s.grow+=2;addScore(10+s.snake.length);burst(s.parts,px,py,'#fbbf24');this.food(g);}
      else{flash(T('Wrong coin!')+' '+ansText(s.q),'#fca5a5');s.foods.splice(fi,1);hurt();if(g.over)return;}}
    if(s.grow>0)s.grow--;else s.snake.pop();},
  draw:function(g,ctx){var s=g.state;ctx.fillStyle='#0f1a14';ctx.fillRect(0,0,g.w,g.h);
    for(var y=0;y<s.rows;y++)for(var x=0;x<s.cols;x++){ctx.fillStyle=(x+y)%2?'#16301f':'#1a3a25';ctx.fillRect(s.ox+x*s.cell,s.oy+y*s.cell,s.cell,s.cell);}
    s.foods.forEach(function(f){var px=s.ox+(f.x+.5)*s.cell,py=s.oy+(f.y+.5)*s.cell;if(ok(IMG['coin.png']))ctx.drawImage(IMG['coin.png'],px-s.cell*.6,py-s.cell*.6,s.cell*1.2,s.cell*1.2);label(ctx,String(f.v),px,py,Math.max(12,s.cell*.42),'#fff');});
    if(s.safe>0&&Math.floor(s.safe*8)%2)ctx.globalAlpha=.45;
    s.snake.forEach(function(c,i){ctx.fillStyle=i===0?'#86efac':(i%2?'#22c55e':'#16a34a');rr(ctx,s.ox+c.x*s.cell+2,s.oy+c.y*s.cell+2,s.cell-4,s.cell-4,s.cell*.3);ctx.fill();});
    ctx.globalAlpha=1;var h=s.snake[0];ctx.fillStyle='#111';[-1,1].forEach(function(k){ctx.beginPath();ctx.arc(s.ox+(h.x+.5)*s.cell+s.dir.x*s.cell*.18+(s.dir.y*k)*s.cell*.18,s.oy+(h.y+.5)*s.cell+s.dir.y*s.cell*.18+(s.dir.x*k)*s.cell*.18,s.cell*.08,0,6.28);ctx.fill();});
    drawParts(ctx,s.parts,1/60);},
  turn:function(g,dx,dy){var s=g.state;if(dx===-s.dir.x&&dy===-s.dir.y)return;s.nd={x:dx,y:dy};},
  down:function(g,x,y){g.state.sx=x;g.state.sy=y;},
  up:function(g,x,y){var s=g.state,dx=x-(s.sx==null?x:s.sx),dy=y-(s.sy==null?y:s.sy);
    if(Math.abs(dx)<24&&Math.abs(dy)<24){var h=s.snake[0];dx=x-(s.ox+(h.x+.5)*s.cell);dy=y-(s.oy+(h.y+.5)*s.cell);}
    if(Math.abs(dx)>Math.abs(dy))this.turn(g,dx>0?1:-1,0);else this.turn(g,0,dy>0?1:-1);s.sx=s.sy=null;},
  key:function(g,k){var m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(m)this.turn(g,m[0],m[1]);}
};

/* 🪨 Stepping Stones */
var STONES={id:'stones',icon:'🪨',name:'Stepping Stones',thumb:'stone.png',bg:'bg_sky.jpg',
  desc:'Hop Hoot across the river on the stone with the right answer before the stones sink. A wrong stone is a splash!',
  init:function(g){var s=g.state;s.parts=[];s.hop=0;s.dist=0;s.wave=0;this.row(g);},
  row:function(g){var s=g.state,q=makeQ(g.L);s.q=q;s.vals=shuffle([q.a].concat(wrongs(q.a,2,g.L)));s.limit=Math.max(2.6,7-g.t*0.045);s.left=s.limit;setQ(qText(q));},
  update:function(g,dt){var s=g.state;s.wave+=dt;if(s.hop>0)s.hop-=dt*2.5;s.left-=dt;if(s.left<=0){flash(T('The stones sank!')+' '+ansText(s.q),'#fca5a5');this.splash(g);hurt();if(!g.over)this.row(g);}},
  sx:function(g,i){return g.w*(i+.5)/3;},
  draw:function(g,ctx){var s=g.state,gr=ctx.createLinearGradient(0,0,0,g.h);gr.addColorStop(0,'#1e3a8a');gr.addColorStop(1,'#0e7490');ctx.fillStyle=gr;ctx.fillRect(0,0,g.w,g.h);
    ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=3;for(var y=90;y<g.h-90;y+=44){ctx.beginPath();for(var x=0;x<=g.w;x+=20)ctx.lineTo(x,y+Math.sin(x/40+s.wave*2+y)*5);ctx.stroke();}
    ctx.fillStyle='#4d7c0f';ctx.fillRect(0,g.h-90,g.w,90);ctx.fillStyle='#65a30d';ctx.fillRect(0,0,g.w,56);
    var sink=1-clamp(s.left/s.limit,0,1),self=this,ry=g.h*0.42,sw=Math.min(200,g.w/3.4);
    s.vals.forEach(function(v,i){var x=self.sx(g,i);ctx.globalAlpha=1-sink*.75;if(ok(IMG['stone.png']))ctx.drawImage(IMG['stone.png'],x-sw/2,ry-sw*.27+sink*16,sw,sw*.55);ctx.globalAlpha=1;
      label(ctx,String(v),x,ry+sink*16,Math.min(34,sw*.22),'#fff');});
    var oy=g.h-170-Math.sin(clamp(s.hop,0,1)*3.14)*60;if(ok(IMG['owl0.png']))ctx.drawImage(IMG['owl0.png'],g.w/2-40,oy,80,90);
    label(ctx,T('Distance')+': '+s.dist+' m',g.w/2,g.h-24,20,'#fff');timeBar(ctx,20,70,g.w-40,1-sink);
    drawParts(ctx,s.parts,1/60);},
  splash:function(g){burst(g.state.parts,g.w/2,g.h-130,'#93c5fd');burst(g.state.parts,g.w/2,g.h-130,'#fff');},
  choose:function(g,i){var s=g.state;if(s.vals[i]===s.q.a){s.dist+=5;s.hop=1;addScore(10+Math.round(s.left*3));burst(s.parts,this.sx(g,i),g.h*0.42,'#a3e635');this.row(g);}
    else{flash(T('Splash!')+' '+ansText(s.q),'#fca5a5');this.splash(g);hurt();if(!g.over)this.row(g);}},
  down:function(g,x,y){if(y>g.h*0.22&&y<g.h*0.64)this.choose(g,clamp(Math.floor(x/(g.w/3)),0,2));},
  key:function(g,k){var i=parseInt(k,10)-1;if(i>=0&&i<3)this.choose(g,i);else if(k==='ArrowLeft')this.choose(g,0);else if(k==='ArrowUp')this.choose(g,1);else if(k==='ArrowRight')this.choose(g,2);}
};

/* 🏰 Castle Defense */
var CASTLE={id:'castle',icon:'🏰',name:'Castle Defense',thumb:'castle.png',bg:'bg_sky.jpg',
  desc:'Monsters march on your castle. Answer the sum over the front monster to zap it. Wrong answers make it run faster!',
  init:function(g){var s=g.state;s.mons=[];s.parts=[];s.spawn=0;s.zap=null;s.cur=null;},
  spawn:function(g){var s=g.state,lane=rnd(0,2);s.mons.push({q:makeQ(g.L),x:g.w+50,y:g.h*0.34+lane*Math.min(70,g.h*0.09),v:24+Math.min(55,g.t*0.55)+Math.random()*10,img:'monster'+rnd(0,2)+'.png',b:Math.random()*6});},
  update:function(g,dt){var s=g.state;s.spawn-=dt;if(s.spawn<=0||!s.mons.length){this.spawn(g);s.spawn=Math.max(2.4,6-g.t*0.04);}
    var wall=Math.min(170,g.w*0.26);
    for(var i=s.mons.length-1;i>=0;i--){var m=s.mons[i];m.x-=m.v*dt;m.b+=dt*6;if(m.x<wall){s.mons.splice(i,1);if(s.cur===m)s.cur=null;flash(T('A monster broke in!'),'#fca5a5');burst(s.parts,wall,m.y,'#ef4444');hurt();if(g.over)return;}}
    var f=null;s.mons.forEach(function(m){if(!f||m.x<f.x)f=m;});if(f&&f!==s.cur){s.cur=f;s.opts=choices(f.q,g.L,4);setQ(qText(f.q));}
    if(s.zap){s.zap.t-=dt;if(s.zap.t<=0)s.zap=null;}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_sky.jpg'],g.w,g.h);var wall=Math.min(170,g.w*0.26),ch=wall*1.08;
    if(ok(IMG['castle.png']))ctx.drawImage(IMG['castle.png'],0,g.h*0.58-ch,wall,ch);
    s.mons.forEach(function(m){var y=m.y+Math.sin(m.b)*5,mw=Math.min(84,g.w*.16);if(ok(IMG[m.img]))ctx.drawImage(IMG[m.img],m.x-mw/2,y-mw/2,mw,mw*1.07);
      var t=qText(m.q),cur=m===s.cur,fs=cur?18:13,tw=Math.max(56,t.length*fs*.56);ctx.fillStyle=cur?'#fff':'rgba(255,255,255,.7)';rr(ctx,m.x-tw/2,y-mw/2-36,tw,28,10);ctx.fill();label(ctx,t,m.x,y-mw/2-22,fs,'#1f2937',false);});
    if(s.zap){ctx.strokeStyle='#fde047';ctx.lineWidth=6;ctx.shadowColor='#fde047';ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(wall*0.5,g.h*0.58-ch*0.85);ctx.lineTo(s.zap.x,s.zap.y);ctx.stroke();ctx.shadowBlur=0;}
    if(s.opts&&s.cur)choiceBtns(g,ctx,s.opts,btnsTop(g),62);drawParts(ctx,s.parts,1/60);},
  choose:function(g,v){var s=g.state,f=s.cur;if(!f)return;
    if(v===f.q.a){s.zap={x:f.x,y:f.y,t:.18};burst(s.parts,f.x,f.y,'#fde047');burst(s.parts,f.x,f.y,'#a855f7');s.mons.splice(s.mons.indexOf(f),1);s.cur=null;addScore(10+Math.round(Math.max(0,f.x-g.w*.3)/20));if(!s.mons.length)s.spawn=.5;}
    else{f.v+=16;flash(T('Wrong! It got faster'),'#fca5a5');}},
  down:function(g,x,y){var b=hitBtn(g,x,y);if(b)this.choose(g,b.v);},
  key:function(g,k){var b=keyBtn(g,k);if(b)this.choose(g,b.v);}
};

/* 🧺 Fruit Catcher */
var CATCHER={id:'catcher',icon:'🧺',name:'Fruit Catcher',thumb:'basket.png',bg:'bg_market.jpg',
  desc:'Slide the basket to catch the fruit with the right answer. Catch a wrong one, or let the right one fall, and you lose a life.',
  init:function(g){var s=g.state;s.bx=g.w/2;s.tx=g.w/2;s.f=[];s.parts=[];s.spawn=.3;this.newQ(g);},
  newQ:function(g){var s=g.state;s.q=makeQ(g.L);s.ws=wrongs(s.q.a,4,g.L);setQ(T('Catch')+': '+qText(s.q));},
  update:function(g,dt){var s=g.state,names=['apple','orange','watermelon','lemon','grapes'];s.bx+=(s.tx-s.bx)*Math.min(1,dt*14);s.spawn-=dt;
    if(s.spawn<=0){s.spawn=Math.max(.55,1.15-g.t*.006);var right=Math.random()<.4||!s.f.some(function(f){return f.v===s.q.a;});
      s.f.push({x:rnd(40,Math.max(50,g.w-40)),y:-50,v:right?s.q.a:pick(s.ws),vy:90+Math.min(170,g.t*1.6)+Math.random()*40,img:'fruit_'+pick(names)+'.png',r:Math.random()*6});}
    var bw=Math.min(180,g.w*.35),by=g.h-96;
    for(var i=s.f.length-1;i>=0;i--){var f=s.f[i];f.y+=f.vy*dt;f.r+=dt;
      if(f.y>by-6&&f.y<by+34&&Math.abs(f.x-s.bx)<bw/2){s.f.splice(i,1);
        if(f.v===s.q.a){addScore(10);burst(s.parts,f.x,by,'#22c55e');this.newQ(g);s.f=s.f.filter(function(z){return z.y<g.h*0.25;});}
        else{flash(T('Yuck!')+' '+ansText(s.q),'#fca5a5');burst(s.parts,f.x,by,'#ef4444');hurt();if(g.over)return;}continue;}
      if(f.y>g.h+40){s.f.splice(i,1);if(f.v===s.q.a){flash(T('You let it fall!'),'#fca5a5');hurt();if(g.over)return;}}}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_market.jpg'],g.w,g.h);
    s.f.forEach(function(f){if(ok(IMG[f.img])){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(Math.sin(f.r)*.3);ctx.drawImage(IMG[f.img],-34,-34,68,68);ctx.restore();}label(ctx,String(f.v),f.x,f.y+2,24,'#fff');});
    var bw=Math.min(180,g.w*.35);if(ok(IMG['basket.png']))ctx.drawImage(IMG['basket.png'],s.bx-bw/2,g.h-116,bw,bw*.58);drawParts(ctx,s.parts,1/60);},
  down:function(g,x){g.state.tx=x;},move:function(g,x){g.state.tx=x;},
  key:function(g,k){var s=g.state;if(k==='ArrowLeft')s.tx=Math.max(40,s.tx-90);else if(k==='ArrowRight')s.tx=Math.min(g.w-40,s.tx+90);}
};

/* 💣 Bomb Defuse */
var BOMB={id:'bomb',icon:'💣',name:'Bomb Defuse',thumb:'bomb.png',bg:'bg_space.jpg',
  desc:'Cut all three wires by answering right before the fuse burns down. Wrong answers burn the fuse faster!',
  init:function(g){var s=g.state;s.parts=[];s.n=0;this.bomb(g);},
  bomb:function(g){var s=g.state;s.n++;s.limit=Math.max(7,18-s.n);s.left=s.limit;s.cut=0;s.boom=0;this.ask(g);},
  ask:function(g){var s=g.state;s.q=makeQ(g.L);s.opts=choices(s.q,g.L,4);setQ(T('Wire')+' '+(s.cut+1)+'/3: '+qText(s.q));},
  update:function(g,dt){var s=g.state;if(s.boom>0){s.boom-=dt;if(s.boom<=0&&!g.over)this.bomb(g);return;}
    s.left-=dt;if(s.left<=0){s.boom=1.3;var cx=g.w/2,cy=g.h*.33;['#f97316','#ef4444','#fde047'].forEach(function(c){burst(s.parts,cx,cy,c);});flash('💥 BOOM!','#fca5a5');hurt();}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_space.jpg'],g.w,g.h);var cx=g.w/2,cy=g.h*.33,r=Math.min(110,g.w*.22,g.h*.17);
    if(s.boom>0){ctx.fillStyle='rgba(249,115,22,'+(s.boom/1.3*.55)+')';ctx.fillRect(0,0,g.w,g.h);label(ctx,'💥',cx,cy,90,'#fff',false);}
    else{if(ok(IMG['bomb.png']))ctx.drawImage(IMG['bomb.png'],cx-r*1.25,cy-r*1.4,r*2.5,r*2.5);
      var cols=['#ef4444','#3b82f6','#22c55e'];for(var i=0;i<3;i++){ctx.strokeStyle=cols[i];ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();var y=cy-18+i*20;
        if(i<s.cut){ctx.moveTo(cx-r*.7,y);ctx.lineTo(cx-12,y+7);ctx.moveTo(cx+12,y-7);ctx.lineTo(cx+r*.7,y);}else{ctx.moveTo(cx-r*.7,y);ctx.lineTo(cx+r*.7,y);}ctx.stroke();}
      var p=clamp(s.left/s.limit,0,1),fx=cx+r*.42,fy=cy-r*1.05,ex=fx+70*p,ey=fy-60*p;ctx.strokeStyle='#d6d3d1';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.fillStyle=Math.random()<.5?'#fde047':'#f97316';ctx.beginPath();ctx.arc(ex,ey,8+Math.random()*6,0,6.28);ctx.fill();
      label(ctx,Math.ceil(s.left)+'s',cx,cy+r*1.25,30,p>.35?'#fde68a':'#fca5a5');
      if(s.opts)choiceBtns(g,ctx,s.opts,btnsTop(g),62);}
    drawParts(ctx,s.parts,1/60);},
  choose:function(g,v){var s=g.state;if(s.boom>0)return;
    if(v===s.q.a){s.cut++;addScore(5);burst(s.parts,g.w/2,g.h*.33,'#fde047');if(s.cut>=3){addScore(20+Math.round(s.left*2));flash('✂️ '+T('Defused!'),'#bbf7d0');this.bomb(g);}else this.ask(g);}
    else{s.left=Math.max(.6,s.left-3);flash(T('The fuse burns faster!'),'#fca5a5');}},
  down:function(g,x,y){var b=hitBtn(g,x,y);if(b)this.choose(g,b.v);},
  key:function(g,k){var b=keyBtn(g,k);if(b)this.choose(g,b.v);}
};

/* 🏎️ Math Race */
var RACE={id:'race',icon:'🏎️',name:'Math Race',thumb:'car_orange.png',bg:'bg_road.jpg',
  desc:'Every right answer boosts your orange car. Beat the purple car to the finish, or lose a life. Each race gets harder.',
  init:function(g){var s=g.state;s.parts=[];s.round=0;this.start(g);},
  start:function(g){var s=g.state;s.round++;s.me=0;s.ai=0;s.boost=0;s.stall=0;s.aiv=3.2+s.round*0.8+g.L*0.15;s.fin=0;this.ask(g);},
  ask:function(g){var s=g.state;s.q=makeQ(g.L);s.opts=choices(s.q,g.L,4);setQ(T('Race')+' '+s.round+': '+qText(s.q));},
  update:function(g,dt){var s=g.state;if(s.fin>0){s.fin-=dt;if(s.fin<=0&&!g.over)this.start(g);return;}
    s.ai+=s.aiv*dt;if(s.boost>0){var d=Math.min(s.boost,45*dt);s.me+=d;s.boost-=d;}if(s.stall>0)s.stall-=dt;
    if(s.me>=100){s.fin=1.6;addScore(30+s.round*5);flash('🏁 '+T('You win!'),'#bbf7d0');burst(s.parts,g.w-80,g.h*.3,'#fbbf24');}
    else if(s.ai>=100){s.fin=1.6;flash(T('The purple car won!'),'#fca5a5');hurt();}},
  draw:function(g,ctx){var s=g.state;ctx.fillStyle='#3f6212';ctx.fillRect(0,0,g.w,g.h);var top=g.h*.1,rh=Math.min(240,g.h*.4);
    ctx.fillStyle='#374151';ctx.fillRect(0,top,g.w,rh);ctx.strokeStyle='#fde047';ctx.setLineDash([30,24]);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,top+rh/2);ctx.lineTo(g.w,top+rh/2);ctx.stroke();ctx.setLineDash([]);
    var x0=60,x1=g.w-90;for(var i=0;i<8;i++){ctx.fillStyle=i%2?'#fff':'#111';ctx.fillRect(x1+50,top+i*rh/8,14,rh/8);ctx.fillStyle=i%2?'#111':'#fff';ctx.fillRect(x1+64,top+i*rh/8,14,rh/8);}
    var cw=Math.min(120,g.w*.22);
    function car(img,p,y,wob){var x=x0+(x1-x0)*clamp(p/100,0,1);ctx.save();ctx.translate(x,y);if(wob)ctx.rotate(Math.sin(g.t*30)*.25);if(ok(IMG[img]))ctx.drawImage(IMG[img],-cw/2,-cw*.25,cw,cw*.5);ctx.restore();return x;}
    car('car_purple.png',s.ai,top+rh*.27,false);var mx=car('car_orange.png',s.me,top+rh*.73,s.stall>0);
    label(ctx,T('You'),mx,top+rh*.73+cw*.38,15,'#fff');label(ctx,T('Race')+' '+s.round,g.w/2,top+rh+30,20,'#fff');
    if(s.opts&&s.fin<=0)choiceBtns(g,ctx,s.opts,btnsTop(g),62);drawParts(ctx,s.parts,1/60);},
  choose:function(g,v){var s=g.state;if(s.fin>0||s.stall>0)return;if(v===s.q.a){s.boost+=14;addScore(5);}else{s.stall=1;flash(T('Spin out!')+' '+ansText(s.q),'#fca5a5');}this.ask(g);},
  down:function(g,x,y){var b=hitBtn(g,x,y);if(b)this.choose(g,b.v);},
  key:function(g,k){var b=keyBtn(g,k);if(b)this.choose(g,b.v);}
};

/* 🪶 Owl Flight */
var FLIGHT={id:'flight',icon:'🪶',name:'Owl Flight',thumb:'owl1.png',bg:'bg_sky.jpg',
  desc:'Tap to flap. Fly Hoot through the gap with the right answer. Hitting a post, the ground or a wrong gap costs a life.',
  init:function(g){var s=g.state;s.y=g.h*.4;s.vy=0;s.walls=[];s.parts=[];s.spawn=.8;s.inv=1.5;s.cur=null;setQ(T('Tap to fly!'));},
  wall:function(g){var s=g.state,q=makeQ(g.L),vals=shuffle([q.a].concat(wrongs(q.a,2,g.L))),top=40,usable=g.h-top-40,gh=Math.min(140,usable*.24);
    s.walls.push({x:g.w+40,q:q,gaps:vals.map(function(v,i){return {v:v,y:top+usable*(i+.5)/3};}),gh:gh,done:false});if(!s.cur)this.setCur(g);},
  setCur:function(g){var s=g.state,w=s.walls.filter(function(w){return !w.done;})[0];s.cur=w||null;if(w)setQ(qText(w.q));},
  update:function(g,dt){var s=g.state,sp=110+Math.min(110,g.t*1.1),ox=g.w*.25;if(s.inv>0)s.inv-=dt;
    s.vy+=950*dt;s.y+=s.vy*dt;if(s.y<20){s.y=20;s.vy=0;}
    if(s.y>g.h-20){if(s.inv<=0){flash(T('Splat!'),'#fca5a5');hurt();s.inv=1.5;if(g.over)return;}s.y=g.h*.4;s.vy=-250;}
    s.spawn-=dt;if(s.spawn<=0){this.wall(g);s.spawn=Math.max(2.3,3.8-g.t*.012);}
    for(var i=s.walls.length-1;i>=0;i--){var w=s.walls[i];w.x-=sp*dt;
      if(!w.done&&w.x<=ox){w.done=true;var gp=null;w.gaps.forEach(function(gg){if(Math.abs(s.y-gg.y)<w.gh/2)gp=gg;});
        if(gp&&gp.v===w.q.a){addScore(15);burst(s.parts,ox,s.y,'#fbbf24');}
        else if(s.inv<=0){flash((gp?T('Wrong gap!'):T('Bonk!'))+' '+ansText(w.q),'#fca5a5');burst(s.parts,ox,s.y,'#ef4444');hurt();s.inv=1.5;}
        this.setCur(g);if(g.over)return;}
      if(w.x<-80)s.walls.splice(i,1);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_sky.jpg'],g.w,g.h);
    s.walls.forEach(function(w){var start=0;w.gaps.forEach(function(gp){ctx.fillStyle='#92400e';ctx.fillRect(w.x-24,start,48,gp.y-w.gh/2-start);ctx.fillStyle='#b45309';ctx.fillRect(w.x-24,start,10,gp.y-w.gh/2-start);start=gp.y+w.gh/2;});
      ctx.fillStyle='#92400e';ctx.fillRect(w.x-24,start,48,g.h-start);ctx.fillStyle='#b45309';ctx.fillRect(w.x-24,start,10,g.h-start);
      w.gaps.forEach(function(gp){label(ctx,String(gp.v),w.x,gp.y,Math.min(30,w.gh*.32),w===s.cur?'#fff':'rgba(255,255,255,.75)');});});
    var ox=g.w*.25,fr=s.vy<0?1:0;ctx.save();ctx.translate(ox,s.y);ctx.rotate(clamp(s.vy/900,-.4,.6));if(s.inv>0&&Math.floor(s.inv*10)%2)ctx.globalAlpha=.4;
    if(ok(IMG['owl'+fr+'.png']))ctx.drawImage(IMG['owl'+fr+'.png'],-30,-34,60,67);ctx.restore();ctx.globalAlpha=1;drawParts(ctx,s.parts,1/60);},
  down:function(g){g.state.vy=-340;},
  key:function(g,k){if(k===' '||k==='ArrowUp'||k==='Enter')g.state.vy=-340;}
};

var GAMES=[ASTEROIDS,TRUEFALSE,CASTLE,FLIGHT,BALLOONS,SNAKE,BOMB,RACE,STONES,CATCHER,FRUITS,PIZZA,RUNNER,MEMORY];

/* ---------- arcade page (replaces the old Games hub) ---------- */
function renderArcade(c){
  var L=level();
  c.innerHTML='<div class="mxr-arcade">'
    +'<div class="mxr-hero"><div><h1>🎮 '+E(T('Matix Arcade'))+'</h1><p>'+E(T('Real games, real maths. Pick your grade and the questions grow with you.'))+' '+GAMES.length+' '+E(T('games'))+'.</p></div></div>'
    +'<div class="mxr-modes" role="tablist" aria-label="'+E(T('Where are you playing?'))+'"><button type="button" role="tab" data-m="home" aria-selected="'+(!CLS.on)+'">🏠 '+E(T('At home'))+'</button><button type="button" role="tab" data-m="class" aria-selected="'+CLS.on+'">🏫 '+E(T('In class'))+'</button></div>'
    +'<label class="mxr-lv"><span>'+E(T(CLS.on?'Pick the class':'Difficulty'))+'</span><select id="mxaLv" aria-label="'+E(T('Grade'))+'">'+LEVELS.map(function(l){return '<option value="'+l[0]+'"'+(+l[0]===L?' selected':'')+'>'+E(T(l[1]))+'</option>';}).join('')+'</select></label>'
    +(CLS.on?'<div class="mxr-class"><p>'+E(T('Two teams take turns on one screen. Pick a game: the team whose turn it is plays, and their score is added up. Most points wins!'))+'</p>'
      +'<div class="mxr-teams"><label>'+'<input id="mxaNA" maxlength="16" value="'+E(CLS.nA)+'" aria-label="'+E(T('Team A name'))+'"><b>'+CLS.A+'</b></label>'
      +'<label><input id="mxaNB" maxlength="16" value="'+E(CLS.nB)+'" aria-label="'+E(T('Team B name'))+'"><b>'+CLS.B+'</b></label></div>'
      +'<p class="mxr-turn">▶ '+E(T('Next to play'))+': <b>'+E(teamName(CLS.turn))+'</b> <button type="button" class="mxr-link" id="mxaSwap">'+E(T('switch'))+'</button> · <button type="button" class="mxr-link" id="mxaReset">'+E(T('reset scores'))+'</button></p></div>':'')
    +'<div class="mxr-grid">'+GAMES.map(function(g,i){
      return '<button type="button" class="mxr-card" data-i="'+i+'" aria-label="'+E(T(g.name)+'. '+T(g.desc))+'">'
        +'<span class="mxr-art" style="background-image:url('+IMG_DIR+g.bg+')"><img src="'+IMG_DIR+g.thumb+'" alt=""></span>'
        +'<span class="mxr-tx"><b>'+g.icon+' '+E(T(g.name))+'</b><small>'+E(T(g.desc))+'</small><em>🏆 '+E(T('Best'))+': '+best(g.id)+'</em></span></button>';
    }).join('')+'</div></div>';
  $('mxaLv').onchange=function(){ls('mx_arcade_level',this.value);};
  c.querySelectorAll('.mxr-modes button').forEach(function(b){b.onclick=function(){CLS.on=b.dataset.m==='class';saveCls();renderArcade(c);};});
  if(CLS.on){
    $('mxaNA').onchange=function(){CLS.nA=this.value.trim()||'Team A';saveCls();};
    $('mxaNB').onchange=function(){CLS.nB=this.value.trim()||'Team B';saveCls();};
    $('mxaSwap').onclick=function(){CLS.turn=CLS.turn==='A'?'B':'A';saveCls();renderArcade(c);};
    $('mxaReset').onclick=function(){CLS.A=CLS.B=0;CLS.turn='A';saveCls();renderArcade(c);};
  }
  c.querySelectorAll('.mxr-card').forEach(function(b){b.onclick=function(){startGame(GAMES[+b.dataset.i]);};});
}
W.renderGames=function(c){renderArcade(c);};
W.renderGamePlay=function(c){renderArcade(c);};
W.mxArcade={start:function(id){var g=GAMES.filter(function(x){return x.id===id;})[0];if(g)startGame(g);},games:GAMES,makeQ:makeQ};
/* Android back button closes a running game */
W.addEventListener('popstate',function(){if(G){G.pushed=false;stopGame();}});
})();
