/* =====================================================================
   Matix Arcade (1.2.0) — replaces the old Games hub with real built-in
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
  var a,b,c,d,x,y;
  function nz(lo,hi){var v=0;while(!v)v=rnd(lo,hi);return v;}
  function pm(n){return n<0?'− '+(-n):'+ '+n;}
  function par(n){return n<0?'('+n+')':String(n);}
  function co(n){return n===1?'':(n===-1?'−':String(n));}
  var SUP={2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶'};
  var G=[null,
  /* 1 */[function(){a=rnd(6,12);b=rnd(5,9);return {q:a+' + '+b,a:a+b};},
        function(){a=rnd(11,18);b=rnd(3,9);return {q:a+' − '+b,a:a-b};},
        function(){a=rnd(3,9);c=rnd(a+3,18);return {q:a+' + □ = '+c+'   □ = ?',a:c-a};},
        function(){a=rnd(2,8);b=rnd(2,8);c=rnd(2,6);return {q:a+' + '+b+' + '+c,a:a+b+c};}],
  /* 2 */[function(){a=rnd(23,58);b=rnd(17,39);return {q:a+' + '+b,a:a+b};},
        function(){a=rnd(42,95);b=rnd(18,a-5);return {q:a+' − '+b,a:a-b};},
        function(){a=pick([2,3,4,5,10]);b=rnd(4,10);return {q:a+' × '+b,a:a*b};},
        function(){a=rnd(12,49)*2;return {q:'Half of '+a,a:a/2};},
        function(){a=rnd(30,70);b=rnd(4,9);c=rnd(10,25);return {q:a+' + '+b+' − '+c,a:a+b-c};}],
  /* 3 */[function(){a=rnd(6,9);b=rnd(6,12);return {q:a+' × '+b,a:a*b};},
        function(){a=rnd(240,590);b=rnd(120,380);return {q:a+' + '+b,a:a+b};},
        function(){a=rnd(500,950);b=rnd(120,a-150);return {q:a+' − '+b,a:a-b};},
        function(){b=rnd(3,9);a=b*rnd(6,12);return {q:a+' ÷ '+b,a:a/b};},
        function(){a=rnd(2,15);b=rnd(3,9);c=rnd(3,9);return {q:a+' + '+b+' × '+c,a:a+b*c};},
        function(){a=rnd(6,9);b=rnd(6,12);return {q:a+' × □ = '+a*b+'   □ = ?',a:b};}],
  /* 4 */[function(){a=rnd(13,49);b=rnd(4,9);return {q:a+' × '+b,a:a*b};},
        function(){b=rnd(4,9);a=b*rnd(15,99);return {q:a+' ÷ '+b,a:a/b};},
        function(){a=rnd(5,19);b=rnd(4,12);c=rnd(3,9);return {q:'('+a+' + '+b+') × '+c,a:(a+b)*c};},
        function(){a=rnd(450,999);b=rnd(200,a-100);return {q:a+' − '+b,a:a-b};},
        function(){a=rnd(60,99);b=rnd(3,9);c=rnd(3,9);return {q:a+' − '+b+' × '+c,a:a-b*c};},
        function(){a=rnd(8,25);b=rnd(6,20);return {q:'Perimeter of a '+a+' by '+b+' rectangle = ?',a:2*(a+b)};}],
  /* 5 */[function(){a=rnd(12,29);b=rnd(11,25);return {q:a+' × '+b,a:a*b};},
        function(){b=rnd(6,15);a=b*rnd(12,30);return {q:a+' ÷ '+b,a:a/b};},
        function(){a=rnd(3,9);b=rnd(4,15);c=rnd(3,9);d=rnd(5,30);return {q:a+' × ('+b+' + '+c+') − '+d,a:a*(b+c)-d};},
        function(){a=pick([10,20,25,50,75]);b=pick([40,80,120,160,200,240]);return {q:a+'% of '+b,a:a*b/100};},
        function(){a=rnd(2,4);b=rnd(3,5);c=rnd(5,20);return {q:a+SUP[b]+' + '+c,a:Math.pow(a,b)+c};},
        function(){a=rnd(6,18)*2;b=rnd(5,15);return {q:'Area of a triangle, base '+a+', height '+b+' = ?',a:a*b/2};}],
  /* 6 */[function(){do{a=pick([5,15,35,45,65,75,12,8,30,60]);b=pick([40,60,80,120,140,160,200,240,360]);}while((a*b)%100);return {q:a+'% of '+b,a:a*b/100};},
        function(){a=rnd(-12,-3);b=rnd(4,9);return {q:par(a)+' × '+b,a:a*b};},
        function(){a=rnd(-20,-4);b=rnd(-15,-3);return {q:a+' − ('+b+')',a:a-b};},
        function(){a=rnd(-9,-3);b=rnd(-9,-3);c=rnd(4,20);return {q:par(a)+' × '+par(b)+' + '+c,a:a*b+c};},
        function(){a=rnd(3,9);b=rnd(3,9);c=rnd(2,9);d=rnd(5,30);return {q:a+'² + '+b+' × '+c+' − '+d,a:a*a+b*c-d};},
        function(){do{a=pick([4,6,8,9,10,12,14,15]);b=pick([4,6,8,9,10,12,14,15,18]);}while(a===b);return {q:'LCM of '+a+' and '+b+' = ?',a:a*b/gcd(a,b)};},
        function(){do{d=rnd(3,12);a=d*pick([2,3,4,5,6,7]);b=d*pick([2,3,4,5,6,7]);}while(a===b||gcd(a,b)!==d);return {q:'GCF of '+a+' and '+b+' = ?',a:d};}],
  /* 7 */[function(){a=rnd(3,9);x=rnd(-8,12);b=nz(-15,15);return {q:a+'x '+pm(b)+' = '+(a*x+b)+'   x = ?',a:x};},
        function(){a=rnd(2,7);x=rnd(-6,9);b=rnd(1,9);return {q:a+'(x + '+b+') = '+a*(x+b)+'   x = ?',a:x};},
        function(){a=rnd(2,9);x=rnd(2,9);b=rnd(2,12);return {q:'x ÷ '+a+' + '+b+' = '+(x+b)+'   x = ?',a:x*a};},
        function(){a=rnd(-12,-4);b=rnd(-9,-3);c=rnd(10,40);return {q:par(a)+' × '+par(b)+' − '+c,a:a*b-c};},
        function(){c=rnd(2,9);b=c*rnd(2,9);a=rnd(2,12);return {q:'x / '+a+' = '+b+' / '+c+'   x = ?',a:a*b/c};},
        function(){do{a=pick([40,60,80,120,160,200,240]);b=pick([10,15,20,25,30,50]);}while((a*(100+b))%100);return {q:'$'+a+' goes up '+b+'%. New price = ?',a:a*(100+b)/100};}],
  /* 8 */[function(){do{x=rnd(-6,9);a=rnd(3,8);c=rnd(1,a-1);b=rnd(-9,9);d=a*x+b-c*x;}while(!b||!d);return {q:a+'x '+pm(b)+' = '+c+'x '+pm(d)+'   x = ?',a:x};},
        function(){a=rnd(3,6);b=rnd(2,4);c=rnd(2,8);return {q:a+SUP[b]+' − '+c,a:Math.pow(a,b)-c};},
        function(){a=rnd(8,20);b=rnd(3,12);return {q:'√'+a*a+' + √'+b*b,a:a+b};},
        function(){a=rnd(2,5);b=rnd(2,6);c=rnd(2,6);return {q:a+SUP[b]+' × '+a+SUP[c]+' = '+a+'^□   □ = ?',a:b+c};},
        function(){a=rnd(-4,4);b=rnd(-4,4);x=rnd(1,5);y=rnd(-6,6);if(!y)y=3;return {q:'Slope through ('+a+', '+b+') and ('+(a+x)+', '+(b+x*y)+') = ?',a:y};},
        function(){a=rnd(2,9);b=rnd(2,9);return {q:'('+a+'x)(' +b+'x) = □x²   □ = ?',a:a*b};}],
  /* 9 */[function(){a=rnd(1,4);b=nz(-6,6);c=nz(-8,8);x=rnd(-3,4);return {q:'f(x) = '+co(a)+'x² '+pm(b)+'x '+pm(c)+'   f('+x+') = ?',a:a*x*x+b*x+c};},
        function(){a=rnd(1,4);x=rnd(1,8);y=rnd(-5,5);return {q:a+'x + y = '+(a*x+y)+',  x − y = '+(x-y)+'   x = ?',a:x};},
        function(){var r1,r2;do{r1=rnd(-6,8);r2=rnd(-6,8);}while(r1===r2||r1+r2===0||r1*r2===0);return {q:'x² '+pm(-(r1+r2))+'x '+pm(r1*r2)+' = 0   larger root = ?',a:Math.max(r1,r2)};},
        function(){a=rnd(1,4);b=nz(-9,9);c=nz(-6,6);return {q:'Discriminant of '+co(a)+'x² '+pm(b)+'x '+pm(c)+' = ?',a:b*b-4*a*c};},
        function(){a=rnd(2,5);b=rnd(-6,8);x=rnd(1,4);d=rnd(1,3);return {q:'Line through (' +x+', '+(a*x+b)+') and ('+(x+d)+', '+(a*(x+d)+b)+'): y-intercept = ?',a:b};}],
  /* 10 */[function(){c=pick([[5,12,13],[8,15,17],[7,24,25],[20,21,29],[9,40,41],[12,35,37],[6,8,10]]);d=rnd(1,3);if(Math.random()<.5)return {q:'Right triangle, legs '+c[0]*d+' and '+c[1]*d+': hypotenuse = ?',a:c[2]*d};return {q:'Right triangle, hypotenuse '+c[2]*d+' and a leg '+c[0]*d+': other leg = ?',a:c[1]*d};},
         function(){a=pick([5,6,7,8,9,10,12]);var nm={5:'pentagon',6:'hexagon',7:'heptagon',8:'octagon',9:'nonagon',10:'decagon',12:'dodecagon'};return {q:'Sum of the interior angles of a '+nm[a]+' = ?',a:(a-2)*180};},
         function(){a=pick([1,2,3]);x=rnd(-5,6);if(!x)x=2;b=-2*a*x;c=nz(-7,7);return {q:'Vertex x of y = '+co(a)+'x² '+pm(b)+'x '+pm(c)+'   x = ?',a:x};},
         function(){a=rnd(-5,12);d=rnd(2,9);b=rnd(12,30);return {q:'Sequence '+a+', '+(a+d)+', '+(a+2*d)+', …   term '+b+' = ?',a:a+(b-1)*d};},
         function(){c=pick([[3,4],[6,8],[5,12],[8,15]]);x=rnd(-4,4);y=rnd(-4,4);return {q:'Distance from ('+x+', '+y+') to ('+(x+c[0])+', '+(y-c[1])+') = ?',a:Math.round(Math.hypot(c[0],c[1]))};},
         function(){a=rnd(1,5);d=rnd(2,5);b=rnd(8,15);return {q:'Sum of the first '+b+' terms of '+a+', '+(a+d)+', '+(a+2*d)+', … = ?',a:b*(2*a+(b-1)*d)/2};}],
  /* 11 */[function(){a=pick([2,3,5,10]);b=rnd(2,a===10?4:6);return {q:'log'+(a===2?'₂':a===3?'₃':a===5?'₅':'₁₀')+' '+Math.pow(a,b)+' = ?',a:b};},
         function(){a=pick([2,3,5]);x=rnd(3,6);return {q:a+'^x = '+Math.pow(a,x)+'   x = ?',a:x};},
         function(){a=rnd(12,40);return {q:'1 + 2 + 3 + … + '+a+' = ?',a:a*(a+1)/2};},
         function(){a=rnd(6,10);b=rnd(2,4);return {q:'C('+a+', '+b+') = ?',a:(function(){var r=1;for(var i=1;i<=b;i++)r=r*(a-b+i)/i;return Math.round(r);})()};},
         function(){a=rnd(2,5);b=nz(-4,6);x=rnd(1,4);return {q:'f(x) = '+a+'x '+pm(b)+',  g(x) = x²:  f(g('+x+')) = ?',a:a*x*x+b};},
         function(){a=rnd(1,5);b=pick([2,3]);c=rnd(5,8);return {q:'Geometric: '+a+', '+a*b+', '+a*b*b+', …  term '+c+' = ?',a:a*Math.pow(b,c-1)};},
         function(){a=rnd(2,5);b=rnd(1,4);c=rnd(1,4);d=rnd(-4,-1);return {q:'Real part of ('+a+' + '+b+'i)('+c+' '+pm(d)+'i) = ?',a:a*c-b*d};}],
  /* 12 */[function(){a=rnd(1,4);b=nz(-4,5);x=rnd(1,4);return {q:'f(x) = '+co(a)+'x³ '+pm(b)+'x²   f′('+x+') = ?',a:3*a*x*x+2*b*x};},
         function(){a=rnd(2,7);return {q:'lim x→'+a+'  (x² − '+a*a+') / (x − '+a+') = ?',a:2*a};},
         function(){a=rnd(2,5);b=rnd(1,4);return {q:'∫₀^'+a+' (6x² + '+2*b+'x) dx = ?',a:2*a*a*a+b*a*a};},
         function(){a=rnd(1,3);b=nz(-3,3);x=rnd(1,3);return {q:'f(x) = '+co(a)+'x⁴ '+pm(b)+'x³   f″('+x+') = ?',a:12*a*x*x+6*b*x};},
         function(){a=rnd(2,4);b=nz(-3,3);x=rnd(0,2);var n=pick([3,4]);return {q:'f(x) = ('+a+'x '+pm(b)+')'+SUP[n]+'   f′('+x+') = ?',a:n*a*Math.pow(a*x+b,n-1)};},
         function(){a=rnd(2,6);return {q:'lim x→'+a+'  (x³ − '+a*a*a+') / (x − '+a+') = ?',a:3*a*a};}],
  /* 13 */[function(){var m=[];for(var i=0;i<9;i++)m.push(rnd(-3,4));var v=m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);return {q:'det [ '+m.slice(0,3).join(' ')+' ; '+m.slice(3,6).join(' ')+' ; '+m.slice(6).join(' ')+' ] = ?',a:v};},
         function(){a=[rnd(-4,5),rnd(-4,5),rnd(-4,5)];b=[rnd(-4,5),rnd(-4,5),rnd(-4,5)];return {q:'('+a.join(', ')+') · ('+b.join(', ')+') = ?',a:a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};},
         function(){a=rnd(2,4);b=rnd(1,5);x=rnd(1,3);y=rnd(1,4);return {q:'f(x, y) = '+a+'x²y + '+b+'y   ∂f/∂x at ('+x+', '+y+') = ?',a:2*a*x*y};},
         function(){a=rnd(1,4)*3;b=rnd(1,3)*2;c=rnd(1,3);return {q:'∫₀^'+c+' ('+a+'x² + '+b+'x) dx = ?',a:a/3*c*c*c+b/2*c*c};},
         function(){do{a=rnd(-5,6);b=rnd(-5,6);}while(a===b);c=rnd(1,5);return {q:'Largest eigenvalue of [ '+a+' '+c+' ; 0 '+b+' ] = ?',a:Math.max(a,b)};},
         function(){a=rnd(-4,5);b=rnd(-4,5);c=rnd(-4,5);d=rnd(-4,5);return {q:'(' +a+', '+b+', 0) × ('+c+', '+d+', 0): z-part = ?',a:a*d-b*c};}]
  ];
  var list=G[clamp(L,1,13)];
  var q=pick(list)();if(W.trq)q.q=W.trq(q.q);return q;
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
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
function teamName(t){var n=CLS['n'+t]||('Team '+t);return n==='Team '+t?T(n):n;}
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
    +'<div class="mxg-bigq" id="mxgBigQ" aria-hidden="true"></div><canvas id="mxgCv"></canvas><div class="mxg-end" id="mxgEnd" hidden></div><div class="mxg-msg" id="mxgMsg"></div>';
  D.body.appendChild(ov);D.body.classList.add('mxg-on');
  var pushed=had;if(!had){try{history.pushState({mxg:1},'');pushed=true;}catch(e){}}
  var cv=$('mxgCv'),ctx=cv.getContext('2d');
  G={def:def,ov:ov,cv:cv,ctx:ctx,w:0,h:0,score:0,lives:3,t:0,run:true,paused:false,raf:0,last:0,L:level(),state:{},pops:[],pushed:pushed};
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
      if(G.pops.length&&!G.paused){for(var pi=G.pops.length-1;pi>=0;pi--){var pp=G.pops[pi];pp.life-=dt;pp.y-=60*dt;if(pp.life<=0){G.pops.splice(pi,1);continue;}G.ctx.globalAlpha=clamp(pp.life*1.5,0,1);label(G.ctx,pp.t,pp.x,pp.y,28,'#fde68a');G.ctx.globalAlpha=1;}}
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
var FITC=null;
function setQ(s){var q=$('mxgQ');if(q)q.textContent=s;var b=$('mxgBigQ');if(!b)return;b.textContent=s;
  try{FITC=FITC||D.createElement('canvas').getContext('2d');var av=Math.max(120,b.clientWidth-32),mx=CLS.on?92:72;FITC.font='800 100px system-ui,sans-serif';var w=FITC.measureText(s).width||1;
    b.style.fontSize=clamp(Math.floor(100*av/w),20,mx)+'px';}catch(e){}b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');}
function flash(s,col){var m=$('mxgMsg');if(!m)return;m.textContent=s;m.style.color=col||'#fff';m.classList.remove('on');void m.offsetWidth;m.classList.add('on');}
function addScore(n){G.score=Math.max(0,G.score+n);hud();if(n>0)G.pops.push({t:'+'+n,x:G.w/2+rnd(-60,60),y:G.h*.45,life:1});}
function hurt(){G.lives--;hud();try{G.cv.classList.remove('shake');void G.cv.offsetWidth;G.cv.classList.add('shake');}catch(e){}if(navigator.vibrate)try{navigator.vibrate(60);}catch(e){}if(G.lives<=0)gameOver();}
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


/* =====================================================================
   1.2.0: seven new games, each made for certain grades (g.lv = [from, to])
   ===================================================================== */
function fmtT(h,m){return h+':'+(m<10?'0':'')+m;}
function ringBtns(g,ctx,opts,top,h){choiceBtns(g,ctx,opts,top,h);}
function addMin(h,m,d){var t=((h-1)*60+m+d)%720;if(t<0)t+=720;return [Math.floor(t/60)+1,t%60];}
function qBox(ctx,x,y,w,h){ctx.fillStyle='rgba(15,16,40,.82)';rr(ctx,x,y,w,h,20);ctx.fill();}
function limitFor(g,base,floor,rate){return Math.max(floor,base-g.t*rate);}

/* 🔟 Number Bonds (Grades 1-4) */
var BONDS={id:'bonds',icon:'🔟',name:'Number Bonds',thumb:'coin.png',bg:'bg_market.jpg',lv:[1,4],
  desc:'Tap two floating numbers that add up to the target. Wrong pair costs a heart, and the clock keeps ticking!',
  init:function(g){var s=g.state;s.parts=[];s.round=0;s.sel=null;this.round(g);},
  round:function(g){
    var s=g.state,L=g.L;s.round++;s.sel=null;
    var T0=L<=1?10:L===2?pick([10,20]):L===3?pick([20,50,100]):pick([100,500,1000]);
    var unit=T0<=20?1:T0<=100?(L<=3?5:10):(T0===1000?50:25);
    s.target=T0;var vals=[],used={};
    var pairs=L<=1?3:4;
    for(var i=0;i<pairs;i++){var k=0,a;do{a=unit*rnd(1,Math.floor(T0/unit)-1);k++;}while((used[a]||used[T0-a])&&k<30);used[a]=used[T0-a]=1;vals.push(a,T0-a);}
    for(var d=0;d<(L>=3?3:2);d++){var k2=0,v;do{v=unit*rnd(1,Math.floor(T0/unit)+(L>=3?2:0));k2++;}while((used[v]||used[T0-v])&&k2<40);used[v]=1;vals.push(v);}
    var m=Math.min(70,g.w*.075);s.bs=vals.map(function(v){return {v:v,x:rnd(m,Math.max(m+1,g.w-m)),y:rnd(m,Math.max(m+1,g.h-m*2)),vx:rnd(-60,60)||30,vy:rnd(-50,50)||25,r:m};});
    s.limit=limitFor(g,30,16,.35);s.left=s.limit;setQ(T('Make')+' '+T0+'  →  ? + ? = '+T0);
  },
  update:function(g,dt){var s=g.state;
    s.bs.forEach(function(b){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<b.r||b.x>g.w-b.r)b.vx*=-1;if(b.y<b.r||b.y>g.h-b.r)b.vy*=-1;b.x=clamp(b.x,b.r,g.w-b.r);b.y=clamp(b.y,b.r,g.h-b.r);});
    s.left-=dt;if(s.left<=0){flash(T('Time up!'),'#fca5a5');hurt();if(!g.over)this.round(g);}
    if(!s.bs.some(function(a){return s.bs.some(function(b){return a!==b&&a.v+b.v===s.target;});})){addScore(15+Math.round(s.left));flash('✨ '+T('All paired!'),'#bbf7d0');if(!g.over)this.round(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_market.jpg'],g.w,g.h);ctx.fillStyle='rgba(8,10,30,.55)';ctx.fillRect(0,0,g.w,g.h);
    timeBar(ctx,14,10,g.w-28,clamp(s.left/s.limit,0,1));
    s.bs.forEach(function(b){var on=s.sel===b;ctx.save();ctx.shadowColor=on?'#fbbf24':'#38bdf8';ctx.shadowBlur=on?30:14;
      var gr=ctx.createRadialGradient(b.x-b.r*.3,b.y-b.r*.3,b.r*.1,b.x,b.y,b.r);gr.addColorStop(0,on?'#fde68a':'#bae6fd');gr.addColorStop(1,on?'#f59e0b':'#3b82f6');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();ctx.restore();label(ctx,String(b.v),b.x,b.y,Math.round(b.r*(String(b.v).length>3?.55:.78)),'#fff');});
    drawParts(ctx,s.parts,1/60);},
  down:function(g,x,y){var s=g.state,hit=null;s.bs.forEach(function(b){if(Math.hypot(x-b.x,y-b.y)<b.r+8)hit=b;});if(!hit)return;
    if(!s.sel){s.sel=hit;return;}if(s.sel===hit){s.sel=null;return;}
    if(s.sel.v+hit.v===s.target){addScore(10);burst(s.parts,hit.x,hit.y,'#fde047');burst(s.parts,s.sel.x,s.sel.y,'#38bdf8');var a=s.sel;s.bs=s.bs.filter(function(b){return b!==a&&b!==hit;});s.sel=null;}
    else{flash(s.sel.v+' + '+hit.v+' = '+(s.sel.v+hit.v),'#fca5a5');s.sel=null;hurt();}}
};

/* ⏰ Clock Master (Grades 1-5) */
var CLOCK={id:'clock',icon:'⏰',name:'Clock Master',thumb:'coin.png',bg:'bg_table.jpg',lv:[1,5],
  desc:'Read the clock before time runs out. From o’clock and half past all the way to “what time will it be in 1 h 35 min?”',
  init:function(g){g.state.parts=[];g.state.streak=0;this.next(g);},
  next:function(g){var s=g.state,L=g.L,h=rnd(1,12),m;
    m=L<=1?pick([0,30]):L===2?pick([0,15,30,45]):L===3?rnd(0,11)*5:rnd(0,59);
    s.h=h;s.m=m;s.add=0;var ans,txt;
    if(L>=5){var dh=rnd(0,3),dm=pick([10,15,20,25,35,40,45,50]);s.add=dh*60+dm;var r=addMin(h,m,s.add);ans=fmtT(r[0],r[1]);txt=T('In')+' '+(dh?dh+' h ':'')+dm+' min '+T('it will be')+'…';}
    else{ans=fmtT(h,m);txt=T('What time is it?');}
    s.ans=ans;s.opts=[ans];var tries=0;
    while(s.opts.length<4&&tries++<60){var w=addMin(L>=5?(function(){var r2=addMin(h,m,s.add);return r2[0];})():h,L>=5?(function(){return addMin(h,m,s.add)[1];})():m,pick([-60,60,-10,10,-5,5,-30,30,-15,15,20,-20]));var t=fmtT(w[0],w[1]);if((L<=1&&w[1]%30)||(L===2&&w[1]%15)||(L===3&&w[1]%5))continue;if(s.opts.indexOf(t)<0)s.opts.push(t);}
    s.opts=shuffle(s.opts);s.limit=limitFor(g,L<=2?12:L>=5?20:14,L>=5?9:6,.08);s.left=s.limit;setQ(txt);},
  update:function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+s.ans,'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_table.jpg'],g.w,g.h);ctx.fillStyle='rgba(8,10,30,.35)';ctx.fillRect(0,0,g.w,g.h);
    var avail=btnsTop(g)-30,r=Math.min(g.w*.4,avail/2-10),cx=g.w/2,cy=14+r+10;timeBar(ctx,14,8,g.w-28,clamp(s.left/s.limit,0,1));
    ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=24;ctx.fillStyle='#fff7ed';ctx.beginPath();ctx.arc(cx,cy,r,0,6.283);ctx.fill();ctx.restore();
    ctx.lineWidth=Math.max(6,r*.07);ctx.strokeStyle='#7c3aed';ctx.beginPath();ctx.arc(cx,cy,r,0,6.283);ctx.stroke();
    for(var i=1;i<=60;i++){var a=i/60*6.283-1.5708,big=i%5===0;ctx.strokeStyle='#334155';ctx.lineWidth=big?3:1.2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*(big?.82:.9),cy+Math.sin(a)*r*(big?.82:.9));ctx.lineTo(cx+Math.cos(a)*r*.95,cy+Math.sin(a)*r*.95);ctx.stroke();}
    for(var n=1;n<=12;n++){var an=n/12*6.283-1.5708;label(ctx,String(n),cx+Math.cos(an)*r*.68,cy+Math.sin(an)*r*.68,Math.round(r*.2),'#1e293b',false);}
    function hand(ang,len,w,col){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ang-1.5708)*len,cy+Math.sin(ang-1.5708)*len);ctx.stroke();}
    hand(((s.h%12)+s.m/60)/12*6.283,r*.5,Math.max(8,r*.075),'#1e293b');hand(s.m/60*6.283,r*.76,Math.max(5,r*.05),'#ef4444');
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.arc(cx,cy,r*.06,0,6.283);ctx.fill();
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-60,cy,22,'#fbbf24');
    choiceBtns(g,ctx,s.opts,btnsTop(g),62);drawParts(ctx,s.parts,1/60);},
  pick:function(g,v){var s=g.state;if(v===s.ans){s.streak++;addScore(8+Math.round(s.left)+Math.min(10,s.streak));burst(s.parts,g.w/2,g.h*.3,'#22c55e');}else{s.streak=0;flash(T('Not quite!')+' '+s.ans,'#fca5a5');hurt();}if(!g.over)this.next(g);},
  down:function(g,x,y){var b=hitBtn(g,x,y);if(b)this.pick(g,b.v);},
  key:function(g,k){var b=keyBtn(g,k);if(b)this.pick(g,b.v);}
};

/* 📐 Angle Hunter (Grades 4-8) */
var ANGLES={id:'angles',icon:'📐',name:'Angle Hunter',thumb:'castle.png',bg:'bg_sky.jpg',lv:[4,8],
  desc:'Read angles, find the missing angle in a triangle, and crack regular polygons. Every wrong guess costs a heart.',
  init:function(g){g.state.parts=[];g.state.streak=0;this.next(g);},
  next:function(g){var s=g.state,L=g.L,k=L<=5?0:(L===6?pick([0,1,1]):L===7?pick([1,1,2]):pick([1,2,3]));s.kind=k;var ans;
    if(k===0){var d=L<=4?pick([30,45,60,90,120,135,150]):pick([20,40,50,70,80,100,110,130,140,160]);s.deg=d;ans=d;setQ(T('How big is this angle?'));}
    else if(k===1){var a=rnd(25,85),b=rnd(30,100-0);if(a+b>=165)b=rnd(30,70);s.a=a;s.b=b;ans=180-a-b;setQ(T('Missing angle in the triangle?'));}
    else if(k===2){var n=pick([5,6,8,9,10,12]);s.n=n;ans=Math.round((n-2)*180/n);var nm={5:'pentagon',6:'hexagon',8:'octagon',9:'nonagon',10:'decagon',12:'dodecagon'};setQ(T('One angle of a regular')+' '+T(nm[n])+'?');}
    else{var x=pick([10,12,15,18,20,25,30]);s.xs=[1,2,3].map(function(m){return m*x;});s.x=x;var mm=pick([2,3]);s.mm=mm;
      var pts=mm===2?[x,2*x,3*x]:[x,x*2,x*3];ans=3*x;s.lab=['x','2x','3x'];s.vals=[x,2*x,3*x];setQ('x + 2x + 3x = 180°.  '+T('Largest angle?'));}
    s.ans=ans+'°';s.opts=[s.ans];var t=0;while(s.opts.length<4&&t++<80){var w=ans+pick([-10,10,-5,5,-20,20,-15,15,30,-30,2*0+45,-45]);if(w>0&&w<180&&s.opts.indexOf(w+'°')<0)s.opts.push(w+'°');}
    s.opts=shuffle(s.opts);s.limit=limitFor(g,16,8,.08);s.left=s.limit;},
  update:function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+s.ans,'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_sky.jpg'],g.w,g.h);timeBar(ctx,14,8,g.w-28,clamp(s.left/s.limit,0,1));
    var ph=btnsTop(g)-24,cx=g.w/2,cy=ph/2+14,R=Math.min(g.w*.38,ph*.42);
    ctx.fillStyle='rgba(255,255,255,.78)';rr(ctx,cx-R*1.3,cy-R*1.1,R*2.6,R*2.2,26);ctx.fill();ctx.lineCap='round';ctx.lineJoin='round';
    if(s.kind===0){var x0=cx-R*.8,y0=cy+R*.6,a=s.deg/180*Math.PI;ctx.strokeStyle='#1e293b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x0+R*1.7,y0);ctx.lineTo(x0,y0);ctx.lineTo(x0+Math.cos(a)*R*1.7,y0-Math.sin(a)*R*1.7);ctx.stroke();
      ctx.strokeStyle='#ef4444';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x0,y0,R*.4,-a,0);ctx.stroke();label(ctx,'?',x0+Math.cos(a/2)*R*.7,y0-Math.sin(a/2)*R*.7,Math.round(R*.28),'#ef4444',false);}
    else if(s.kind===1){var A=s.a/180*Math.PI,B=s.b/180*Math.PI,len=R*2.1,xa=cx-len/2,ya=cy+R*.6,xb=xa+len,yb=ya;var Cc=Math.PI-A-B,bl=len*Math.sin(A)/Math.sin(Cc),xc=xa+Math.cos(A)*bl,yc=ya-Math.sin(A)*bl;
      ctx.strokeStyle='#1e293b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(xa,ya);ctx.lineTo(xb,yb);ctx.lineTo(xc,yc);ctx.closePath();ctx.stroke();
      label(ctx,s.a+'°',xa+R*.5,ya-R*.1,Math.round(R*.22),'#1d4ed8',false);label(ctx,s.b+'°',xb-R*.5,yb-R*.1,Math.round(R*.22),'#15803d',false);label(ctx,'?',xc,yc+R*.38,Math.round(R*.34),'#ef4444',false);}
    else if(s.kind===2){var n=s.n;ctx.strokeStyle='#1e293b';ctx.lineWidth=6;ctx.fillStyle='rgba(139,92,246,.35)';ctx.beginPath();for(var i=0;i<n;i++){var an=-Math.PI/2+i/n*6.283;var px=cx+Math.cos(an)*R,py=cy+Math.sin(an)*R;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
      var an0=-Math.PI/2;label(ctx,'?',cx+Math.cos(an0)*R*.7,cy+Math.sin(an0)*R*.7+6,Math.round(R*.3),'#ef4444',false);}
    else{var vals=s.vals;var tot=180;var ang=Math.PI;var x0b=cx-R*1.0,y0b=cy+R*.5,aa=0;ctx.lineWidth=6;var cols=['#38bdf8','#fbbf24','#f472b6'];
      for(var j=0;j<3;j++){var a1=aa/180*Math.PI,a2=(aa+vals[j])/180*Math.PI;ctx.fillStyle=cols[j];ctx.beginPath();ctx.moveTo(cx,y0b);ctx.arc(cx,y0b,R*1.15,-a2,-a1);ctx.closePath();ctx.fill();var mid=(a1+a2)/2;label(ctx,s.lab[j],cx+Math.cos(mid)*R*.75,y0b-Math.sin(mid)*R*.75,Math.round(R*.28),'#0f172a',false);aa+=vals[j];}
      ctx.strokeStyle='#1e293b';ctx.beginPath();ctx.moveTo(cx-R*1.15,y0b);ctx.lineTo(cx+R*1.15,y0b);ctx.stroke();}
    choiceBtns(g,ctx,s.opts,btnsTop(g),62);drawParts(ctx,s.parts,1/60);},
  pick:function(g,v){var s=g.state;if(v===s.ans){s.streak++;addScore(8+Math.round(s.left)+Math.min(10,s.streak));burst(s.parts,g.w/2,g.h*.3,'#22c55e');}else{s.streak=0;flash(T('Not quite!')+' '+s.ans,'#fca5a5');hurt();}if(!g.over)this.next(g);},
  down:function(g,x,y){var b=hitBtn(g,x,y);if(b)this.pick(g,b.v);},
  key:function(g,k){var b=keyBtn(g,k);if(b)this.pick(g,b.v);}
};

/* 📈 Graph Match (Grades 8-12) */
var GRAPHS={id:'graphs',icon:'📈',name:'Graph Match',thumb:'bolt.png',bg:'bg_space.jpg',lv:[8,12],
  desc:'Read slopes, intercepts, vertices and tangents straight off a graph. The grid gets trickier each grade.',
  init:function(g){g.state.parts=[];g.state.streak=0;this.next(g);},
  next:function(g){var s=g.state,L=g.L,t;s.pts=[];
    if(L<=8){t=pick(['m','b']);var m=nzr(-3,3),b=rnd(-4,4),x1=rnd(-3,0),dx=rnd(1,3);s.fn=function(x){return m*x+b;};s.pts=[[x1,m*x1+b],[x1+dx,m*(x1+dx)+b]];s.ans=t==='m'?m:b;setQ(t==='m'?T('Slope of the line?'):T('Where does the line cross the y-axis?'));}
    else if(L===9){t=pick(['x','y']);var m2=nzr(-3,3),b2=rnd(-3,3),x0=rnd(-3,3);while(!x0)x0=rnd(-3,3);m2=nzr(-2,2);b2=-m2*x0;s.fn=function(x){return m2*x+b2;};s.pts=[[0,b2],[x0,0]];
      if(t==='x'){s.ans=x0;setQ(T('x-intercept of the line?'));}else{s.ans=b2;setQ(T('y-intercept of the line?'));}}
    else if(L===10){var h=rnd(-3,3),k=rnd(-4,3),sg=Math.random()<.7?1:-1;t=pick(['h','k']);s.fn=function(x){return sg*(x-h)*(x-h)+k;};s.pts=[[h,k]];s.ans=t==='h'?h:k;setQ(t==='h'?T('x-coordinate of the vertex?'):T('y-coordinate of the vertex?'));}
    else if(L===11){var a=rnd(1,3),b3=pick([2,2,3]),x2=rnd(1,b3===3?2:3);s.fn=function(x){return a*Math.pow(b3,x);};s.pts=[[0,a]];s.ans=a*Math.pow(b3,x2);setQ('y = '+(a>1?a+'·':'')+b3+'^x   '+T('so y at x =')+' '+x2+'?');}
    else{var x3=pick([-2,-1,1,2]),sg2=Math.random()<.5?1:-1;s.fn=function(x){return sg2*x*x;};s.pts=[[x3,sg2*x3*x3]];s.ans=2*sg2*x3;setQ('y = '+(sg2<0?'−':'')+'x²   '+T('slope of the tangent at x =')+' '+x3+'?');s.tan=[x3,sg2*x3*x3,2*sg2*x3];}
    s.opts=[s.ans];var q=0;while(s.opts.length<4&&q++<60){var w=s.ans+pick([-1,1,-2,2,-3,3,4,-4]);if(s.opts.indexOf(w)<0&&w!==s.ans)s.opts.push(w);}s.opts=shuffle(s.opts);
    s.limit=limitFor(g,22,10,.1);s.left=s.limit;},
  update:function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+s.ans,'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_space.jpg'],g.w,g.h);timeBar(ctx,14,8,g.w-28,clamp(s.left/s.limit,0,1));
    var ph=btnsTop(g)-28,size=Math.min(g.w-24,ph),x0=g.w/2-size/2,y0=20,R=8,u=size/(2*R);function X(x){return x0+size/2+x*u;}function Y(y){return y0+size/2-y*u;}
    ctx.fillStyle='rgba(255,255,255,.93)';rr(ctx,x0,y0,size,size,18);ctx.fill();ctx.save();ctx.beginPath();ctx.rect(x0,y0,size,size);ctx.clip();
    for(var i=-R;i<=R;i++){ctx.strokeStyle=i===0?'#0f172a':'#cbd5e1';ctx.lineWidth=i===0?2.5:1;ctx.beginPath();ctx.moveTo(X(i),y0);ctx.lineTo(X(i),y0+size);ctx.moveTo(x0,Y(i));ctx.lineTo(x0+size,Y(i));ctx.stroke();if(i&&i%2===0){label(ctx,String(i),X(i),Y(0)+10,Math.max(9,u*.5),'#475569',false);label(ctx,String(i),X(0)+10,Y(i),Math.max(9,u*.5),'#475569',false);}}
    ctx.strokeStyle='#7c3aed';ctx.lineWidth=4;ctx.beginPath();var first=true;for(var px=x0;px<=x0+size;px+=2){var xv=(px-x0-size/2)/u,yv=s.fn(xv);var py=Y(yv);if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);}ctx.stroke();
    if(s.tan){var tx=s.tan[0],ty=s.tan[1],sl=s.tan[2];ctx.strokeStyle='#ef4444';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(tx-3),Y(ty-3*sl));ctx.lineTo(X(tx+3),Y(ty+3*sl));ctx.stroke();}
    s.pts.forEach(function(p){ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(X(p[0]),Y(p[1]),Math.max(5,u*.22),0,6.283);ctx.fill();});ctx.restore();
    choiceBtns(g,ctx,s.opts,btnsTop(g),62);drawParts(ctx,s.parts,1/60);},
  pick:function(g,v){var s=g.state;if(v===s.ans){s.streak++;addScore(10+Math.round(s.left)+Math.min(10,s.streak));burst(s.parts,g.w/2,g.h*.3,'#22c55e');}else{s.streak=0;flash(T('Not quite!')+' '+s.ans,'#fca5a5');hurt();}if(!g.over)this.next(g);},
  down:function(g,x,y){var b=hitBtn(g,x,y);if(b)this.pick(g,b.v);},
  key:function(g,k){var b=keyBtn(g,k);if(b)this.pick(g,b.v);}
};
function nzr(a,b){var v=0;while(!v)v=rnd(a,b);return v;}

/* 🔍 Factor Frenzy (Grades 4-9) */
var FACTORS={id:'factors',icon:'🔍',name:'Factor Frenzy',thumb:'balloon_purple.png',bg:'bg_sky.jpg',lv:[4,9],timer:75,
  desc:'Bubbles float up. Pop only the ones that fit the rule: multiples, factors, primes, squares… Pop a wrong one and you lose a heart.',
  init:function(g){var s=g.state;s.bs=[];s.parts=[];s.spawn=0;s.ruleT=-99;this.rule(g);},
  rule:function(g){var s=g.state,L=g.L,r;
    function isP(n){if(n<2)return false;for(var i=2;i*i<=n;i++)if(n%i===0)return false;return true;}
    var pool=[];
    if(L<=5){var k=rnd(3,9);pool.push({n:'Multiples of '+k,ok:function(v){return v%k===0;},hi:k*rnd(2,12),mx:60});}
    if(L===5||L===6){var N=pick([24,30,36,48,60]);pool.push({n:'Factors of '+N,ok:function(v){return N%v===0;},hi:null,mx:N,fac:N});}
    if(L>=6){pool.push({n:'Prime numbers',ok:isP,hi:null,mx:60});}
    if(L>=7){pool.push({n:'Perfect squares',ok:function(v){var q=Math.round(Math.sqrt(v));return q*q===v;},hi:null,mx:150});}
    if(L>=8){var a=pick([2,3,4]),b=pick([5,6,7]);pool.push({n:'Divisible by both '+a+' and '+b,ok:function(v){return v%a===0&&v%b===0;},hi:null,mx:130});}
    if(L>=9){pool.push({n:'Primes OR perfect squares',ok:function(v){var q=Math.round(Math.sqrt(v));return isP(v)||q*q===v;},hi:null,mx:120});pool.push({n:'Odd multiples of 3',ok:function(v){return v%3===0&&v%2===1;},hi:null,mx:120});}
    r=pick(pool);s.r=r;s.ruleT=g.t;setQ(T(r.n));flash(T(r.n),'#fff');},
  spawnOne:function(g){var s=g.state,r=s.r,v,tries=0,want=Math.random()<.45;
    do{v=r.fac?pick(divs(r.fac).concat(want?[]:[rnd(2,r.mx+10)])):rnd(2,r.mx);tries++;}while(tries<80&&r.ok(v)!==want);
    var rad=Math.min(52,g.w*.09);s.bs.push({v:v,x:rnd(rad,Math.max(rad+1,g.w-rad)),y:g.h+rad,r:rad,sp:50+g.t*.9+rnd(0,30),ok:r.ok(v),ph:Math.random()*6});},
  update:function(g,dt){var s=g.state;if(g.t>=this.timer){gameOver();return;}
    if(g.t-s.ruleT>15){s.bs=[];this.rule(g);}
    s.spawn-=dt;if(s.spawn<=0){this.spawnOne(g);s.spawn=Math.max(.45,1.0-g.t*.006);}
    for(var i=s.bs.length-1;i>=0;i--){var b=s.bs[i];b.y-=b.sp*dt;b.x+=Math.sin(g.t*1.6+b.ph)*28*dt;if(b.y<-b.r){if(b.ok)addScore(-2);s.bs.splice(i,1);}}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_sky.jpg'],g.w,g.h);
    s.bs.forEach(function(b){ctx.save();ctx.shadowColor='rgba(124,58,237,.6)';ctx.shadowBlur=16;var gr=ctx.createRadialGradient(b.x-b.r*.35,b.y-b.r*.35,b.r*.1,b.x,b.y,b.r);gr.addColorStop(0,'#e9d5ff');gr.addColorStop(1,'#7c3aed');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();ctx.restore();label(ctx,String(b.v),b.x,b.y,Math.round(b.r*(b.v>99?.6:.8)),'#fff');});
    drawParts(ctx,s.parts,1/60);},
  down:function(g,x,y){var s=g.state;for(var i=s.bs.length-1;i>=0;i--){var b=s.bs[i];if(Math.hypot(x-b.x,y-b.y)<b.r+10){s.bs.splice(i,1);if(b.ok){addScore(8);burst(s.parts,b.x,b.y,'#a78bfa');}else{burst(s.parts,b.x,b.y,'#ef4444');flash(b.v+' '+T('does not fit!'),'#fca5a5');hurt();}return;}}}
};
function divs(n){var r=[];for(var i=1;i<=n;i++)if(n%i===0)r.push(i);return r;}

/* 🌀 Unit Circle Dash (Grades 10-13) */
var UNIT={id:'unit',icon:'🌀',name:'Unit Circle Dash',thumb:'bolt.png',bg:'bg_space.jpg',lv:[10,13],
  desc:'Sine, cosine and tangent of the famous angles. Starts in the first quadrant, finishes in radians.',
  init:function(g){g.state.parts=[];g.state.streak=0;this.next(g);},
  next:function(g){var s=g.state,L=g.L,angs=L<=10?[0,30,45,60,90]:[0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330];
    var th=pick(angs),fn=(L>=12&&Math.random()<.4)?'tan':pick(['sin','cos']);if(fn==='tan'&&(th===90||th===270))fn='sin';
    s.th=th;s.fn=fn;s.ans=trig(fn,th);var lab=L>=13?rad(th):th+'°';setQ(fn+' '+lab+' = ?');
    var pool=['0','1','-1','1/2','-1/2','√2/2','-√2/2','√3/2','-√3/2'];if(fn==='tan')pool=['0','1','-1','√3','-√3','√3/3','-√3/3'];
    s.opts=[s.ans];var pl=shuffle(pool);for(var i=0;i<pl.length&&s.opts.length<4;i++)if(pl[i]!==s.ans)s.opts.push(pl[i]);s.opts=shuffle(s.opts);
    s.limit=limitFor(g,14,7,.08);s.left=s.limit;},
  update:function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+s.ans,'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_space.jpg'],g.w,g.h);timeBar(ctx,14,8,g.w-28,clamp(s.left/s.limit,0,1));
    var ph=btnsTop(g)-24,R=Math.min(g.w*.38,ph*.42),cx=g.w/2,cy=ph/2+14;ctx.fillStyle='rgba(15,16,40,.72)';rr(ctx,cx-R*1.35,cy-R*1.2,R*2.7,R*2.4,24);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-R*1.2,cy);ctx.lineTo(cx+R*1.2,cy);ctx.moveTo(cx,cy-R*1.1);ctx.lineTo(cx,cy+R*1.1);ctx.stroke();
    ctx.strokeStyle='#38bdf8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,R,0,6.283);ctx.stroke();
    var a=s.th/180*Math.PI,px=cx+Math.cos(a)*R,py=cy-Math.sin(a)*R;ctx.strokeStyle='#fbbf24';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.stroke();
    ctx.strokeStyle='#f472b6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R*.25,0,-a,true);ctx.stroke();
    ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(px,py,9,0,6.283);ctx.fill();
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-60,cy-R,20,'#fbbf24');
    choiceBtns(g,ctx,s.opts,btnsTop(g),62);drawParts(ctx,s.parts,1/60);},
  pick:function(g,v){var s=g.state;if(v===s.ans){s.streak++;addScore(10+Math.round(s.left)+Math.min(10,s.streak));burst(s.parts,g.w/2,g.h*.3,'#22c55e');}else{s.streak=0;flash(T('Not quite!')+' '+s.fn+' = '+s.ans,'#fca5a5');hurt();}if(!g.over)this.next(g);},
  down:function(g,x,y){var b=hitBtn(g,x,y);if(b)this.pick(g,b.v);},
  key:function(g,k){var b=keyBtn(g,k);if(b)this.pick(g,b.v);}
};
function trig(fn,th){var q=th%360,ref=q<=90?q:q<=180?180-q:q<=270?q-180:360-q;
  var S={0:'0',30:'1/2',45:'√2/2',60:'√3/2',90:'1'},C={0:'1',30:'√3/2',45:'√2/2',60:'1/2',90:'0'},Tn={0:'0',30:'√3/3',45:'1',60:'√3',90:'x'};
  var sSign=(q>180&&q<360)?-1:1,cSign=(q>90&&q<270)?-1:1,v;
  if(fn==='sin'){v=S[ref];return v==='0'?'0':(sSign<0?'-'+v:v);}
  if(fn==='cos'){v=C[ref];return v==='0'?'0':(cSign<0?'-'+v:v);}
  v=Tn[ref];return v==='0'?'0':((sSign*cSign)<0?'-'+v:v);}
function rad(th){var m={0:'0',30:'π/6',45:'π/4',60:'π/3',90:'π/2',120:'2π/3',135:'3π/4',150:'5π/6',180:'π',210:'7π/6',225:'5π/4',240:'4π/3',270:'3π/2',300:'5π/3',315:'7π/4',330:'11π/6'};return m[th];}

/* 🎯 Number Line Sniper (Grades 2-13) */
var NLINE={id:'nline',icon:'🎯',name:'Number Line Sniper',thumb:'bolt.png',bg:'bg_space.jpg',lv:[2,13],
  desc:'A marker races along the number line. Tap to stop it right on the target: whole numbers, fractions, negatives, roots, π and logs.',
  init:function(g){var s=g.state;s.parts=[];s.res=0;s.streak=0;this.next(g);},
  next:function(g){var s=g.state,L=g.L,t;
    if(L<=3){s.lo=0;s.hi=100;s.step=10;var v=pick([10,20,25,30,35,40,45,50,60,65,70,75,80,90]);t={lab:String(v),v:v};s.tol=4.5;}
    else if(L<=5){s.lo=0;s.hi=1;s.step=.1;t=pick([{lab:'1/4',v:.25},{lab:'3/4',v:.75},{lab:'1/2',v:.5},{lab:'0.3',v:.3},{lab:'0.65',v:.65},{lab:'7/10',v:.7},{lab:'1/5',v:.2},{lab:'0.85',v:.85},{lab:'2/5',v:.4},{lab:'9/10',v:.9}]);s.tol=.045;}
    else if(L<=7){s.lo=-5;s.hi=5;s.step=1;t=pick([{lab:'−2.5',v:-2.5},{lab:'3½',v:3.5},{lab:'−4',v:-4},{lab:'−1¼',v:-1.25},{lab:'−3/4',v:-.75},{lab:'2.25',v:2.25},{lab:'−3.5',v:-3.5},{lab:'4¾',v:4.75}]);s.tol=.28;}
    else if(L<=9){s.lo=0;s.hi=10;s.step=1;var n=pick([2,3,5,6,7,10,11,13,17,20,40,50]);t=pick([{lab:'√'+n,v:Math.sqrt(n)},{lab:'√'+n,v:Math.sqrt(n)},{lab:'3²/2',v:4.5},{lab:'2³/2',v:4},{lab:'√'+(n+30),v:Math.sqrt(n+30)}]);s.tol=.32;}
    else if(L<=11){s.lo=0;s.hi=10;s.step=1;t=pick([{lab:'π',v:Math.PI},{lab:'e',v:Math.E},{lab:'π²',v:Math.PI*Math.PI},{lab:'log₂ 20',v:Math.log2(20)},{lab:'e²',v:Math.E*Math.E},{lab:'2π',v:2*Math.PI},{lab:'ln 20',v:Math.log(20)},{lab:'log₁₀ 5000',v:Math.log10(5000)}]);s.tol=.3;}
    else{s.lo=-4;s.hi=4;s.step=1;t=pick([{lab:'π/2',v:Math.PI/2},{lab:'−π/3',v:-Math.PI/3},{lab:'ln 3',v:Math.log(3)},{lab:'−1/e',v:-1/Math.E},{lab:'cos 2',v:Math.cos(2)},{lab:'sin(−1)',v:Math.sin(-1)},{lab:'√(2)·π/3',v:Math.sqrt(2)*Math.PI/3},{lab:'e/2',v:Math.E/2},{lab:'−3π/4',v:-3*Math.PI/4},{lab:'ln 0.2',v:Math.log(.2)}]);s.tol=.22;}
    s.t=t;s.pos=0;s.dir=1;s.speed=.55+Math.min(.9,g.t*.012)+(L>7?.15:0);s.stopped=0;setQ(T('Stop on')+' '+t.lab);},
  update:function(g,dt){var s=g.state;if(s.stopped>0){s.stopped-=dt;if(s.stopped<=0&&!g.over)this.next(g);return;}
    s.pos+=s.dir*s.speed*dt;if(s.pos>=1){s.pos=1;s.dir=-1;}if(s.pos<=0){s.pos=0;s.dir=1;}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_space.jpg'],g.w,g.h);ctx.fillStyle='rgba(8,10,30,.45)';ctx.fillRect(0,0,g.w,g.h);
    var x0=40,x1=g.w-40,y=g.h*.58,span=s.hi-s.lo;function X(v){return x0+(v-s.lo)/span*(x1-x0);}
    var tg=X(s.t.v);ctx.fillStyle='rgba(34,197,94,.22)';ctx.fillRect(X(s.t.v-s.tol),y-70,X(s.t.v+s.tol)-X(s.t.v-s.tol),140);
    ctx.strokeStyle='#e2e8f0';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
    var n=Math.round(span/s.step);for(var i=0;i<=n;i++){var v=s.lo+i*s.step,xx=X(v);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xx,y-12);ctx.lineTo(xx,y+12);ctx.stroke();
      if(g.w>520||i%(n>12?5:1)===0){var tx=s.step<1?(Math.round(v*10)/10)+'':String(Math.round(v));label(ctx,tx.replace('-','−'),xx,y+32,16,'#cbd5e1',false);}}
    label(ctx,'🎯 '+s.t.lab,g.w/2,g.h*.28,Math.min(64,g.w*.1),'#fde68a');
    var mx=x0+s.pos*(x1-x0);ctx.fillStyle='#fbbf24';ctx.shadowColor='#fbbf24';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(mx,y-8);ctx.lineTo(mx-14,y-44);ctx.lineTo(mx+14,y-44);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    if(s.stopped>0){var val=s.lo+s.pos*span,err=Math.abs(val-s.t.v),good=err<=s.tol;ctx.fillStyle=good?'#22c55e':'#ef4444';ctx.beginPath();ctx.arc(tg,y,10,0,6.283);ctx.fill();
      label(ctx,good?(err<s.tol*.35?'🎯 '+T('Bullseye!'):'✔ '+T('Close!')):'✘ '+T('Missed'),g.w/2,g.h*.78,34,good?'#bbf7d0':'#fca5a5');}
    label(ctx,T('Tap or press space to stop'),g.w/2,g.h-24,16,'#94a3b8',false);drawParts(ctx,s.parts,1/60);},
  stop:function(g){var s=g.state;if(s.stopped>0)return;var val=s.lo+s.pos*(s.hi-s.lo),err=Math.abs(val-s.t.v);s.stopped=1.1;
    if(err<=s.tol){s.streak++;addScore(Math.round(6+14*(1-err/s.tol))+Math.min(8,s.streak));burst(s.parts,g.w/2,g.h*.58,'#22c55e');}else{s.streak=0;hurt();}},
  down:function(g){this.stop(g);},
  key:function(g,k){if(k===' '||k==='Enter')this.stop(g);}
};

/* =====================================================================
   1.2.0: In class = smart-board exercises (big problem, pen board, reveal
   the worked answer, award points to the team whose turn it is)
   ===================================================================== */
function fr(n,d){var g=gcd(n,d);n/=g;d/=g;if(d<0){n=-n;d=-d;}return d===1?String(n):n+'/'+d;}
function poly(t){var out='';t.forEach(function(p,i){var c=p[0],e=p[1];if(!c)return;var ab=Math.abs(c),body=(e===0)?String(ab):(ab===1?'':String(ab))+'x'+(e===1?'':({2:'\u00b2',3:'\u00b3',4:'\u2074',5:'\u2075'}[e]||'^'+e));
  out+=out?(c<0?' \u2212 ':' + ')+body:(c<0?'\u2212':'')+body;});return out||'0';}
var NAMES=['Mia','Omar','Lina','Sam','Noor','Leo','Zaid','Maya','Ali','Dana','Kareem','Sara'];
/* Each generator returns {q, a, steps[]} */
var BOARD=[null,
 /* 1 */[function(){var a=rnd(6,9),b=rnd(4,9),n=pick(NAMES);return {q:'Make a ten:\n'+a+' + '+b+' = ?',a:String(a+b),steps:[a+' needs '+(10-a)+' to make 10','Split '+b+' into '+(10-a)+' and '+(b-(10-a)),'10 + '+(b-(10-a))+' = '+(a+b)]};},
      function(){var a=rnd(3,9),c=rnd(a+4,18);return {q:'Fill the gap:\n'+a+' + \u25a1 = '+c,a:String(c-a),steps:['Count up from '+a+' to '+c,c+' \u2212 '+a+' = '+(c-a)]};},
      function(){var n=pick(NAMES),a=rnd(8,12),b=rnd(4,8),c=rnd(3,7);return {q:n+' has '+a+' stickers.\nGets '+b+' more, then gives '+c+' away.\nHow many now?',a:String(a+b-c),steps:[a+' + '+b+' = '+(a+b),(a+b)+' \u2212 '+c+' = '+(a+b-c)]};}],
 /* 2 */[function(){var a=rnd(24,58),b=rnd(17,39);return {q:'Add using tens and ones:\n'+a+' + '+b+' = ?',a:String(a+b),steps:['Tens: '+Math.floor(a/10)*10+' + '+Math.floor(b/10)*10+' = '+(Math.floor(a/10)+Math.floor(b/10))*10,'Ones: '+a%10+' + '+b%10+' = '+(a%10+b%10),'Together: '+(a+b)]};},
      function(){var a=rnd(52,95),b=rnd(18,a-10);return {q:'Subtract:\n'+a+' \u2212 '+b+' = ?',a:String(a-b),steps:['Count back '+Math.floor(b/10)*10+' from '+a+' = '+(a-Math.floor(b/10)*10),'Then back '+b%10+' more = '+(a-b)]};},
      function(){var a=pick([3,4,5,6]),b=rnd(3,9),n=pick(NAMES);return {q:n+' has '+a+' bags with '+b+' marbles in each.\nHow many marbles in all?',a:String(a*b),steps:[a+' groups of '+b,a+' \u00d7 '+b+' = '+a*b]};}],
 /* 3 */[function(){var a=rnd(14,39),b=rnd(3,9);return {q:'Break it apart:\n'+a+' \u00d7 '+b+' = ?',a:String(a*b),steps:[a+' = '+Math.floor(a/10)*10+' + '+a%10,Math.floor(a/10)*10+' \u00d7 '+b+' = '+Math.floor(a/10)*10*b,a%10+' \u00d7 '+b+' = '+a%10*b,'Add: '+a*b]};},
      function(){var b=rnd(3,9),q=rnd(12,19),a=b*q;return {q:'Divide:\n'+a+' \u00f7 '+b+' = ?',a:String(q),steps:['Think: '+b+' \u00d7 ? = '+a,b+' \u00d7 '+q+' = '+a]};},
      function(){var l=rnd(6,15),w=rnd(4,9);return {q:'A garden is '+l+' m by '+w+' m.\nFind the area AND the perimeter.',a:'Area '+l*w+' m\u00b2, perimeter '+2*(l+w)+' m',steps:['Area = '+l+' \u00d7 '+w+' = '+l*w,'Perimeter = 2 \u00d7 ('+l+' + '+w+') = '+2*(l+w)]};},
      function(){var d=pick([4,5,6,8]),a=rnd(1,d-3),b=rnd(1,d-a-1);return {q:'Add the fractions:\n'+a+'/'+d+' + '+b+'/'+d+' = ?',a:a+b+'/'+d+(gcd(a+b,d)>1?' = '+fr(a+b,d):''),steps:['Same denominator: keep '+d,'Add the tops: '+a+' + '+b+' = '+(a+b)]};}],
 /* 4 */[function(){var a=rnd(3,9),b=rnd(4,9),c=rnd(2,8),d=rnd(5,20);return {q:'Order of operations:\n'+a+' + '+b+' \u00d7 '+c+' \u2212 '+d+' = ?',a:String(a+b*c-d),steps:['Multiply first: '+b+' \u00d7 '+c+' = '+b*c,a+' + '+b*c+' = '+(a+b*c),(a+b*c)+' \u2212 '+d+' = '+(a+b*c-d)]};},
      function(){var a=rnd(23,48),b=rnd(6,9);return {q:'Multiply:\n'+a+' \u00d7 '+b+' = ?',a:String(a*b),steps:[Math.floor(a/10)*10+' \u00d7 '+b+' = '+Math.floor(a/10)*10*b,a%10+' \u00d7 '+b+' = '+a%10*b,'Add: '+a*b]};},
      function(){var n=pick(NAMES),b=rnd(4,9),per=rnd(6,12),extra=rnd(3,9);return {q:n+' packs '+b+' boxes of '+per+' pencils,\nthen adds '+extra+' loose pencils.\nHow many pencils?',a:String(b*per+extra),steps:[b+' \u00d7 '+per+' = '+b*per,b*per+' + '+extra+' = '+(b*per+extra)]};}],
 /* 5 */[function(){var a=pick([2,3,4,5]),b=pick([3,4,6,8]);if(a===b)b=7;var l=a*b/gcd(a,b);return {q:'Add the fractions:\n1/'+a+' + 1/'+b+' = ?',a:fr(l/a+l/b,l),steps:['Common denominator: '+l,'1/'+a+' = '+l/a+'/'+l+',  1/'+b+' = '+l/b+'/'+l,(l/a)+'/'+l+' + '+(l/b)+'/'+l+' = '+(l/a+l/b)+'/'+l+(gcd(l/a+l/b,l)>1?' = '+fr(l/a+l/b,l):'')]};},
      function(){var p,b;do{p=pick([15,35,45,12,30,60]);b=pick([40,80,120,160,200,240,360]);}while((p*b)%100);return {q:'Find '+p+'% of '+b+'.',a:String(p*b/100),steps:['10% of '+b+' = '+b/10,'1% of '+b+' = '+b/100,p+'% = '+p+' \u00d7 '+b/100+' = '+p*b/100]};},
      function(){var a=rnd(3,9),b=rnd(2,7),t=(a+b)*rnd(2,6);return {q:'Paint is mixed '+a+' : '+b+'.\nA batch has '+t+' litres in total.\nHow much of each?',a:t/(a+b)*a+' L and '+t/(a+b)*b+' L',steps:['Parts: '+a+' + '+b+' = '+(a+b),'One part = '+t+' \u00f7 '+(a+b)+' = '+t/(a+b),a+' parts = '+t/(a+b)*a+', '+b+' parts = '+t/(a+b)*b]};}],
 /* 6 */[function(){var a=rnd(3,9),b=rnd(-9,-2),c=rnd(2,6),d=rnd(5,20);return {q:'Evaluate:\n'+a+'\u00b2 + ('+b+') \u00d7 '+c+' \u2212 '+d,a:String(a*a+b*c-d),steps:['Exponent: '+a+'\u00b2 = '+a*a,'Multiply: ('+b+') \u00d7 '+c+' = '+b*c,a*a+' + ('+b*c+') \u2212 '+d+' = '+(a*a+b*c-d)]};},
      function(){var a=rnd(2,5),b=rnd(2,5),k=rnd(2,7),n1=a*k,n2=b*k;if(a===b)n2=(b+1)*k;return {q:'Simplify the ratio  '+n1+' : '+n2,a:fr(n1,n2).replace('/',' : '),steps:['GCF of '+n1+' and '+n2+' is '+gcd(n1,n2),'Divide both by '+gcd(n1,n2)]};},
      function(){var p=pick([10,15,20,25,30]),base=pick([40,60,80,120,200]);while((base*p)%100)base=pick([40,60,80,120,200]);return {q:'A $'+base+' jacket is '+p+'% off.\nWhat is the sale price?',a:'$'+(base-base*p/100),steps:['Discount = '+p+'% of '+base+' = '+base*p/100,base+' \u2212 '+base*p/100+' = '+(base-base*p/100)]};}],
 /* 7 */[function(){var a=rnd(3,8),x=rnd(-6,9),b=rnd(-12,12)||5;return {q:'Solve for x:\n'+a+'x '+(b<0?'\u2212 ':'+ ')+Math.abs(b)+' = '+(a*x+b),a:'x = '+x,steps:[(b<0?'Add ':'Subtract ')+Math.abs(b)+' from both sides:  '+a+'x = '+a*x,'Divide by '+a+':  x = '+x]};},
      function(){var a=rnd(2,6),x=rnd(-5,8),b=rnd(2,7);return {q:'Solve:\n'+a+'(x + '+b+') = '+a*(x+b),a:'x = '+x,steps:['Divide by '+a+':  x + '+b+' = '+(x+b),'Subtract '+b+':  x = '+x]};},
      function(){var n=pick(NAMES),s=rnd(2,6),a=s*3,t=rnd(2,5)*2;return {q:n+' is 3 times as old as '+pick(['Sam','Rima','Tala'])+'.\nIn '+t+' years their ages add to '+(4*s+2*t)+'.\nHow old is the younger one now?',a:String(s),steps:['Younger = x, older = 3x','In '+t+' years: (x + '+t+') + (3x + '+t+') = '+(4*s+2*t),'4x + '+2*t+' = '+(4*s+2*t)+'  \u2192  x = '+s]};}],
 /* 8 */[function(){var x,a,c,b,d;do{x=rnd(-5,8);a=rnd(4,8);c=rnd(1,a-2);b=rnd(-8,8);d=a*x+b-c*x;}while(!b||!d);return {q:'Solve for x:\n'+a+'x '+(b<0?'\u2212 ':'+ ')+Math.abs(b)+' = '+c+'x '+(d<0?'\u2212 ':'+ ')+Math.abs(d),a:'x = '+x,steps:['Subtract '+c+'x from both sides:  '+(a-c)+'x '+(b<0?'\u2212 ':'+ ')+Math.abs(b)+' = '+(d<0?'\u2212 ':'')+Math.abs(d),'Move the '+b+':  '+(a-c)+'x = '+(d-b),'x = '+(d-b)/(a-c)]};},
      function(){var p=rnd(-3,3),q=rnd(-4,4),x=rnd(1,4),y=rnd(1,4)*(Math.random()<.5?1:-1);return {q:'Find the slope and the equation of the line through\n('+p+', '+q+') and ('+(p+x)+', '+(q+x*y)+').',a:'y = '+(y===1?'':y===-1?'\u2212':y)+'x '+((q-y*p)<0?'\u2212 ':'+ ')+Math.abs(q-y*p),steps:['Slope = ('+(q+x*y)+' \u2212 '+q+') / ('+(p+x)+' \u2212 '+p+') = '+y,'y = '+y+'x + b, plug in ('+p+', '+q+')','b = '+q+' \u2212 '+y+'\u00d7'+p+' = '+(q-y*p)]};},
      function(){var t=pick([[3,4,5],[5,12,13],[8,15,17],[6,8,10]]);return {q:'A ladder '+t[2]+' m long leans on a wall.\nIts base is '+t[0]+' m from the wall.\nHow high does it reach?',a:t[1]+' m',steps:['Right triangle: a\u00b2 + b\u00b2 = c\u00b2',t[0]+'\u00b2 + h\u00b2 = '+t[2]+'\u00b2',t[0]*t[0]+' + h\u00b2 = '+t[2]*t[2]+'  \u2192  h\u00b2 = '+t[1]*t[1],'h = '+t[1]]};},
      function(){var a=rnd(2,5),b=rnd(2,6),c=rnd(2,4),d=rnd(2,7);return {q:'Expand and simplify:\n'+a+'(x + '+b+') \u2212 '+c+'(x \u2212 '+d+')',a:poly([[a-c,1],[a*b+c*d,0]]),steps:[a+'x + '+a*b+' \u2212 '+c+'x + '+c*d,'Combine x terms: '+(a-c)+'x','Combine numbers: '+(a*b+c*d)]};}],
 /* 9 */[function(){var r1,r2;do{r1=rnd(-6,7);r2=rnd(-6,7);}while(r1===r2||r1+r2===0||!r1*r2);return {q:'Solve by factoring:\nx\u00b2 '+(-(r1+r2)<0?'\u2212 ':'+ ')+Math.abs(r1+r2)+'x '+(r1*r2<0?'\u2212 ':'+ ')+Math.abs(r1*r2)+' = 0',a:'x = '+Math.min(r1,r2)+' or x = '+Math.max(r1,r2),steps:['Find two numbers: product '+r1*r2+', sum '+(-(r1+r2)),'(x '+(r1<0?'+ ':'\u2212 ')+Math.abs(r1)+')(x '+(r2<0?'+ ':'\u2212 ')+Math.abs(r2)+') = 0','x = '+r1+' or x = '+r2]};},
      function(){var x=rnd(1,6),y=rnd(-4,5),a=rnd(2,4);return {q:'Solve the system:\n'+a+'x + y = '+(a*x+y)+'\nx \u2212 y = '+(x-y),a:'x = '+x+', y = '+y,steps:['Add the equations: '+(a+1)+'x = '+(a*x+y+x-y),'x = '+x,'y = x \u2212 '+(x-y)+' = '+y]};},
      function(){var t=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]);return {q:'In a right triangle the opposite side is '+t[0]+'\nand the hypotenuse is '+t[2]+'.\nFind sin \u03b8, cos \u03b8 and tan \u03b8.',a:'sin = '+t[0]+'/'+t[2]+',  cos = '+t[1]+'/'+t[2]+',  tan = '+t[0]+'/'+t[1],steps:['Adjacent: \u221a('+t[2]+'\u00b2 \u2212 '+t[0]+'\u00b2) = '+t[1],'sin = opp/hyp, cos = adj/hyp, tan = opp/adj']};}],
 /* 10 */[function(){var a=rnd(1,3),h=rnd(-4,4),k=rnd(-5,5);return {q:'Find the vertex of the parabola\ny = '+(a===1?'':a)+'(x '+(h<=0?'+ '+(-h):'\u2212 '+h)+')\u00b2 '+(k<0?'\u2212 ':'+ ')+Math.abs(k),a:'('+h+', '+k+')',steps:['Vertex form: y = a(x \u2212 h)\u00b2 + k','h = '+h+',  k = '+k]};},
       function(){var x1=rnd(-4,2),y1=rnd(-3,3),dx=pick([3,6,5,8]),dy=pick([4,8,12,15]);var t={3:[3,4,5],6:[6,8,10],5:[5,12,13],8:[8,15,17]}[dx];return {q:'Find the distance and the midpoint\nbetween ('+x1+', '+y1+') and ('+(x1+t[0])+', '+(y1+t[1])+').',a:'distance '+t[2]+',  midpoint ('+(x1+t[0]/2)+', '+(y1+t[1]/2)+')',steps:['d = \u221a('+t[0]+'\u00b2 + '+t[1]+'\u00b2) = \u221a'+(t[0]*t[0]+t[1]*t[1])+' = '+t[2],'Midpoint = average of the x\u2019s and y\u2019s']};},
       function(){var a=rnd(2,6),d=rnd(3,7),n=rnd(15,30);return {q:'An arithmetic sequence starts '+a+', '+(a+d)+', '+(a+2*d)+', \u2026\nFind term '+n+' and the sum of the first '+n+' terms.',a:'term = '+(a+(n-1)*d)+',  sum = '+(n*(2*a+(n-1)*d)/2),steps:['a\u2099 = a + (n \u2212 1)d = '+a+' + '+(n-1)+' \u00d7 '+d+' = '+(a+(n-1)*d),'S\u2099 = n(a + a\u2099)/2 = '+n+'('+(a+(a+(n-1)*d))+')/2 = '+n*(2*a+(n-1)*d)/2]};}],
 /* 11 */[function(){var b=pick([2,3]),x=rnd(2,5),k=rnd(0,2);return {q:'Solve:\n'+b+'^(x + '+k+') = '+Math.pow(b,x+k),a:'x = '+x,steps:['Write '+Math.pow(b,x+k)+' as '+b+'^'+(x+k),'x + '+k+' = '+(x+k),'x = '+x]};},
       function(){var a=rnd(2,5),b=rnd(1,4),c=rnd(2,6);return {q:'Differentiate:\nf(x) = '+poly([[a,4],[-b,2],[c,1],[-3,0]]),a:'f\u2032(x) = '+poly([[4*a,3],[-2*b,1],[c,0]]),steps:['Power rule: d/dx x\u207f = n x\u207f\u207b\u00b9','Bring each power down and subtract 1','Constants disappear']};},
       function(){var a=rnd(2,5),k=rnd(2,4),b=pick([2,4,6]);return {q:'Find lim x\u2192'+k+' of\n(x\u00b2 \u2212 '+k*k+') / (x \u2212 '+k+')',a:String(2*k),steps:['Factor: (x \u2212 '+k+')(x + '+k+') / (x \u2212 '+k+')','Cancel: x + '+k,'Plug in x = '+k+':  '+2*k]};}],
 /* 12 */[function(){var a=pick([3,6,9]),b=pick([2,4,6]),c=rnd(2,7);return {q:'Integrate:\n\u222b ('+a+'x\u00b2 \u2212 '+b+'x + '+c+') dx',a:poly([[a/3,3],[-b/2,2],[c,1]])+' + C',steps:['Raise each power by 1, divide by the new power',a+'x\u00b2 \u2192 '+a/3+'x\u00b3,   '+b+'x \u2192 '+b/2+'x\u00b2,   '+c+' \u2192 '+c+'x','Add + C']};},
       function(){var a=rnd(2,4),b=rnd(1,5),n=pick([3,4]);return {q:'Use the chain rule:\nd/dx ('+a+'x + '+b+')'+({3:'\u00b3',4:'\u2074'}[n]),a:n*a+'('+a+'x + '+b+')'+(n-1===2?'\u00b2':'\u00b3'),steps:['Outer: '+n+'(\u2026)^'+(n-1),'Inner derivative: '+a,'Multiply: '+n*a+'('+a+'x + '+b+')^'+(n-1)]};},
       function(){var k=pick([1,2]),ang={1:'\u00bd',2:'\u221a2/2'};return {q:'Solve for 0\u00b0 \u2264 x \u2264 360\u00b0:\n'+(k===1?'2 sin x = 1':'\u221a2 sin x = 1'),a:k===1?'x = 30\u00b0 or 150\u00b0':'x = 45\u00b0 or 135\u00b0',steps:['sin x = '+ang[k],'First quadrant: '+(k===1?30:45)+'\u00b0','Second quadrant: 180\u00b0 \u2212 '+(k===1?30:45)+'\u00b0 = '+(k===1?150:135)+'\u00b0']};}],
 /* 13 */[function(){var a=rnd(1,3),b=rnd(0,3),c=rnd(0,3),d=rnd(1,3),e=rnd(1,3),f=rnd(0,2),g2=rnd(0,2),h=rnd(1,3);var AB=[[a*e+b*g2,a*f+b*h],[c*e+d*g2,c*f+d*h]];return {q:'Multiply the matrices:\n[ '+a+' '+b+' ; '+c+' '+d+' ] \u00d7 [ '+e+' '+f+' ; '+g2+' '+h+' ]',a:'[ '+AB[0][0]+' '+AB[0][1]+' ; '+AB[1][0]+' '+AB[1][1]+' ]',steps:['Row \u00d7 column for each entry','Top-left: '+a+'\u00d7'+e+' + '+b+'\u00d7'+g2+' = '+AB[0][0],'Top-right: '+a+'\u00d7'+f+' + '+b+'\u00d7'+h+' = '+AB[0][1]]};},
       function(){var a=pick([2,3,4]);return {q:'Differentiate (chain rule):\nd/dx sin('+a+'x\u00b2)',a:2*a+'x cos('+a+'x\u00b2)',steps:['Outer: cos('+a+'x\u00b2)','Inner derivative: '+2*a+'x','Multiply them']};},
       function(){var k=pick([2,3,4,5]);return {q:'Find the sum of the series\n\u03a3 (1/'+k+')\u207f  from n = 0 to \u221e',a:fr(k,k-1),steps:['Geometric, ratio r = 1/'+k,'Sum = 1 / (1 \u2212 r) = 1 / (1 \u2212 1/'+k+')','= '+fr(k,k-1)]};},
       function(){var a=rnd(2,5),b=rnd(1,3);return {q:'Eigenvalues of  [ '+a+' '+b+' ; '+b+' '+a+' ]',a:'\u03bb = '+(a+b)+' and '+(a-b),steps:['Symmetric: \u03bb = a \u00b1 b','\u03bb\u2081 = '+a+' + '+b+' = '+(a+b),'\u03bb\u2082 = '+a+' \u2212 '+b+' = '+(a-b)]};}]
];
/* word problems */
var WORDS=[null,
 /* 1-2 */[function(){var n=pick(NAMES),a=rnd(9,15),b=rnd(3,8),c=rnd(2,6);return {q:n+' has '+a+' marbles, wins '+b+' more and loses '+c+'.\nHow many marbles does '+n+' have now?',a:String(a+b-c),steps:[a+' + '+b+' = '+(a+b),(a+b)+' \u2212 '+c+' = '+(a+b-c)]};},
         function(){var n=pick(NAMES),a=rnd(3,6),b=rnd(4,9);return {q:'A shelf holds '+b+' books in each of '+a+' rows.\nHow many books are there?',a:String(a*b),steps:[a+' rows \u00d7 '+b+' books = '+a*b]};}],
 /* 3-4 */[function(){var a=rnd(4,9),b=rnd(5,12),c=rnd(3,9);return {q:'A bakery makes '+a+' trays of '+b+' rolls.\n'+c+' rolls are burnt. How many good rolls are left?',a:String(a*b-c),steps:[a+' \u00d7 '+b+' = '+a*b,a*b+' \u2212 '+c+' = '+(a*b-c)]};},
         function(){var k=rnd(4,8),n=k*rnd(5,12);return {q:n+' students sit in equal teams of '+k+'.\nHow many teams? If 2 more teams join, how many students now?',a:n/k+' teams,  '+(n+2*k)+' students',steps:[n+' \u00f7 '+k+' = '+n/k,'2 more teams = '+2*k+' more students',n+' + '+2*k+' = '+(n+2*k)]};}],
 /* 5-6 */[function(){var v=rnd(4,9)*10,t=pick([2,3,4]);return {q:'A bus drives '+v+' km every hour for '+t+' hours,\nthen another '+v/2+' km. Total distance?',a:(v*t+v/2)+' km',steps:[v+' \u00d7 '+t+' = '+v*t,v*t+' + '+v/2+' = '+(v*t+v/2)]};},
         function(){var p=pick([20,25,50]),b=pick([40,60,80,120]);return {q:'A game costs $'+b+'. It is '+p+'% off, then you pay $5 for shipping.\nWhat is the total?',a:'$'+(b-b*p/100+5),steps:['Discount: '+p+'% of '+b+' = '+b*p/100,b+' \u2212 '+b*p/100+' = '+(b-b*p/100),'Add shipping: '+(b-b*p/100+5)]};}],
 /* 7-8 */[function(){var s=rnd(10,40),d=rnd(2,9)*2;var big=(s*2+d)/2;return {q:'Two numbers add to '+(s*2+d)+' and differ by '+d+'.\nFind both numbers.',a:big+' and '+(big-d),steps:['x + y = '+(s*2+d)+',  x \u2212 y = '+d,'Add: 2x = '+(s*2+2*d)+'  \u2192  x = '+(s+d),'y = '+(s*2+d)+' \u2212 '+(s+d)+' = '+s].map(function(t,i){return t;})};},
         function(){var n=rnd(5,20);return {q:'Three consecutive integers add to '+(3*n)+'.\nWhat are they?',a:(n-1)+', '+n+', '+(n+1),steps:['x + (x+1) + (x+2) = '+3*n,'3x + 3 = '+3*n+'  \u2192  x = '+(n-1)]};}],
 /* 9-10 */[function(){var w=rnd(3,9),d=rnd(2,5);return {q:'A rectangle is '+d+' m longer than it is wide.\nIts area is '+w*(w+d)+' m\u00b2. Find the width.',a:w+' m',steps:['w(w + '+d+') = '+w*(w+d),'w\u00b2 + '+d+'w \u2212 '+w*(w+d)+' = 0','Factor: (w \u2212 '+w+')(w + '+(w+d)+') = 0','w = '+w+' (length can\u2019t be negative)']};},
          function(){var v=rnd(2,6)*10,t=rnd(2,5);return {q:'Two cars leave the same point in opposite directions\nat '+v+' km/h and '+(v+20)+' km/h.\nHow far apart after '+t+' hours?',a:(2*v+20)*t+' km',steps:['Gap grows at '+v+' + '+(v+20)+' = '+(2*v+20)+' km/h',(2*v+20)+' \u00d7 '+t+' = '+(2*v+20)*t]};}],
 /* 11-12 */[function(){var n0=rnd(2,6)*10,d=rnd(2,4),k=rnd(2,4);return {q:'A culture of '+n0+' bacteria doubles every '+d+' hours.\nHow many after '+d*k+' hours?',a:String(n0*Math.pow(2,k)),steps:['Doublings: '+d*k+' \u00f7 '+d+' = '+k,n0+' \u00d7 2^'+k+' = '+n0*Math.pow(2,k)]};},
          function(){var t=rnd(2,5),a=rnd(2,4);return {q:'A ball\u2019s height is h(t) = '+a+'t\u00b2 + 3t metres.\nFind its speed (dh/dt) at t = '+t+' s.',a:(2*a*t+3)+' m/s',steps:['h\u2032(t) = '+2*a+'t + 3','h\u2032('+t+') = '+2*a*t+' + 3 = '+(2*a*t+3)]};}],
 /* 13 */[function(){var s=rnd(4,12),r=rnd(2,5);return {q:'A square\u2019s side grows '+r+' cm/s.\nHow fast is its area growing when the side is '+s+' cm?',a:2*s*r+' cm\u00b2/s',steps:['A = s\u00b2  \u2192  dA/dt = 2s \u00b7 ds/dt','= 2 \u00d7 '+s+' \u00d7 '+r+' = '+2*s*r]};},
        function(){var P=pick([40,60,80,100,120]);return {q:'You have '+P+' m of fence for a rectangular pen.\nWhat is the largest area you can enclose?',a:(P/4)*(P/4)+' m\u00b2',steps:['2(l + w) = '+P+'  \u2192  w = '+P/2+' \u2212 l','A = l('+P/2+' \u2212 l), maximum at l = '+P/4,'A = '+P/4+' \u00d7 '+P/4+' = '+(P/4)*(P/4)]};}]
];
function bandIdx(L){return L<=2?1:L<=4?2:L<=6?3:L<=8?4:L<=10?5:L<=12?6:7;}
function trB(o){if(!W.trq)return o;o.q=W.trq(o.q);o.a=W.trq(o.a);o.steps=(o.steps||[]).map(function(x){return W.trq(x);});return o;}
function boardQ(L){var list=BOARD[clamp(L,1,13)];return trB(pick(list)());}
function wordQ(L){var list=WORDS[bandIdx(L)];return trB(pick(list)());}
/* order-it cards */
function orderSet(L){var n=L>=7?6:5,items=[],seen={};
  function add(l,v){var k=Math.round(v*1000);if(seen[k])return false;seen[k]=1;items.push({l:l,v:v});return true;}
  var guard=0;while(items.length<n&&guard++<200){
    if(L<=2){var n1=rnd(3,99);add(String(n1),n1);}
    else if(L<=4){var r=Math.random();if(r<.4){var a=rnd(100,999);add(String(a),a);}else if(r<.7){var d=pick([2,4,5,8,10]);var nn=rnd(1,d-1);add(nn+'/'+d,nn/d);}else{var dd=rnd(1,99)/10;add(String(dd),dd);}}
    else if(L<=6){var r2=Math.random();if(r2<.34){var d2=pick([2,3,4,5,8]);var n2=rnd(1,d2*2);add(n2+'/'+d2,n2/d2);}else if(r2<.67){var f=rnd(5,250)/100;add(String(f),f);}else{var p=rnd(5,190);add(p+'%',p/100);}}
    else if(L<=8){var r3=Math.random();if(r3<.4){var q=rnd(-9,9);add(String(q).replace('-','\u2212'),q);}else if(r3<.7){var n3=rnd(-12,12),d3=pick([2,3,4,5]);add((n3<0?'\u2212':'')+Math.abs(n3)+'/'+d3,n3/d3);}else{var s=rnd(2,60);add('\u221a'+s,Math.sqrt(s));}}
    else if(L<=10){var r4=Math.random();if(r4<.3){var a4=rnd(2,4),b4=rnd(2,5);add(a4+'^'+b4,Math.pow(a4,b4));}else if(r4<.6){var s4=rnd(5,90);add('\u221a'+s4,Math.sqrt(s4));}else if(r4<.8){var n5=rnd(2,15);add(n5+'\u00b2/3',n5*n5/3);}else{var lg=rnd(2,9)*5;add('log\u2082 '+lg,Math.log2(lg));}}
    else{var pool=[['\u03c0',Math.PI],['e',Math.E],['\u221a10',Math.sqrt(10)],['ln 20',Math.log(20)],['2\u00b7e\u207b\u00b9',2/Math.E],['sin 2',Math.sin(2)],['cos 3',Math.cos(3)],['log\u2082 10',Math.log2(10)],['e\u00b2',Math.E*Math.E],['\u03c0/2',Math.PI/2],['\u221a2\u00b7\u03c0',Math.SQRT2*Math.PI],['ln 0.3',Math.log(.3)],['\u22122\u03c0/3',-2*Math.PI/3],['1/e',1/Math.E]];var it=pick(pool);add(it[0],it[1]);}
  }
  return items;}

var BX={on:null};
function stopBoard(){if(!BX.on)return;var o=BX.on;BX.on=null;try{W.removeEventListener('resize',o.rs);}catch(e){}if(o.tm)clearInterval(o.tm);if(o.el.parentNode)o.el.parentNode.removeChild(o.el);D.body.classList.remove('mxg-on');var c=$('content');if(c&&c.querySelector('.mxr-arcade'))renderArcade(c);}
var EXERCISES=[
  {id:'board',icon:'\u270F\uFE0F',name:'Solve on the Board',desc:'A real worked problem for your grade. Work it out on the board with the pen, then reveal the steps.',n:8,pen:true,gen:boardQ},
  {id:'sprint',icon:'\u23F1\uFE0F',name:'Mental Math Sprint',desc:'One hard question, a ring counting down. Shout the answer, then reveal. 10 rounds.',n:10,pen:false,timer:20,gen:function(L){var q=makeQ(L);return {q:qText(q),a:String(q.a),steps:[]};}},
  {id:'word',icon:'\uD83D\uDCD6',name:'Word Problem',desc:'A story problem for your grade. Write the plan on the board, solve it, then check.',n:6,pen:true,gen:wordQ},
  {id:'order',icon:'\uD83D\uDD00',name:'Order It',desc:'Drag the cards into order, smallest to largest (or the other way round). Numbers, fractions, roots, logs\u2026',n:6,order:true}
];
function startBoard(ex){
  stopGame(true);stopBoard();
  var L=level(),round=0,N=ex.n,pts={A:0,B:0},cur=null,revealed=false;
  CLS.on=true;
  var el=D.createElement('div');el.id='mxbOv';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',T(ex.name));
  D.body.appendChild(el);D.body.classList.add('mxg-on');
  var strokes=[],color='#ffffff',size=5,cvs=null,cx=null,drawing=null,tmr=0,tm=null,ord=null,sel=-1;
  var o={el:el,rs:function(){fitCv();},tm:null};BX.on=o;
  function teamChip(t){return '<div class="mxb-team'+(CLS.turn===t?' on':'')+'"><span>'+E(teamName(t))+'</span><b>'+CLS[t]+'</b></div>';}
  function head(){return '<div class="mxb-top"><button type="button" class="mxg-ib" id="mxbX" aria-label="'+E(T('Exit'))+'">\u2715</button><div class="mxb-title"><b>'+ex.icon+' '+E(T(ex.name))+'</b><span>'+E(T('Question'))+' '+Math.min(round,N)+' / '+N+' \u00b7 '+E(T(LEVELS[L-1][1]))+'</span></div>'+teamChip('A')+teamChip('B')+'</div>';}
  function next(){
    round++;if(round>N){return finish();}revealed=false;strokes=[];sel=-1;
    if(ex.order){ord=orderSet(L);var asc=Math.random()<.7;ord.asc=asc;ord.sorted=ord.slice().sort(function(a,b){return asc?a.v-b.v:b.v-a.v;});ord.cards=shuffle(ord.slice());ord.checked=false;cur={q:T(asc?'Smallest \u2192 largest':'Largest \u2192 smallest'),a:'',steps:[]};}
    else cur=ex.gen(L);
    paint();
    if(ex.timer){tmr=ex.timer;if(tm)clearInterval(tm);tm=setInterval(function(){if(BX.on!==o){clearInterval(tm);return;}tmr--;var r=$('mxbRing');if(r)r.textContent=Math.max(0,tmr);var rg=$('mxbRingBar');if(rg)rg.style.setProperty('--p',Math.max(0,tmr/ex.timer));if(tmr<=0){clearInterval(tm);reveal();}},1000);o.tm=tm;}
  }
  function paint(){
    var h=head();
    if(ex.order){
      h+='<div class="mxb-prob"><div class="mxb-q small">'+E(cur.q)+'</div></div><div class="mxb-cards" id="mxbCards"></div><div class="mxb-ans" id="mxbAns" '+(revealed?'':'hidden')+'></div>';
    }else{
      h+='<div class="mxb-prob"><div class="mxb-q" id="mxbQ">'+E(cur.q).replace(/\n/g,'<br>')+'</div>'+(ex.timer?'<div class="mxb-ring" id="mxbRingBar"><b id="mxbRing">'+tmr+'</b></div>':'')+'</div>'
        +'<div class="mxb-ans" id="mxbAns" hidden></div>'
        +(ex.pen?'<div class="mxb-tools" role="toolbar" aria-label="'+E(T('Pen'))+'">'+['#ffffff','#fde047','#38bdf8','#f472b6','#4ade80'].map(function(c){return '<button type="button" class="mxb-c'+(c===color?' on':'')+'" data-c="'+c+'" style="background:'+c+'" aria-label="'+c+'"></button>';}).join('')
          +'<button type="button" class="mxb-t" data-s="5">\u2022</button><button type="button" class="mxb-t" data-s="12">\u25CF</button><button type="button" class="mxb-t" data-e="1">\u2B1C '+E(T('Eraser'))+'</button><button type="button" class="mxb-t" id="mxbUndo">\u21B6 '+E(T('Undo'))+'</button><button type="button" class="mxb-t" id="mxbClr">\uD83D\uDDD1 '+E(T('Clear'))+'</button></div><canvas id="mxbCv" class="mxb-cv"></canvas>':'<div class="mxb-fill"></div>');
    }
    h+='<div class="mxb-act" id="mxbAct"></div>';
    el.innerHTML=h;acts();bind();
    if(ex.order)cards();
    else if(ex.pen){cvs=$('mxbCv');cx=cvs.getContext('2d');fitCv();penBind();}
  }
  function acts(){var a=$('mxbAct');if(!a)return;var t=CLS.turn,ot=t==='A'?'B':'A';
    if(ex.order&&!revealed&&!ord.checked){a.innerHTML='<button type="button" class="mxb-b pri" id="mxbCheck">\u2714 '+E(T('Check order'))+'</button>';}
    else if(!revealed){a.innerHTML='<button type="button" class="mxb-b pri" id="mxbShow">\uD83D\uDC41 '+E(T('Show answer'))+'</button>';}
    else{a.innerHTML='<button type="button" class="mxb-b ok" id="mxbOk">\u2714 '+E(teamName(t))+' +10</button><button type="button" class="mxb-b steal" id="mxbSteal">\u21AA '+E(teamName(ot))+' '+E(T('steals'))+' +5</button><button type="button" class="mxb-b" id="mxbNo">'+E(T('No points'))+'</button>';}
    var b;b=$('mxbShow');if(b)b.onclick=reveal;b=$('mxbCheck');if(b)b.onclick=reveal;
    b=$('mxbOk');if(b)b.onclick=function(){award(t,10);};b=$('mxbSteal');if(b)b.onclick=function(){award(ot,5);};b=$('mxbNo');if(b)b.onclick=function(){award(null,0);};}
  function bind(){var x=$('mxbX');if(x)x.onclick=stopBoard;
    el.querySelectorAll('.mxb-team').forEach(function(d,i){d.onclick=function(){CLS.turn=i?'B':'A';saveCls();var tp=el.querySelector('.mxb-top');if(tp){var n=D.createElement('div');n.innerHTML=head();tp.replaceWith(n.firstChild);}bind();acts();};});}
  function award(t,n){if(t){CLS[t]+=n;pts[t]+=n;}CLS.turn=CLS.turn==='A'?'B':'A';saveCls();next();}
  function reveal(){if(revealed)return;revealed=true;if(tm){clearInterval(tm);}
    var a=$('mxbAns');
    if(ex.order){ord.checked=true;var ok2=ord.cards.every(function(c,i){return c===ord.sorted[i];});cards();a.hidden=false;a.innerHTML=(ok2?'\uD83C\uDF89 '+E(T('Perfect order!')):'\u274C '+E(T('Not quite. The right order is:')+' '+ord.sorted.map(function(c){return c.l;}).join(ord.asc?'  <  ':'  >  ')));}
    else{a.hidden=false;a.innerHTML='<div class="mxb-a">'+E(cur.a)+'</div>'+(cur.steps&&cur.steps.length?'<ol>'+cur.steps.map(function(s){return '<li>'+E(s)+'</li>';}).join('')+'</ol>':'');}
    acts();}
  function finish(){if(tm)clearInterval(tm);var w=pts.A===pts.B?T('It\u2019s a tie!'):teamName(pts.A>pts.B?'A':'B')+' '+T('wins this round!');
    el.innerHTML=head()+'<div class="mxb-end"><div class="mxg-big">\uD83C\uDFC6</div><h2>'+E(w)+'</h2><div class="mxg-teams"><div class="'+(pts.A>=pts.B?'lead':'')+'"><span>'+E(teamName('A'))+'</span><b>'+pts.A+'</b></div><div class="'+(pts.B>pts.A?'lead':'')+'"><span>'+E(teamName('B'))+'</span><b>'+pts.B+'</b></div></div>'
      +'<p>'+E(T('Total this class'))+': '+E(teamName('A'))+' '+CLS.A+' \u00b7 '+E(teamName('B'))+' '+CLS.B+'</p><div class="mxg-btns"><button type="button" class="mxb-b pri" id="mxbAgain">\u21BB '+E(T('Play again'))+'</button><button type="button" class="mxb-b" id="mxbBack">'+E(T('Pick another exercise'))+'</button></div></div>';
    bind();$('mxbAgain').onclick=function(){round=0;pts={A:0,B:0};next();};$('mxbBack').onclick=stopBoard;}
  /* pen */
  function fitCv(){if(!cvs)return;var r=cvs.getBoundingClientRect(),dpr=Math.min(2,W.devicePixelRatio||1);cvs.width=Math.round(r.width*dpr);cvs.height=Math.round(r.height*dpr);cx.setTransform(dpr,0,0,dpr,0,0);redraw();}
  function redraw(){if(!cx)return;var r=cvs.getBoundingClientRect();cx.clearRect(0,0,r.width,r.height);cx.lineCap='round';cx.lineJoin='round';
    strokes.forEach(function(st){cx.strokeStyle=st.c==='erase'?'#0f2a1e':st.c;cx.lineWidth=st.w;cx.beginPath();st.p.forEach(function(p,i){i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]);});if(st.p.length===1)cx.lineTo(st.p[0][0]+.1,st.p[0][1]);cx.stroke();});}
  function penBind(){
    function pt(e){var r=cvs.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
    cvs.addEventListener('pointerdown',function(e){e.preventDefault();try{cvs.setPointerCapture(e.pointerId);}catch(_){}drawing={c:color,w:color==='erase'?34:size,p:[pt(e)]};strokes.push(drawing);redraw();});
    cvs.addEventListener('pointermove',function(e){if(!drawing)return;drawing.p.push(pt(e));redraw();});
    var end=function(){drawing=null;};cvs.addEventListener('pointerup',end);cvs.addEventListener('pointercancel',end);
    el.querySelectorAll('.mxb-c').forEach(function(b){b.onclick=function(){color=b.dataset.c;el.querySelectorAll('.mxb-c,.mxb-t[data-e]').forEach(function(x){x.classList.remove('on');});b.classList.add('on');};});
    el.querySelectorAll('.mxb-t[data-s]').forEach(function(b){b.onclick=function(){size=+b.dataset.s;if(color==='erase')color='#ffffff';};});
    var er=el.querySelector('.mxb-t[data-e]');if(er)er.onclick=function(){color='erase';el.querySelectorAll('.mxb-c').forEach(function(x){x.classList.remove('on');});er.classList.add('on');};
    $('mxbUndo').onclick=function(){strokes.pop();redraw();};$('mxbClr').onclick=function(){strokes=[];redraw();};}
  /* order cards: tap two to swap, or drag */
  function cards(){var box=$('mxbCards');if(!box)return;box.innerHTML='';
    ord.cards.forEach(function(c,i){var d=D.createElement('div');d.className='mxb-card'+(sel===i?' sel':'')+(ord.checked?(c===ord.sorted[i]?' good':' bad'):'');d.setAttribute('role','button');d.setAttribute('tabindex','0');d.dataset.i=i;
      d.innerHTML='<span>'+E(c.l)+'</span>'+(ord.checked?'<small>'+(Math.round(c.v*1000)/1000)+'</small>':'');box.appendChild(d);});
    if(ord.checked)return;
    var drag=null;
    box.querySelectorAll('.mxb-card').forEach(function(d){
      d.addEventListener('pointerdown',function(e){e.preventDefault();try{d.setPointerCapture(e.pointerId);}catch(_){}drag={d:d,i:+d.dataset.i,x0:e.clientX,y0:e.clientY,moved:false};});
      d.addEventListener('pointermove',function(e){if(!drag||drag.d!==d)return;var dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;if(Math.abs(dx)+Math.abs(dy)>8)drag.moved=true;if(drag.moved){d.style.transform='translate('+dx+'px,'+dy+'px) scale(1.08)';d.style.zIndex=5;}});
      d.addEventListener('pointerup',function(e){if(!drag||drag.d!==d)return;var dr=drag;drag=null;
        if(dr.moved){var kids=[].slice.call(box.children),best=dr.i,bd=1e9;kids.forEach(function(k,j){var r=k.getBoundingClientRect(),dd=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));if(dd<bd){bd=dd;best=j;}});
          var it=ord.cards.splice(dr.i,1)[0];ord.cards.splice(best,0,it);sel=-1;cards();}
        else{if(sel<0)sel=dr.i;else if(sel===dr.i)sel=-1;else{var t=ord.cards[sel];ord.cards[sel]=ord.cards[dr.i];ord.cards[dr.i]=t;sel=-1;}cards();}});});
  }
  next();
}

PIZZA.lv=[2,9];
var GAMES=[BONDS,CLOCK,NLINE,ANGLES,FACTORS,GRAPHS,UNIT,ASTEROIDS,TRUEFALSE,CASTLE,FLIGHT,BALLOONS,SNAKE,BOMB,RACE,STONES,CATCHER,FRUITS,PIZZA,RUNNER,MEMORY];
var SHOWALL=false;

/* ---------- arcade page (replaces the old Games hub) ---------- */
function gradeTag(g){var lv=g.lv||[1,13];if(lv[0]===1&&lv[1]===13)return T('All grades');
  var fr=W.mxLang&&W.mxLang.get()==='fr',a=fr?T(LEVELS[lv[0]-1][1]):LEVELS[lv[0]-1][1].replace('Grade ',''),b=fr?T(LEVELS[lv[1]-1][1]):LEVELS[lv[1]-1][1].replace('Grade ','');
  return (fr?'':T('Grades')+' ')+a+(a===b?'':'\u2013'+b);}
function fits(g,L){var lv=g.lv||[1,13];return L>=lv[0]&&L<=lv[1];}
function renderArcade(c){
  var L=level(),mine=GAMES.filter(function(g){return fits(g,L);}),shown=SHOWALL?GAMES:mine;
  function card(g,i,isNew){
    return '<button type="button" class="mxr-card'+(fits(g,L)?'':' dim')+'" data-i="'+i+'" aria-label="'+E(T(g.name)+'. '+T(g.desc))+'">'
      +'<span class="mxr-art" style="background-image:url('+IMG_DIR+g.bg+')"><img src="'+IMG_DIR+g.thumb+'" alt=""><i class="mxr-gr">'+E(gradeTag(g))+'</i>'+(isNew?'<i class="mxr-new">NEW</i>':'')+'</span>'
      +'<span class="mxr-tx"><b>'+g.icon+' '+E(T(g.name))+'</b><small>'+E(T(g.desc))+'</small><em>🏆 '+E(T('Best'))+': '+best(g.id)+'</em></span></button>';}
  var NEWIDS={bonds:1,clock:1,nline:1,angles:1,factors:1,graphs:1,unit:1};
  c.innerHTML='<div class="mxr-arcade">'
    +'<div class="mxr-hero"><div><h1>🎮 '+E(T('Matix Arcade'))+'</h1><p>'+E(T('Real games, real maths. Pick your grade and the games and questions are made for it.'))+' '+GAMES.length+' '+E(T('games'))+', '+EXERCISES.length+' '+E(T('smart-board exercises'))+'.</p></div></div>'
    +'<div class="mxr-modes" role="tablist" aria-label="'+E(T('Where are you playing?'))+'"><button type="button" role="tab" data-m="home" aria-selected="'+(!CLS.on)+'">🏠 '+E(T('At home'))+'</button><button type="button" role="tab" data-m="class" aria-selected="'+CLS.on+'">🏫 '+E(T('In class'))+'</button></div>'
    +'<label class="mxr-lv"><span>'+E(T(CLS.on?'Pick the class':'Difficulty'))+'</span><select id="mxaLv" aria-label="'+E(T('Grade'))+'">'+LEVELS.map(function(l){return '<option value="'+l[0]+'"'+(+l[0]===L?' selected':'')+'>'+E(T(l[1]))+'</option>';}).join('')+'</select></label>'
    +(CLS.on?'<div class="mxr-class"><p>'+E(T('Class mode is for the smart board. Pick an exercise below: a big problem, a pen board for working it out, and the worked answer to reveal. Two teams take turns and the points add up.'))+'</p>'
      +'<div class="mxr-teams"><label>'+'<input id="mxaNA" maxlength="16" value="'+E(teamName('A'))+'" aria-label="'+E(T('Team A name'))+'"><b>'+CLS.A+'</b></label>'
      +'<label><input id="mxaNB" maxlength="16" value="'+E(teamName('B'))+'" aria-label="'+E(T('Team B name'))+'"><b>'+CLS.B+'</b></label></div>'
      +'<p class="mxr-turn">▶ '+E(T('Next to play'))+': <b>'+E(teamName(CLS.turn))+'</b> <button type="button" class="mxr-link" id="mxaSwap">'+E(T('switch'))+'</button> · <button type="button" class="mxr-link" id="mxaReset">'+E(T('reset scores'))+'</button></p></div>'
      +'<h2 class="mxr-h">✏️ '+E(T('Smart-board exercises'))+'</h2><div class="mxr-grid mxr-ex">'+EXERCISES.map(function(x,i){return '<button type="button" class="mxr-card mxr-exc" data-x="'+i+'"><span class="mxr-exi">'+x.icon+'</span><span class="mxr-tx"><b>'+E(T(x.name))+'</b><small>'+E(T(x.desc))+'</small></span></button>';}).join('')+'</div>'
      +'<h2 class="mxr-h">🎮 '+E(T('Team games'))+'</h2>':'')
    +'<div class="mxr-filter"><span>'+(SHOWALL?GAMES.length+' '+E(T('games')):mine.length+' '+E(T('games for')+' '+T(LEVELS[L-1][1])))+'</span> <button type="button" class="mxr-link" id="mxaAll">'+E(T(SHOWALL?'Only my grade':'Show all games'))+'</button></div>'
    +'<div class="mxr-grid">'+shown.map(function(g){return card(g,GAMES.indexOf(g),NEWIDS[g.id]);}).join('')+'</div></div>';
  $('mxaLv').onchange=function(){ls('mx_arcade_level',this.value);renderArcade(c);};
  $('mxaAll').onclick=function(){SHOWALL=!SHOWALL;renderArcade(c);};
  c.querySelectorAll('.mxr-modes button').forEach(function(b){b.onclick=function(){CLS.on=b.dataset.m==='class';saveCls();renderArcade(c);};});
  if(CLS.on){
    $('mxaNA').onchange=function(){CLS.nA=this.value.trim()||'Team A';saveCls();};
    $('mxaNB').onchange=function(){CLS.nB=this.value.trim()||'Team B';saveCls();};
    $('mxaSwap').onclick=function(){CLS.turn=CLS.turn==='A'?'B':'A';saveCls();renderArcade(c);};
    $('mxaReset').onclick=function(){CLS.A=CLS.B=0;CLS.turn='A';saveCls();renderArcade(c);};
    c.querySelectorAll('.mxr-exc').forEach(function(b){b.onclick=function(){startBoard(EXERCISES[+b.dataset.x]);};});
  }
  c.querySelectorAll('.mxr-card[data-i]').forEach(function(b){b.onclick=function(){startGame(GAMES[+b.dataset.i]);};});
}
W.renderGames=function(c){renderArcade(c);};
W.addEventListener('mxlang',function(){if(G||BX.on)return;var c=$('content');if(c&&c.querySelector('.mxr-arcade'))renderArcade(c);});
W.renderGamePlay=function(c){renderArcade(c);};
W.mxArcade={start:function(id){var g=GAMES.filter(function(x){return x.id===id;})[0];if(g)startGame(g);},games:GAMES,makeQ:makeQ};
/* Android back button closes a running game */
W.addEventListener('popstate',function(){if(G){G.pushed=false;stopGame();}});
})();
