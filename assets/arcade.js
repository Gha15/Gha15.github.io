/* =====================================================================
   Matix Arcade (1.6, ARCADE_VERSION 16) — replaces the old Games hub with real built-in
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
/* ARCADE_VERSION: bump it whenever games change. The app compares it with the website's
   /arcade/version.json and loads the newer arcade straight from the website. */
var ARCADE_VERSION=21;
var IMG_DIR=(function(){try{var s=(D.currentScript&&D.currentScript.src)||'',m=s.match(/^(https?:\/\/[^\/]*matixthemathclub\.com)\//);if(m)return m[1]+'/arcade/img/';}catch(e){}
  return W.MX_ARCADE_IMG||'/arcade/img/';})();

/* ---------- images ---------- */
var IMG={},IMG_LIST=['bg_space.jpg','ship.png','asteroid0.png','asteroid1.png','asteroid2.png','bg_sky.jpg','balloon_red.png','balloon_blue.png','balloon_green.png','balloon_yellow.png','balloon_purple.png','balloon_pink.png',
  'bg_market.jpg','basket.png','fruit_apple.png','fruit_orange.png','fruit_watermelon.png','fruit_lemon.png','fruit_grapes.png','pizza.png','bg_table.jpg','owl0.png','owl1.png','bg_road.jpg','gate.png','coin.png','card_back.png','card_front.png','heart.png','bomb.png','castle.png','monster0.png','monster1.png','monster2.png','car_orange.png','car_purple.png','stone.png','snake.png','bolt.png','bg_ocean.jpg','bg_forest.jpg','fish_orange.png','fish_blue.png','star.png','gem.png'];
/* Backgrounds come in five screen shapes (p 9:16, t 3:4, s 1:1, w 16:9, u 21:9: see tools/make-backgrounds.py).
   The one closest to the game's screen is used, and it is swapped if you rotate the device or resize the window. */
var SHAPES=[['p',9/16],['t',3/4],['s',1],['w',16/9],['u',21/9]],BGK='';
function shapeKey(){var w=W.innerWidth||1280,h=Math.max(200,(W.innerHeight||720)-130),r=Math.log(w/h),best='w',bd=9;
  SHAPES.forEach(function(s){var d=Math.abs(r-Math.log(s[1]));if(d<bd){bd=d;best=s[0];}});return best;}
function bgFile(n,k){return /^bg_/.test(n)?n.replace(/\.jpg$/,'_'+k+'.jpg'):n;}
function loadOne(n,k,done){var im=new Image();im.onload=function(){IMG[n]=im;done();};
  im.onerror=function(){if(bgFile(n,k)!==n){var fb=new Image();fb.onload=fb.onerror=function(){IMG[n]=fb;done();};fb.src=IMG_DIR+n;}else{IMG[n]=im;done();}};
  im.src=IMG_DIR+bgFile(n,k);}
function loadImages(cb,def){
  var left=0,k=BGK=shapeKey(),names=def&&def.themed?def.assets.concat(['heart.png']):IMG_LIST;
  if(def&&def.classOnly){var wd=classWorld(def,level())[0];names=names.concat(['bg_'+wd+'.jpg','sp_'+wd+'.png']);}
  names.forEach(function(n){
    if(IMG[n])return;left++;
    loadOne(n,k,function(){left--;if(!left)cb();});
  });
  if(!left)cb();
}
function swapBackgrounds(){var k=shapeKey();if(k===BGK)return;BGK=k;
  Object.keys(IMG).forEach(function(n){if(/^bg_/.test(n)){var im=new Image();im.onload=function(){IMG[n]=im;};im.src=IMG_DIR+bgFile(n,k);}});}
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
var CLS=(function(){var d={on:false,turn:'A',A:0,B:0,nA:'Team A',nB:'Team B',sub:'team'};try{var v=JSON.parse(ls('mx_arcade_class')||'null');if(v)for(var k in d)if(v[k]!==undefined)d[k]=v[k];}catch(e){}return d;})();
function saveCls(){ls('mx_arcade_class',JSON.stringify(CLS));}
function teamName(t){var n=CLS['n'+t]||('Team '+t);return n==='Team '+t?T(n):n;}
function best(id){return parseInt(ls('mx_arcade_best_'+id)||'0',10)||0;}
function setBest(id,v){if(v>best(id))ls('mx_arcade_best_'+id,String(v));}
function startGame(def,topic){
  TOPIC=topic||null;
  var had=!!(G&&G.pushed);if(G)G.pushed=false;
  stopGame(true);
  var ov=D.createElement('div');ov.id='mxgOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',T(def.name));
  ov.innerHTML='<div class="mxg-hud"><button type="button" class="mxg-ib" id="mxgX" aria-label="'+E(T('Exit game'))+'">✕</button>'
    +'<div class="mxg-tt"><b>'+def.icon+' '+E(gName(def,level()))+(topic?' \u00b7 '+E(lsnName(topic)):'')+(def.versus?' \u00b7 '+E(teamName('A'))+' vs '+E(teamName('B')):(CLS.on&&!def.board?' \u00b7 '+E(teamName(CLS.turn)):''))+'</b><span id="mxgQ" aria-live="polite"></span></div>'
    +'<div class="mxg-stat"><span id="mxgLives" aria-label="'+E(T('Lives'))+'"></span><span class="mxg-sc" id="mxgScore">0</span></div>'
    +'<button type="button" class="mxg-ib" id="mxgPause" aria-label="'+E(T('Pause'))+'">⏸</button></div>'
    +'<div class="mxg-bigq" id="mxgBigQ" aria-hidden="true"></div><canvas id="mxgCv"></canvas><div class="mxg-end" id="mxgEnd" hidden></div><div class="mxg-msg" id="mxgMsg"></div>';
  D.body.appendChild(ov);D.body.classList.add('mxg-on');
  var pushed=had;if(!had){try{history.pushState({mxg:1},'');pushed=true;}catch(e){}}
  var cv=$('mxgCv'),ctx=cv.getContext('2d');
  G={def:def,ov:ov,cv:cv,ctx:ctx,w:0,h:0,score:0,lives:3,t:0,run:true,paused:false,raf:0,last:0,L:level(),state:{},pops:[],pushed:pushed};
  if(TOPIC)G.L=Math.min(TOPIC.lv[1],Math.max(TOPIC.lv[0],G.L));
  else if(def.board)G.L=Math.min(def.lv[1],Math.max(def.lv[0],G.L));
  function size(){swapBackgrounds();var r=cv.getBoundingClientRect(),dpr=Math.min(2,W.devicePixelRatio||1);G.bh=Math.round(clamp(r.height*.11,58,CLS.on?112:90));G.w=r.width;G.h=r.height-G.bh;cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(def.resize)def.resize(G);}
  G.size=size;W.addEventListener('resize',size);
  $('mxgX').onclick=function(){stopGame();};
  $('mxgPause').onclick=function(){G.paused=!G.paused;this.textContent=G.paused?'▶':'⏸';this.setAttribute('aria-label',T(G.paused?'Resume':'Pause'));if(!G.paused){G.last=performance.now();}};
  function pt(e){var r=cv.getBoundingClientRect();var p=e.touches?e.touches[0]||e.changedTouches[0]:e;return {x:p.clientX-r.left,y:p.clientY-r.top-(G&&G.bh||0)};}
  cv.addEventListener('pointerdown',function(e){if(G&&!G.paused&&def.down){var p=pt(e);if(p.y<0)return;def.down(G,p.x,p.y);}});
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
      G.ctx.save();G.ctx.translate(0,G.bh);def.draw(G,G.ctx);
      if(G.pops.length&&!G.paused){for(var pi=G.pops.length-1;pi>=0;pi--){var pp=G.pops[pi];pp.life-=dt;pp.y-=60*dt;if(pp.life<=0){G.pops.splice(pi,1);continue;}G.ctx.globalAlpha=clamp(pp.life*1.5,0,1);label(G.ctx,pp.t,pp.x,pp.y,28,'#fde68a');G.ctx.globalAlpha=1;}}
      if(G.paused){G.ctx.fillStyle='rgba(0,0,0,.45)';G.ctx.fillRect(0,0,G.w,G.h);label(G.ctx,T('Paused'),G.w/2,G.h/2,40,'#fff');}
      G.ctx.restore();drawBanner(G);
      G.raf=requestAnimationFrame(loop);
    };
    G.raf=requestAnimationFrame(loop);
    try{ov.focus();}catch(e){}
  },def);
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
/* the equation is drawn inside the game screen (a band at the top of the canvas), on two lines if it is long */
function setQ(s){s=String(s).replace(/\?\s*=\s*\?$/,'?');var q=$('mxgQ');if(q)q.textContent=s;if(G){G.qText=s;G.qAt=performance.now();}}
function drawBanner(g){var ctx=g.ctx,w=g.w,bh=g.bh,t=g.qText||'',F='system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
  var gr=ctx.createLinearGradient(0,0,0,bh);gr.addColorStop(0,'#1e1b4b');gr.addColorStop(1,'#0f1028');ctx.fillStyle=gr;ctx.fillRect(0,0,w,bh);
  ctx.fillStyle='rgba(167,139,250,.6)';ctx.fillRect(0,bh-3,w,3);if(!t)return;
  var pop=clamp((performance.now()-(g.qAt||0))/280,0,1),av=w-28,lines=[t],size;
  ctx.font='900 100px '+F;var tw=ctx.measureText(t).width||1;size=Math.min(bh*.62,100*av/tw);
  if(size<bh*.4&&t.indexOf(' ')>0){var mid=t.length/2,best=-1,bd=1e9;for(var i=0;i<t.length;i++)if(t[i]===' '&&Math.abs(i-mid)<bd){bd=Math.abs(i-mid);best=i;}
    lines=[t.slice(0,best),t.slice(best+1)];var mw=Math.max(ctx.measureText(lines[0]).width,ctx.measureText(lines[1]).width)||1;size=Math.min(bh*.4,100*av/mw);}
  ctx.save();ctx.translate(w/2,bh/2-1);var sc=.92+.08*pop;ctx.scale(sc,sc);ctx.globalAlpha=.4+.6*pop;ctx.font='900 '+size+'px '+F;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='rgba(251,191,36,.5)';ctx.shadowBlur=16;ctx.fillStyle='#fde68a';
  lines.forEach(function(l,i){ctx.fillText(l,0,lines.length===1?0:(i-.5)*size*1.08);});ctx.restore();}
function flash(s,col){var m=$('mxgMsg');if(!m)return;m.textContent=s;m.style.color=col||'#fff';m.classList.remove('on');void m.offsetWidth;m.classList.add('on');}
function addScore(n){G.score=Math.max(0,G.score+n);hud();if(n>0)G.pops.push({t:'+'+n,x:G.w/2+rnd(-60,60),y:G.h*.45,life:1});}
function hurt(){G.lives--;hud();try{G.cv.classList.remove('shake');void G.cv.offsetWidth;G.cv.classList.add('shake');}catch(e){}if(navigator.vibrate)try{navigator.vibrate(60);}catch(e){}if(G.lives<=0)gameOver();}
function gameOver(){
  if(!G||G.over)return;G.over=true;G.paused=true;
  if(G.def.versus){var wd=G.def,wn=G.winner;if(wn){CLS[wn]+=1;saveCls();}
    var endv=$('mxgEnd');endv.hidden=false;
    endv.innerHTML='<div class="mxg-card"><div class="mxg-big">\uD83C\uDFC6</div><h2>'+(wn?E(teamName(wn))+' '+E(T('wins!')):E(T('Game over')))+'</h2>'
      +'<div class="mxg-teams"><div class="'+(CLS.A>=CLS.B?'lead':'')+'"><span>'+E(teamName('A'))+'</span><b>'+CLS.A+'</b></div><div class="'+(CLS.B>CLS.A?'lead':'')+'"><span>'+E(teamName('B'))+'</span><b>'+CLS.B+'</b></div></div>'
      +'<div class="mxg-btns"><button type="button" class="mxm-btn pri" id="mxgAgain">\u21BB '+E(T('Rematch'))+'</button><button type="button" class="mxm-btn sec" id="mxgQuit">'+E(T('Pick another game'))+'</button></div></div>';
    $('mxgAgain').onclick=function(){startGame(wd,TOPIC);};$('mxgQuit').onclick=function(){stopGame();};try{$('mxgAgain').focus();}catch(e){}
    if(wn&&typeof W.lxConfetti==='function')try{W.lxConfetti();}catch(e){}
    return;}
  var id=G.def.id,prev=best(id);setBest(id,G.score);pushBest(id,G.score);
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
  var card=end.querySelector('.mxg-card');if(card&&!CLS.on){var tp=D.createElement('div');tp.id='mxgTop';tp.className='mxg-top';card.insertBefore(tp,card.querySelector('.mxg-btns'));showTop(id);}
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
function qText(q){if(q.topic)return q.q;return /\?$/.test(q.q)?q.q:q.q+' = ?';}
function ansText(q){if(q.topic)return /= \?$/.test(q.q)?q.q.replace(/\?$/,String(q.a)):q.q.replace(/\s*\?$/,'')+' \u2192 '+q.a;return /\?$/.test(q.q)?q.q.replace(/\?$/,String(q.a)):q.q+' = '+q.a;}
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


/* =====================================================================
   1.3.0: four more games, with two new backgrounds (ocean, forest) drawn for every screen shape
   ===================================================================== */
var SUP={2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶'};
/* number "cards" of a size that suits the grade: {l: text, v: value} */
function numCard(L){
  var a,b,c,d;
  if(L<=2){a=rnd(1,L<=1?20:99);return {l:String(a),v:a};}
  if(L<=4){var t=pick([0,1,2]);if(t===0){a=rnd(100,L<=3?999:9999);return {l:String(a),v:a};}
    if(t===1){a=rnd(3,9);b=rnd(3,12);return {l:a+' × '+b,v:a*b};}a=rnd(20,90);b=rnd(10,60);return {l:a+' + '+b,v:a+b};}
  if(L<=6){var t2=pick([0,1,2,3]);if(t2===0){a=rnd(1,99)/100+rnd(0,9);a=Math.round(a*100)/100;return {l:a.toFixed(2),v:a};}
    if(t2===1){b=rnd(2,9);a=rnd(1,b-1);return {l:a+'/'+b,v:a/b};}
    if(t2===2){a=pick([10,20,25,30,40,50,60,75]);b=pick([40,80,120,200,240]);return {l:a+'% of '+b,v:a*b/100};}
    a=rnd(2,9);b=rnd(2,4);return {l:a+SUP[b],v:Math.pow(a,b)};}
  if(L<=9){var t3=pick([0,1,2,3]);if(t3===0){a=rnd(-40,40);return {l:a<0?'−'+(-a):String(a),v:a};}
    if(t3===1){b=rnd(2,9);a=rnd(-9,9);if(!a)a=1;return {l:(a<0?'−':'')+Math.abs(a)+'/'+b,v:a/b};}
    if(t3===2){a=rnd(2,60);return {l:'√'+a,v:Math.sqrt(a)};}
    a=rnd(2,5);b=rnd(2,5);return {l:a+SUP[b]+' − '+rnd(1,20),v:0};}
  var t4=pick([0,1,2,3]);
  if(t4===0){a=rnd(2,60);return {l:'√'+a,v:Math.sqrt(a)};}
  if(t4===1){a=pick([2,3,5,10]);b=rnd(2,50);var nm={2:'₂',3:'₃',5:'₅',10:'₁₀'};return {l:'log'+nm[a]+' '+b,v:Math.log(b)/Math.log(a)};}
  if(t4===2){a=rnd(1,11);var ang=pick([[0,'0'],[30,'π/6'],[45,'π/4'],[60,'π/3'],[90,'π/2'],[120,'2π/3'],[180,'π']]);var f=pick([['sin',Math.sin],['cos',Math.cos]]);return {l:f[0]+' '+ang[1],v:f[1](ang[0]*Math.PI/180)};}
  a=rnd(2,6);b=rnd(-3,3);return {l:'e^'+b,v:Math.exp(b)};
}
function fixCard(c){ /* the lazy power-minus-number card above needs its value worked out from its label */
  var m=/^(\d)([²³⁴⁵⁶]) − (\d+)$/.exec(c.l);if(m){var e={'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6}[m[2]];c.v=Math.pow(+m[1],e)-(+m[3]);}return c;}
function card(L){return fixCard(numCard(L));}
function distinctCards(L,n){var out=[],tries=0;while(out.length<n&&tries++<200){var c=card(L);if(!out.some(function(o){return Math.abs(o.v-c.v)<1e-6||o.l===c.l;}))out.push(c);}return out;}

/* 🐠 Fish Quiz (all grades): tap the fish carrying the right answer */
var FISH={id:'fish',icon:'🐠',name:'Fish Quiz',thumb:'fish_orange.png',bg:'bg_ocean.jpg',
  desc:'A school of fish swims by, each one carrying an answer. Tap the fish with the right one before they all swim away!',
  init:function(g){var s=g.state;s.parts=[];s.fish=[];s.streak=0;s.bub=[];for(var i=0;i<14;i++)s.bub.push({x:Math.random(),y:Math.random(),r:2+Math.random()*5,v:.03+Math.random()*.06});this.next(g);},
  next:function(g){var s=g.state,q=makeQ(g.L),n=g.w<520?4:5,vals=shuffle([q.a].concat(wrongs(q.a,n-1,g.L)));s.q=q;setQ(qText(q));
    var top=g.h*.2,bot=btnsTop(g)+(g.w<520?60:20),lane=(Math.min(g.h-70,bot)-top)/n,sp=Math.min(130,60+g.t*1.1+g.w*.03);
    s.fish=vals.map(function(v,i){var dir=i%2?1:-1,r=Math.min(46,lane*.42,g.w*.1);return {v:v,x:dir<0?g.w+r+rnd(0,160):-r-rnd(0,160),y:top+lane*(i+.5),dir:dir,r:r,sp:sp*(.8+Math.random()*.5),ph:Math.random()*6,img:i%2?'fish_blue.png':'fish_orange.png'};});},
  update:function(g,dt){var s=g.state;
    s.bub.forEach(function(b){b.y-=b.v*dt;if(b.y<-.05){b.y=1.05;b.x=Math.random();}});
    s.fish.forEach(function(f){f.x+=f.dir*f.sp*dt;f.ph+=dt*4;});
    if(s.fish.every(function(f){return f.dir<0?f.x<-f.r*2:f.x>g.w+f.r*2;})){flash(T('They swam away!')+' '+ansText(s.q),'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_ocean.jpg'],g.w,g.h);
    ctx.fillStyle='rgba(255,255,255,.35)';s.bub.forEach(function(b){ctx.beginPath();ctx.arc(b.x*g.w,b.y*g.h,b.r,0,6.283);ctx.fill();});
    s.fish.forEach(function(f){var im=IMG[f.img],y=f.y+Math.sin(f.ph)*6;ctx.save();ctx.translate(f.x,y);if(f.dir>0)ctx.scale(-1,1);
      if(ok(im))ctx.drawImage(im,-f.r*1.5,-f.r*1.1,f.r*3,f.r*2.2);ctx.restore();
      label(ctx,String(f.v),f.x+(f.dir<0?-f.r*.1:f.r*.1),y-f.r*.05,Math.round(f.r*(String(f.v).length>3?.5:.72)),'#fff');});
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-52,g.h*.14,24,'#fbbf24');
    drawParts(ctx,s.parts,1/60);},
  down:function(g,x,y){var s=g.state,hit=null,bd=1e9;s.fish.forEach(function(f){var d=Math.hypot(x-f.x,y-f.y);if(d<f.r*1.6&&d<bd){bd=d;hit=f;}});if(!hit)return;
    if(hit.v===s.q.a){s.streak++;addScore(10+Math.min(10,s.streak)*2);burst(s.parts,hit.x,hit.y,'#7dd3fc');this.next(g);}
    else{s.streak=0;flash(T('Not quite!')+' '+hit.v,'#fca5a5');burst(s.parts,hit.x,hit.y,'#ef4444');s.fish=s.fish.filter(function(f){return f!==hit;});hurt();}},
  key:function(g,k){var i=parseInt(k,10)-1,s=g.state;if(s.fish[i])this.down(g,s.fish[i].x,s.fish[i].y);}
};

/* ⭐ Star Order (all grades): tap the stars from smallest to biggest */
var STARS={id:'stars',icon:'⭐',name:'Star Order',thumb:'star.png',bg:'bg_forest.jpg',
  desc:'Stars light up the evening sky. Tap them from the smallest number to the biggest. Fractions, roots and logs join in as you grow!',
  init:function(g){var s=g.state;s.parts=[];s.round=0;s.streak=0;this.round(g);},
  round:function(g){var s=g.state,n=clamp(4+Math.floor(s.round/2),4,g.L<=2?6:7),cs=distinctCards(g.L,n),r=Math.min(64,g.w*.13,g.h*.1),top=g.h*.2+r,bot=g.h-r-24,tries=0;
    s.round++;s.next=0;s.st=[];
    cs.forEach(function(c,i){var x,y,k=0;do{x=rnd(Math.round(r),Math.round(g.w-r));y=rnd(Math.round(top),Math.round(Math.max(top+1,bot)));k++;}while(k<80&&s.st.some(function(o){return Math.hypot(o.x-x,o.y-y)<r*2.3;}));
      s.st.push({l:c.l,v:c.v,x:x,y:y,r:r,ph:Math.random()*6,done:false});});
    s.order=s.st.slice().sort(function(a,b){return a.v-b.v;});s.limit=limitFor(g,10+n*2.2,7,.12);s.left=s.limit;setQ(T('Smallest to biggest'));},
  update:function(g,dt){var s=g.state;s.st.forEach(function(o){o.ph+=dt*3;});s.left-=dt;
    if(s.left<=0){flash(T('Time up!')+' '+s.order.map(function(o){return o.l;}).join(' < '),'#fca5a5');s.streak=0;hurt();if(!g.over)this.round(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_forest.jpg'],g.w,g.h);timeBar(ctx,14,g.h*.17,g.w-28,clamp(s.left/s.limit,0,1));
    s.st.forEach(function(o){var im=IMG['star.png'],p=1+Math.sin(o.ph)*.05,R=o.r*p;ctx.globalAlpha=o.done?.3:1;
      ctx.save();ctx.shadowColor='#fde047';ctx.shadowBlur=o.done?0:18;if(ok(im))ctx.drawImage(im,o.x-R*1.25,o.y-R*1.25,R*2.5,R*2.5);ctx.restore();
      label(ctx,o.l,o.x,o.y+R*.12,Math.round(Math.min(R*.7,R*1.7/Math.max(2.4,o.l.length*.6))),o.done?'#cbd5e1':'#1e1b4b',false);ctx.globalAlpha=1;});
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-52,g.h*.13,24,'#fbbf24');
    drawParts(ctx,s.parts,1/60);},
  down:function(g,x,y){var s=g.state,hit=null,bd=1e9;s.st.forEach(function(o){var d=Math.hypot(x-o.x,y-o.y);if(!o.done&&d<o.r*1.5&&d<bd){bd=d;hit=o;}});if(!hit)return;
    if(hit===s.order[s.next]){hit.done=true;s.next++;addScore(4+Math.round(s.left*.5));burst(s.parts,hit.x,hit.y,'#fde047');
      if(s.next>=s.order.length){s.streak++;addScore(10+s.streak*2);flash('✨ '+T('Great order!'),'#bbf7d0');this.round(g);}}
    else{s.streak=0;flash(hit.l+' '+T('is not the smallest left'),'#fca5a5');hurt();if(!g.over)s.left=Math.max(1,s.left-2);}}
};

/* 💎 Gem Hunt: tap every number that fits the rule */
var GEMS={id:'gems',icon:'💎',name:'Gem Hunt',thumb:'gem.png',bg:'bg_ocean.jpg',
  desc:'Dig up every gem that fits the rule: multiples, primes, squares, factors. Miss one when time is up, or dig a wrong one, and you lose a heart.',
  init:function(g){var s=g.state;s.parts=[];s.round=0;s.streak=0;this.round(g);},
  rule:function(L){var n;
    if(L<=4){n=pick([3,4,6,7,8,9]);return {t:T('Multiples of')+' '+n,f:function(v){return v%n===0;},lo:n,hi:n*12};}
    if(L<=6){n=pick([2,3,4,5,6,7]);var kind=pick([0,1]);if(kind)return {t:T('Prime numbers'),f:isPrime,lo:2,hi:60};return {t:T('Multiples of')+' '+n*3,f:function(v){return v%(n*3)===0;},lo:n*3,hi:n*3*10};}
    if(L<=9){var k=pick([0,1,2]);if(k===0)return {t:T('Prime numbers'),f:isPrime,lo:2,hi:90};if(k===1)return {t:T('Perfect squares'),f:function(v){return Math.sqrt(v)%1===0;},lo:1,hi:200};n=pick([24,36,48,60,72]);return {t:T('Factors of')+' '+n,f:function(v){return n%v===0;},lo:1,hi:n};}
    var k2=pick([0,1,2]);if(k2===0)return {t:T('Perfect cubes'),f:function(v){return Math.round(Math.cbrt(v))%1===0&&Math.pow(Math.round(Math.cbrt(v)),3)===v;},lo:1,hi:1100};
    if(k2===1){n=pick([84,96,120,144,180]);return {t:T('Factors of')+' '+n,f:function(v){return n%v===0;},lo:1,hi:n};}
    return {t:T('Prime numbers'),f:isPrime,lo:2,hi:200};},
  round:function(g){var s=g.state,rule=this.rule(g.L),n=g.w<520?12:15,cols=g.w<520?3:5,vals=[],good=[],bad=[],tries=0;
    for(var v=rule.lo;v<=rule.hi;v++)(rule.f(v)?good:bad).push(v);
    good=shuffle(good);bad=shuffle(bad);var ng=clamp(Math.round(n*.4),3,good.length);vals=good.slice(0,ng).concat(bad.slice(0,n-ng));
    if(vals.length<n)vals=vals.concat(good.slice(ng,ng+n-vals.length));
    vals=shuffle(vals);s.round++;s.rule=rule;s.cells=vals.map(function(v){return {v:v,good:rule.f(v),done:false};});s.cols=cols;
    s.limit=limitFor(g,22,10,.15);s.left=s.limit;setQ(rule.t);},
  update:function(g,dt){var s=g.state;s.left-=dt;
    if(s.left<=0){flash(T('Time up!'),'#fca5a5');s.streak=0;hurt();if(!g.over)this.round(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_ocean.jpg'],g.w,g.h);ctx.fillStyle='rgba(6,24,70,.35)';ctx.fillRect(0,0,g.w,g.h);
    timeBar(ctx,14,g.h*.17,g.w-28,clamp(s.left/s.limit,0,1));
    var rows=Math.ceil(s.cells.length/s.cols),top=g.h*.22,gap=8,cw=(g.w-24-gap*(s.cols-1))/s.cols,ch=Math.min(cw,(g.h-top-20-gap*(rows-1))/rows);
    s.cells.forEach(function(c,i){var r=Math.floor(i/s.cols),k=i%s.cols;c.x=12+k*(cw+gap);c.y=top+r*(ch+gap);c.w=cw;c.h=ch;
      ctx.globalAlpha=c.done?.25:1;var im=IMG['gem.png'];ctx.fillStyle='rgba(255,255,255,.14)';rr(ctx,c.x,c.y,cw,ch,16);ctx.fill();
      if(ok(im)){var sz=Math.min(cw,ch)*.92;ctx.drawImage(im,c.x+(cw-sz)/2,c.y+(ch-sz)/2,sz,sz);}
      label(ctx,String(c.v),c.x+cw/2,c.y+ch*.44,Math.round(Math.min(ch*.34,cw/Math.max(2,String(c.v).length)*.8)),'#fff');ctx.globalAlpha=1;});
    var left=s.cells.filter(function(c){return c.good&&!c.done;}).length;label(ctx,'💎 '+left,g.w-48,g.h*.13,24,'#fde047');
    if(s.streak>1)label(ctx,'🔥 '+s.streak,48,g.h*.13,24,'#fbbf24');drawParts(ctx,s.parts,1/60);},
  down:function(g,x,y){var s=g.state,hit=null;s.cells.forEach(function(c){if(!c.done&&x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.h)hit=c;});if(!hit)return;
    if(hit.good){hit.done=true;addScore(5);burst(s.parts,hit.x+hit.w/2,hit.y+hit.h/2,'#67e8f9');
      if(!s.cells.some(function(c){return c.good&&!c.done;})){s.streak++;addScore(10+Math.round(s.left)+s.streak*2);flash('✨ '+T('All found!'),'#bbf7d0');this.round(g);}}
    else{hit.done=true;s.streak=0;flash(hit.v+' '+T('does not fit'),'#fca5a5');burst(s.parts,hit.x+hit.w/2,hit.y+hit.h/2,'#ef4444');hurt();}}
};
function isPrime(n){if(n<2)return false;for(var i=2;i*i<=n;i++)if(n%i===0)return false;return true;}

/* ⚔️ Bigger Duel (all grades): which card is worth more? */
var DUEL={id:'duel',icon:'⚔️',name:'Bigger Duel',thumb:'bolt.png',bg:'bg_forest.jpg',
  desc:'Two cards, one winner. Tap the bigger value, fast. From 38 vs 83 to 5/8 vs 0.6, and √50 vs 7 for the older players.',
  init:function(g){g.state.parts=[];g.state.streak=0;this.next(g);},
  next:function(g){var s=g.state,p=distinctCards(g.L,2);
    if(Math.abs(p[0].v-p[1].v)<1e-6||p.length<2){this.next(g);return;}
    s.a=p[0];s.b=p[1];s.win=p[0].v>p[1].v?s.a:s.b;s.limit=Math.max(2,6-g.t*.04);s.left=s.limit;setQ(T('Which is bigger?'));},
  update:function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+s.win.l,'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}},
  draw:function(g,ctx){var s=g.state;cover(ctx,IMG['bg_forest.jpg'],g.w,g.h);
    var cw=Math.min(300,(g.w-70)/2),ch=Math.min(g.h*.46,260),y=g.h*.28,x1=g.w/2-cw-22,x2=g.w/2+22;s.ra={x:x1,y:y,w:cw,h:ch};s.rb={x:x2,y:y,w:cw,h:ch};
    timeBar(ctx,x1,y-26,cw*2+44,clamp(s.left/s.limit,0,1));
    [[s.a,x1,'#7c3aed'],[s.b,x2,'#0ea5e9']].forEach(function(c){ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=20;ctx.fillStyle=c[2];rr(ctx,c[1],y,cw,ch,26);ctx.fill();ctx.restore();
      label(ctx,c[0].l,c[1]+cw/2,y+ch/2,Math.round(Math.min(56,cw*.66/Math.max(2.4,c[0].l.length*.6))),'#fff');});
    label(ctx,'VS',g.w/2,y+ch/2,Math.round(Math.min(30,cw*.14)),'#fde68a');
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w/2,y+ch+40,26,'#fbbf24');drawParts(ctx,s.parts,1/60);},
  down:function(g,x,y){var s=g.state;function inb(b){return b&&x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;}if(inb(s.ra))this.pick(g,s.a,s.ra);else if(inb(s.rb))this.pick(g,s.b,s.rb);},
  key:function(g,k){var s=g.state;if(k==='ArrowLeft'||k==='1')this.pick(g,s.a,s.ra);else if(k==='ArrowRight'||k==='2')this.pick(g,s.b,s.rb);},
  pick:function(g,c,r){var s=g.state;if(c===s.win){s.streak++;addScore(5+Math.min(10,s.streak)*2+Math.round(s.left*2));burst(s.parts,r.x+r.w/2,r.y+r.h/2,'#22c55e');}
    else{s.streak=0;flash(T('Nope!')+' '+s.win.l+' > '+(c===s.a?s.b:s.a).l,'#fca5a5');hurt();}if(!g.over)this.next(g);}
};

/* =====================================================================
   1.4.0: 96 themed games = 12 worlds x 8 game types. Every world has its own character and a scene
   drawn for each screen shape (tools/make-theme-art.py). Games and art load only when you open one.
   ===================================================================== */
var THEMES=[['dino','🦖','Dino','dinos'],['jungle','🐒','Jungle','monkeys'],['desert','🦊','Desert','desert foxes'],['arctic','🐧','Arctic','penguins'],['volcano','🌋','Volcano','fire imps'],['candy','🍬','Candy','candies'],
  ['pirate','🏴‍☠️','Pirate','pirates'],['robot','🤖','Robot','robots'],['farm','🐷','Farm','piglets'],['haunted','👻','Haunted','ghosts'],['rainbow','🦄','Rainbow','unicorns'],['island','🦜','Island','parrots']];
/* 1.5.0: every class (grade) has its own world. Its themed games, its arcade page and its class team games all use it. */
/* 1.5.1: no world repeats inside a class. Game type j of grade L comes from world (L-1+5j) mod 12, so a class
   gets 8 different worlds, and over Grades 1-12 every one of the 96 themed games belongs to exactly one class.
   The four class team games each take their own world too. */
function themeFor(L,j){L=L||3;return THEMES[(L>=13?3+j*7:(L-1)+j*5)%THEMES.length];}
function worldOf(L){return themeFor(L,0);}
function classWorld(def,L){return themeFor(L,Math.max(0,CLASS_GAMES.indexOf(def))*2+1);}
function wbg(g,fb){var im=IMG['bg_'+classWorld(g.def,g.L)[0]+'.jpg'];return ok(im)?im:IMG[fb];}
function wsp(g){return IMG['sp_'+classWorld(g.def,g.L)[0]+'.png'];}
function wcover(ctx,g,fb){cover(ctx,wbg(g,fb),g.w,g.h);ctx.fillStyle='rgba(10,10,30,.28)';ctx.fillRect(0,0,g.w,g.h);}
function tag(ctx,s,x,y,size,maxW){ctx.font='800 '+size+'px system-ui,sans-serif';var m=ctx.measureText(s).width+size*.8;if(maxW&&m>maxW){size=Math.max(9,size*maxW/m);ctx.font='800 '+size+'px system-ui,sans-serif';m=ctx.measureText(s).width+size*.8;}
  var w=Math.max(size*1.7,m),h=size*1.4;ctx.fillStyle='rgba(255,255,255,.96)';rr(ctx,x-w/2,y-h/2,w,h,h/2);ctx.fill();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#1f2937';ctx.fillText(s,x,y+1);}
function spr(ctx,im,x,y,sz,flip){if(!ok(im))return;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(im,-sz/2,-sz/2,sz,sz);ctx.restore();}
function themedBase(th,key,suffix,desc){var id=th[0];return {id:'t_'+id+'_'+key,icon:th[1],name:th[2]+' '+suffix,thumb:'sp_'+id+'.png',bg:'bg_'+id+'.jpg',themed:true,bgThumb:'bg_'+id+'_w.jpg',assets:['bg_'+id+'.jpg','sp_'+id+'.png'],desc:desc,th:id};}
function mkFloat(th,dir,suffix,desc){var d=themedBase(th,dir,suffix,desc),bgk=d.bg,spk=d.assets[1];
  d.init=function(g){var s=g.state;s.parts=[];s.o=[];s.streak=0;s.sp0=0;this.next(g);};
  d.next=function(g){var s=g.state,q=makeQ(g.L),n=g.w<520?4:5,vals=shuffle([q.a].concat(wrongs(q.a,n-1,g.L)));s.q=q;setQ(qText(q));
    var r=Math.min(46,g.w*.1,g.h*.08),sp=Math.min(140,60+g.t*1.1+g.w*.03);
    if(dir==='x'){var lane=(g.h-80)/n;s.o=vals.map(function(v,i){var dr=i%2?1:-1;return {v:v,x:dr<0?g.w+r+rnd(0,160):-r-rnd(0,160),y:40+lane*(i+.5),dr:dr,r:r,sp:sp*(.8+Math.random()*.5),ph:Math.random()*6};});}
    else{var lane2=g.w/n,vs=Math.max(60,g.h/(7.5-Math.min(3,g.t*.03)));s.o=vals.map(function(v,i){var off=rnd(0,Math.round(g.h*.5));return {v:v,x:lane2*(i+.5),y:dir==='up'?g.h+r+off:-r-off,dr:dir==='up'?-1:1,r:Math.min(r,lane2*.42),sp:vs*(.85+Math.random()*.3),ph:Math.random()*6};});}};
  d.update=function(g,dt){var s=g.state;s.o.forEach(function(o){if(dir==='x')o.x+=o.dr*o.sp*dt;else o.y+=o.dr*o.sp*dt;o.ph+=dt*4;});
    var gone=s.o.every(function(o){return dir==='x'?(o.dr<0?o.x<-o.r*2:o.x>g.w+o.r*2):(o.dr<0?o.y<-o.r*2:o.y>g.h+o.r*2);});
    if(gone){flash(T('They got away!')+' '+ansText(s.q),'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}};
  d.draw=function(g,ctx){var s=g.state;cover(ctx,IMG[bgk],g.w,g.h);var im=IMG[spk];
    s.o.forEach(function(o){var wob=dir==='x'?Math.sin(o.ph)*6:0,wx=dir==='x'?0:Math.sin(o.ph)*6;spr(ctx,im,o.x+wx,o.y+wob,o.r*2.3,dir==='x'&&o.dr>0);tag(ctx,String(o.v),o.x+wx,o.y+wob+o.r*1.05,Math.round(o.r*.62),o.r*2.6);});
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-50,24,24,'#fbbf24');drawParts(ctx,s.parts,1/60);};
  d.down=function(g,x,y){var s=g.state,hit=null,bd=1e9;s.o.forEach(function(o){var dd=Math.hypot(x-o.x,y-(o.y+o.r*.4));if(dd<o.r*1.6&&dd<bd){bd=dd;hit=o;}});if(!hit)return;
    if(hit.v===s.q.a){s.streak++;addScore(10+Math.min(10,s.streak)*2);burst(s.parts,hit.x,hit.y,'#fde047');this.next(g);}
    else{s.streak=0;flash(T('Not quite!')+' '+hit.v,'#fca5a5');burst(s.parts,hit.x,hit.y,'#ef4444');s.o=s.o.filter(function(o){return o!==hit;});hurt();}};
  d.key=function(g,k){var i=parseInt(k,10)-1,o=g.state.o[i];if(o)this.down(g,o.x,o.y+o.r*.4);};
  return d;}
function mkQuiz(th,suffix,desc){var d=themedBase(th,'quiz',suffix,desc),bgk=d.bg,spk=d.assets[1];
  d.init=function(g){g.state.parts=[];g.state.streak=0;g.state.hop=0;this.next(g);};
  d.next=function(g){var s=g.state,q=makeQ(g.L);s.q=q;s.opts=shuffle([q.a].concat(wrongs(q.a,3,g.L)));s.limit=limitFor(g,15,6,.1);s.left=s.limit;setQ(qText(q));};
  d.update=function(g,dt){var s=g.state;s.left-=dt;if(s.hop>0)s.hop-=dt;if(s.left<=0){flash(T('Too slow!')+' '+ansText(s.q),'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}};
  d.draw=function(g,ctx){var s=g.state;cover(ctx,IMG[bgk],g.w,g.h);timeBar(ctx,14,10,g.w-28,clamp(s.left/s.limit,0,1));
    var top=btnsTop(g),sz=Math.min(g.w*.6,top-60,300),cy=(top+24)/2+Math.sin(g.t*3)*5-(s.hop>0?Math.sin(s.hop/.4*Math.PI)*sz*.25:0);spr(ctx,IMG[spk],g.w/2,cy,sz);
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-50,36,24,'#fbbf24');choiceBtns(g,ctx,s.opts,top,62);drawParts(ctx,s.parts,1/60);};
  d.pick=function(g,v){var s=g.state;if(v===s.q.a){s.streak++;addScore(8+Math.round(s.left)+Math.min(10,s.streak));s.hop=.4;burst(s.parts,g.w/2,g.h*.35,'#22c55e');}else{s.streak=0;flash(T('Not quite!')+' '+ansText(s.q),'#fca5a5');hurt();}if(!g.over)this.next(g);};
  d.down=function(g,x,y){var b=hitBtn(g,x,y);if(b)this.pick(g,b.v);};d.key=function(g,k){var b=keyBtn(g,k);if(b)this.pick(g,b.v);};
  return d;}
function mkRush(th,suffix,desc){var d=themedBase(th,'rush',suffix,desc),bgk=d.bg,spk=d.assets[1];
  d.init=function(g){g.state.parts=[];g.state.streak=0;this.next(g);};
  d.next=function(g){var s=g.state,q=makeQ(g.L),truth=Math.random()<.5,shown=truth?q.a:pick(wrongs(q.a,3,g.L));s.truth=truth;s.q=q;s.text=/\?$/.test(q.q)?q.q.replace(/\?$/,String(shown)):q.q+' = '+shown;s.limit=Math.max(2,6-g.t*.035);s.left=s.limit;setQ(s.text+'  ?');};
  d.update=function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+ansText(s.q),'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}};
  d.draw=function(g,ctx){var s=g.state;cover(ctx,IMG[bgk],g.w,g.h);timeBar(ctx,14,10,g.w-28,clamp(s.left/s.limit,0,1));
    var bw=Math.min(240,(g.w-50)/2),bh=Math.min(110,g.h*.2),by=g.h-bh-24,sz=Math.min(g.w*.55,by-70,280);spr(ctx,IMG[spk],g.w/2,(by+40)/2,sz);
    s.tb={x:g.w/2-bw-10,y:by,w:bw,h:bh};s.fb={x:g.w/2+10,y:by,w:bw,h:bh};
    ctx.fillStyle='#16a34a';rr(ctx,s.tb.x,by,bw,bh,22);ctx.fill();label(ctx,'✔ '+T('TRUE'),s.tb.x+bw/2,by+bh/2,26,'#fff',false);
    ctx.fillStyle='#dc2626';rr(ctx,s.fb.x,by,bw,bh,22);ctx.fill();label(ctx,'✘ '+T('FALSE'),s.fb.x+bw/2,by+bh/2,26,'#fff',false);
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-50,36,24,'#fbbf24');drawParts(ctx,s.parts,1/60);};
  d.down=function(g,x,y){var s=g.state;function inb(b){return b&&x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;}if(inb(s.tb))this.answer(g,true);else if(inb(s.fb))this.answer(g,false);};
  d.key=function(g,k){if(k==='ArrowLeft'||k==='1'||k==='t')this.answer(g,true);else if(k==='ArrowRight'||k==='2'||k==='f')this.answer(g,false);};
  d.answer=function(g,v){var s=g.state;if(v===s.truth){s.streak++;addScore(5+Math.min(10,s.streak)*2+Math.round(s.left*2));burst(s.parts,g.w/2,g.h*.3,'#22c55e');}else{s.streak=0;flash(T('Nope!')+' '+ansText(s.q),'#fca5a5');hurt();}if(!g.over)this.next(g);};
  return d;}
function mkOrder(th,suffix,desc,desc2){var d=themedBase(th,'order',suffix,desc),bgk=d.bg,spk=d.assets[1];
  d.init=function(g){g.state.parts=[];g.state.round=0;g.state.streak=0;this.round(g);};
  d.round=function(g){var s=g.state,n=clamp(4+Math.floor(s.round/2),4,g.L<=2?6:7),cs=distinctCards(g.L,n),r=Math.min(58,g.w*.12,g.h*.09),top=r+8,bot=g.h-r*1.6-10;s.round++;s.next=0;s.st=[];
    cs.forEach(function(c){var x,y,k=0;do{x=rnd(Math.round(r),Math.round(g.w-r));y=rnd(Math.round(top),Math.round(Math.max(top+1,bot)));k++;}while(k<80&&s.st.some(function(o){return Math.hypot(o.x-x,o.y-y)<r*2.5;}));s.st.push({l:c.l,v:c.v,x:x,y:y,r:r,ph:Math.random()*6,done:false});});
    s.order=s.st.slice().sort(function(a,b){return desc2?b.v-a.v:a.v-b.v;});s.limit=limitFor(g,10+n*2.2,7,.12);s.left=s.limit;setQ(T(desc2?'Biggest to smallest':'Smallest to biggest'));};
  d.update=function(g,dt){var s=g.state;s.st.forEach(function(o){o.ph+=dt*3;});s.left-=dt;if(s.left<=0){flash(T('Time up!')+' '+s.order.map(function(o){return o.l;}).join(desc2?' > ':' < '),'#fca5a5');s.streak=0;hurt();if(!g.over)this.round(g);}};
  d.draw=function(g,ctx){var s=g.state;cover(ctx,IMG[bgk],g.w,g.h);timeBar(ctx,14,8,g.w-28,clamp(s.left/s.limit,0,1));
    s.st.forEach(function(o){ctx.globalAlpha=o.done?.3:1;spr(ctx,IMG[spk],o.x,o.y+Math.sin(o.ph)*4,o.r*2.1);tag(ctx,o.l,o.x,o.y+o.r*1.05,Math.round(o.r*.5),o.r*2.8);ctx.globalAlpha=1;});
    if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w-50,34,24,'#fbbf24');drawParts(ctx,s.parts,1/60);};
  d.down=function(g,x,y){var s=g.state,hit=null,bd=1e9;s.st.forEach(function(o){var dd=Math.hypot(x-o.x,y-o.y);if(!o.done&&dd<o.r*1.5&&dd<bd){bd=dd;hit=o;}});if(!hit)return;
    if(hit===s.order[s.next]){hit.done=true;s.next++;addScore(4+Math.round(s.left*.5));burst(s.parts,hit.x,hit.y,'#fde047');if(s.next>=s.order.length){s.streak++;addScore(10+s.streak*2);flash('✨ '+T('Great order!'),'#bbf7d0');this.round(g);}}
    else{s.streak=0;flash(hit.l+' '+T('is not next'),'#fca5a5');hurt();if(!g.over)s.left=Math.max(1,s.left-2);}};
  return d;}
function mkDuel(th,suffix,desc,small){var d=themedBase(th,'duel',suffix,desc),bgk=d.bg,spk=d.assets[1];
  d.init=function(g){g.state.parts=[];g.state.streak=0;this.next(g);};
  d.next=function(g){var s=g.state,p=distinctCards(g.L,2);if(p.length<2||Math.abs(p[0].v-p[1].v)<1e-6){this.next(g);return;}s.a=p[0];s.b=p[1];
    s.win=(p[0].v>p[1].v)!==!!small?s.a:s.b;s.limit=Math.max(2,6-g.t*.04);s.left=s.limit;setQ(T(small?'Which is smaller?':'Which is bigger?'));};
  d.update=function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Too slow!')+' '+s.win.l,'#fca5a5');s.streak=0;hurt();if(!g.over)this.next(g);}};
  d.draw=function(g,ctx){var s=g.state;cover(ctx,IMG[bgk],g.w,g.h);var cw=Math.min(300,(g.w-70)/2),ch=Math.min(g.h*.6,320),y=Math.max(40,(g.h-ch)/2),x1=g.w/2-cw-22,x2=g.w/2+22;s.ra={x:x1,y:y,w:cw,h:ch};s.rb={x:x2,y:y,w:cw,h:ch};
    timeBar(ctx,x1,y-24,cw*2+44,clamp(s.left/s.limit,0,1));
    [[s.a,x1,'rgba(124,58,237,.92)'],[s.b,x2,'rgba(14,165,233,.92)']].forEach(function(c){ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=20;ctx.fillStyle=c[2];rr(ctx,c[1],y,cw,ch,26);ctx.fill();ctx.restore();
      spr(ctx,IMG[spk],c[1]+cw/2,y+ch*.3,Math.min(cw*.7,ch*.4));label(ctx,c[0].l,c[1]+cw/2,y+ch*.7,Math.round(Math.min(48,cw*.66/Math.max(2.4,c[0].l.length*.6))),'#fff');});
    label(ctx,'VS',g.w/2,y+ch/2,Math.round(Math.min(26,cw*.12)),'#fde68a');if(s.streak>1)label(ctx,'🔥 '+s.streak,g.w/2,y+ch+30,24,'#fbbf24');drawParts(ctx,s.parts,1/60);};
  d.down=function(g,x,y){var s=g.state;function inb(b){return b&&x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;}if(inb(s.ra))this.pick(g,s.a,s.ra);else if(inb(s.rb))this.pick(g,s.b,s.rb);};
  d.key=function(g,k){var s=g.state;if(k==='ArrowLeft'||k==='1')this.pick(g,s.a,s.ra);else if(k==='ArrowRight'||k==='2')this.pick(g,s.b,s.rb);};
  d.pick=function(g,c,r){var s=g.state;if(c===s.win){s.streak++;addScore(5+Math.min(10,s.streak)*2+Math.round(s.left*2));burst(s.parts,r.x+r.w/2,r.y+r.h/2,'#22c55e');}else{s.streak=0;flash(T('Nope!')+' '+s.win.l,'#fca5a5');hurt();}if(!g.over)this.next(g);};
  return d;}
function mkHunt(th,suffix,desc){var d=themedBase(th,'hunt',suffix,desc),bgk=d.bg,spk=d.assets[1];
  d.init=function(g){g.state.parts=[];g.state.round=0;g.state.streak=0;this.round(g);};
  d.round=function(g){var s=g.state,rule=GEMS.rule(g.L),n=g.w<520?12:15,good=[],bad=[];for(var v=rule.lo;v<=rule.hi;v++)(rule.f(v)?good:bad).push(v);good=shuffle(good);bad=shuffle(bad);
    var ng=clamp(Math.round(n*.4),3,good.length),vals=good.slice(0,ng).concat(bad.slice(0,n-ng));if(vals.length<n)vals=vals.concat(good.slice(ng,ng+n-vals.length));
    s.round++;s.cells=shuffle(vals).map(function(v){return {v:v,good:rule.f(v),done:false};});s.cols=g.w<520?3:5;s.limit=limitFor(g,22,10,.15);s.left=s.limit;setQ(rule.t);};
  d.update=function(g,dt){var s=g.state;s.left-=dt;if(s.left<=0){flash(T('Time up!'),'#fca5a5');s.streak=0;hurt();if(!g.over)this.round(g);}};
  d.draw=function(g,ctx){var s=g.state;cover(ctx,IMG[bgk],g.w,g.h);ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(0,0,g.w,g.h);timeBar(ctx,14,8,g.w-28,clamp(s.left/s.limit,0,1));
    var rows=Math.ceil(s.cells.length/s.cols),top=34,gap=8,cw=(g.w-24-gap*(s.cols-1))/s.cols,ch=Math.min(cw,(g.h-top-14-gap*(rows-1))/rows);
    s.cells.forEach(function(c,i){var r=Math.floor(i/s.cols),k=i%s.cols;c.x=12+k*(cw+gap);c.y=top+r*(ch+gap);c.w=cw;c.h=ch;ctx.globalAlpha=c.done?.25:1;ctx.fillStyle='rgba(255,255,255,.2)';rr(ctx,c.x,c.y,cw,ch,16);ctx.fill();
      spr(ctx,IMG[spk],c.x+cw/2,c.y+ch*.4,Math.min(cw,ch)*.8);tag(ctx,String(c.v),c.x+cw/2,c.y+ch*.78,Math.round(Math.min(ch*.26,cw*.3)),cw*.9);ctx.globalAlpha=1;});
    var left=s.cells.filter(function(c){return c.good&&!c.done;}).length;label(ctx,'⭐ '+left,g.w-44,g.h-16,20,'#fde047');if(s.streak>1)label(ctx,'🔥 '+s.streak,44,g.h-16,20,'#fbbf24');drawParts(ctx,s.parts,1/60);};
  d.down=function(g,x,y){var s=g.state,hit=null;s.cells.forEach(function(c){if(!c.done&&x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.h)hit=c;});if(!hit)return;
    if(hit.good){hit.done=true;addScore(5);burst(s.parts,hit.x+hit.w/2,hit.y+hit.h/2,'#fde047');if(!s.cells.some(function(c){return c.good&&!c.done;})){s.streak++;addScore(10+Math.round(s.left)+s.streak*2);flash('✨ '+T('All found!'),'#bbf7d0');this.round(g);}}
    else{hit.done=true;s.streak=0;flash(hit.v+' '+T('does not fit'),'#fca5a5');burst(s.parts,hit.x+hit.w/2,hit.y+hit.h/2,'#ef4444');hurt();}};
  return d;}
var THEMED=[];
THEMES.forEach(function(th,i){var odd=i%2===1,n=th[3];
  THEMED.push(mkFloat(th,'x','Dash','The '+n+' dash across the screen, each carrying an answer. Tap the one with the right answer!'),
    mkFloat(th,'up','Rise','The '+n+' float up, each carrying an answer. Tap the right one before they all escape!'),
    mkFloat(th,'down','Drop','The '+n+' drop from above, each carrying an answer. Tap the right one before they land!'),
    mkQuiz(th,'Quiz','Answer the question before the timer runs out. Your character cheers every right answer.'),
    mkRush(th,'Rush','True or false? Decide before the time bar runs out. It gets shorter and shorter.'),
    mkOrder(th,'Order',odd?'Tap the '+n+' from the biggest number to the smallest.':'Tap the '+n+' from the smallest number to the biggest.',odd),
    mkDuel(th,'Duel',odd?'Two cards, one winner. Tap the smaller value, fast.':'Two cards, one winner. Tap the bigger value, fast.',odd),
    mkHunt(th,'Hunt','Tap every card that fits the rule: multiples, primes, squares, factors. A wrong tap costs a heart.'));});
/* French names and descriptions for the themed games */
var THEMES_FR=['dinos','singes','renards du désert','pingouins','diablotins de feu','bonbons','pirates','robots','porcelets','fantômes','licornes','perroquets'],MECH_FR=['Course','Envol','Pluie','Quiz','Vrai ou faux','Ordre','Duel','Chasse'];
(function(){var o={};THEMES.forEach(function(th,i){var n=THEMES_FR[i],g=THEMED.slice(i*8,i*8+8),odd=i%2===1;
  g.forEach(function(d,j){o[d.name]=MECH_FR[j]+' des '+n;});
  o[g[0].desc]='Les '+n+' traversent l’écran, chacun portant une réponse. Touche celui qui a la bonne !';
  o[g[1].desc]='Les '+n+' s’envolent, chacun portant une réponse. Touche le bon avant qu’ils ne s’échappent !';
  o[g[2].desc]='Les '+n+' tombent du ciel, chacun portant une réponse. Touche le bon avant qu’ils n’atterrissent !';
  o[g[5].desc]='Touche les '+n+(odd?' du plus grand nombre au plus petit.':' du plus petit nombre au plus grand.');});
  if(W.trAdd)W.trAdd(o);})();
/* =====================================================================
   Class-only team games (Arcade 1.5): both teams play on ONE screen at
   the same time — Team A on the left, Team B on the right. These only
   show in "In class"; home games only show "At home".
   ===================================================================== */
var TA='#ff4fa3',TB='#38bdf8';
function vsHalf(g,side){return side==='A'?{x:0,w:g.w/2}:{x:g.w/2,w:g.w/2};}
/* four answer buttons in one team's half (tap, or keys 1-4 for A and 7-0 for B) */
function vsBtns(g,ctx,side,opts,top,locked){
  var h=vsHalf(g,side),gap=8,bw=(h.w-30-gap)/2,bh=Math.max(30,Math.min(64,(g.h-top-20)/2-gap)),out=[];
  opts.forEach(function(o,i){var x=h.x+10+(i%2)*(bw+gap)+5,y=top+Math.floor(i/2)*(bh+gap);out.push({x:x,y:y,w:bw,h:bh,v:o,side:side});
    ctx.globalAlpha=locked?.35:1;ctx.fillStyle='rgba(255,255,255,.95)';rr(ctx,x,y,bw,bh,14);ctx.fill();
    ctx.strokeStyle=side==='A'?TA:TB;ctx.lineWidth=3;rr(ctx,x,y,bw,bh,14);ctx.stroke();
    label(ctx,String(o),x+bw/2,y+bh/2,Math.max(11,Math.min(26,bh*.42,(bw-14)/(String(o).length*.58))),'#1f2937',false);ctx.globalAlpha=1;});
  return out;
}
function vsHit(btns,x,y){for(var i=0;i<btns.length;i++){var r=btns[i];if(x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h)return r;}return null;}
function vsKey(btns,k){var m={'1':['A',0],'2':['A',1],'3':['A',2],'4':['A',3],'7':['B',0],'8':['B',1],'9':['B',2],'0':['B',3]}[k];if(!m)return null;var s=btns.filter(function(b){return b.side===m[0];});return s[m[1]]||null;}
function vsDivider(ctx,g){ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(g.w/2-2,0,4,g.h);}
function vsNames(ctx,g,y){label(ctx,teamName('A'),g.w/4,y,Math.min(26,g.w/20),TA);label(ctx,teamName('B'),g.w*3/4,y,Math.min(26,g.w/20),TB);}
function vsWin(g,side){if(g.over)return;g.winner=side;gameOver();}

/* 🪢 Tug of War: each right answer pulls the rope one step to your side */
var TUG={id:'c_tug',icon:'🪢',name:'Tug of War',thumb:'owl0.png',bg:'bg_sky.jpg',versus:true,lives:false,classOnly:true,
  desc:'Both teams answer the same question. Each right answer pulls the rope one step your way. Pull it 5 steps to win! A wrong answer freezes your team for 2 seconds.',
  init:function(g){var s=g.state;s.p=0;s.parts=[];s.frz={A:0,B:0};this.next(g);},
  next:function(g){var s=g.state;s.q=cq(g);s.oA=cc(s.q,g.L);s.oB=cc(s.q,g.L);setQ(qText(s.q));},
  update:function(g,dt){var s=g.state;s.frz.A=Math.max(0,s.frz.A-dt);s.frz.B=Math.max(0,s.frz.B-dt);},
  draw:function(g,ctx){var s=g.state;wcover(ctx,g,'bg_sky.jpg');vsDivider(ctx,g);vsNames(ctx,g,26);
    var ry=g.h*.3,cx=g.w/2+s.p*(g.w*.07);ctx.strokeStyle='#a16207';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(40,ry);ctx.lineTo(g.w-40,ry);ctx.stroke();
    ctx.fillStyle='#ef4444';ctx.beginPath();ctx.moveTo(cx,ry-6);ctx.lineTo(cx+18,ry-40);ctx.lineTo(cx-18,ry-40);ctx.fill();ctx.fillRect(cx-2,ry-40,4,40);
    for(var i=-5;i<=5;i++){ctx.fillStyle=i===0?'#fff':'rgba(255,255,255,.5)';ctx.fillRect(g.w/2+i*g.w*.07-1,ry+14,2,i===0||Math.abs(i)===5?22:10);}
    if(ok(wsp(g))){spr(ctx,wsp(g),48,ry-8,76,false);spr(ctx,wsp(g),g.w-48,ry-8,76,true);}
    else if(ok(IMG['owl0.png'])){ctx.drawImage(IMG['owl0.png'],10,ry-40,60,68);ctx.save();ctx.translate(g.w-10,ry-40);ctx.scale(-1,1);ctx.drawImage(ok(IMG['owl1.png'])?IMG['owl1.png']:IMG['owl0.png'],0,0,60,68);ctx.restore();}
    var top=g.h*.48;s.btns=vsBtns(g,ctx,'A',s.oA,top,s.frz.A>0).concat(vsBtns(g,ctx,'B',s.oB,top,s.frz.B>0));
    ['A','B'].forEach(function(t){if(s.frz[t]>0)label(ctx,'❄ '+s.frz[t].toFixed(1)+'s',t==='A'?g.w/4:g.w*3/4,top-24,22,'#bae6fd');});
    drawParts(ctx,s.parts,1/60);},
  pick:function(g,b){var s=g.state;if(!b||s.frz[b.side]>0)return;
    if(b.v===s.q.a){s.p+=b.side==='A'?-1:1;burst(s.parts,g.w/2+s.p*g.w*.07,g.h*.3,b.side==='A'?TA:TB);flash(teamName(b.side)+' '+T('pulls!'),b.side==='A'?TA:TB);
      if(Math.abs(s.p)>=5){vsWin(g,s.p<0?'A':'B');return;}this.next(g);}
    else{s.frz[b.side]=2;flash(teamName(b.side)+': '+T('frozen!'),'#bae6fd');}},
  down:function(g,x,y){this.pick(g,vsHit(g.state.btns||[],x,y));},
  key:function(g,k){this.pick(g,vsKey(g.state.btns||[],k));}
};

/* 🔔 Buzzer Battle: buzz first, then answer. A wrong answer lets the other team steal. First to 7 */
var BUZZER={id:'c_buzzer',icon:'🔔',name:'Buzzer Battle',thumb:'bolt.png',bg:'bg_space.jpg',versus:true,lives:false,classOnly:true,
  desc:'Hit your buzzer first, then answer within 6 seconds. Get it wrong and the other team can steal. First team to 7 points wins.',
  init:function(g){var s=g.state;s.pt={A:0,B:0};s.parts=[];this.next(g);},
  next:function(g){var s=g.state;s.q=cq(g);s.opts=cc(s.q,g.L);s.who=null;s.tried={};s.left=0;setQ(qText(s.q));},
  update:function(g,dt){var s=g.state;if(s.who){s.left-=dt;if(s.left<=0){flash(teamName(s.who)+': '+T('too slow!'),'#fca5a5');this.miss(g);}}},
  miss:function(g){var s=g.state,o=s.who==='A'?'B':'A';s.tried[s.who]=1;s.who=null;if(s.tried[o]){flash(ansText(s.q),'#fde68a');this.next(g);}},
  draw:function(g,ctx){var s=g.state;wcover(ctx,g,'bg_space.jpg');vsDivider(ctx,g);
    ['A','B'].forEach(function(t){var cx=t==='A'?g.w/4:g.w*3/4,col=t==='A'?TA:TB;label(ctx,teamName(t)+': '+s.pt[t],cx,28,Math.min(28,g.w/18),col);
      if(!s.who&&!s.tried[t])spr(ctx,wsp(g),cx,g.h*.5-Math.min(g.w/8,g.h/5)-34+Math.sin(g.t*4+(t==='A'?0:2))*4,Math.min(64,g.h*.12),t==='B');
      if(!s.who){var r=Math.min(g.w/8,g.h/5),dead=s.tried[t];ctx.globalAlpha=dead?.3:1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx,g.h*.5,r,0,6.28);ctx.fill();ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(cx-r*.3,g.h*.5-r*.3,r*.3,0,6.28);ctx.fill();
        label(ctx,T('BUZZ'),cx,g.h*.5,r*.45,'#fff');ctx.globalAlpha=1;label(ctx,t==='A'?'(A)':'(L)',cx,g.h*.5+r+22,16,'rgba(255,255,255,.7)');}});
    s.btns=[];if(s.who){label(ctx,teamName(s.who)+' — '+Math.ceil(s.left)+'s',s.who==='A'?g.w/4:g.w*3/4,g.h*.2,26,'#fde68a');s.btns=vsBtns(g,ctx,s.who,s.opts,g.h*.32,false);}
    drawParts(ctx,s.parts,1/60);},
  buzz:function(g,t){var s=g.state;if(s.who||s.tried[t])return;s.who=t;s.left=6;},
  pick:function(g,b){var s=g.state;if(!b||b.side!==s.who)return;
    if(b.v===s.q.a){s.pt[b.side]++;burst(s.parts,b.side==='A'?g.w/4:g.w*3/4,g.h*.4,'#fbbf24');flash('✔ '+teamName(b.side),b.side==='A'?TA:TB);if(s.pt[b.side]>=7){vsWin(g,b.side);return;}this.next(g);}
    else{flash(T('Wrong!')+' '+T('Steal chance'),'#fca5a5');this.miss(g);}},
  down:function(g,x,y){var s=g.state;if(!s.who){if(y>g.h*.25&&y<g.h*.8)this.buzz(g,x<g.w/2?'A':'B');return;}this.pick(g,vsHit(s.btns||[],x,y));},
  key:function(g,k){var s=g.state;if(k==='a'||k==='A')this.buzz(g,'A');else if(k==='l'||k==='L')this.buzz(g,'B');else this.pick(g,vsKey(s.btns||[],k));}
};

/* 💣 Hot Potato: answer right to throw the bomb to the other team. Hold it when it blows and they score. First to 3 */
var POTATO={id:'c_potato',icon:'💣',name:'Hot Potato Bomb',thumb:'bomb.png',bg:'bg_table.jpg',versus:true,lives:false,classOnly:true,
  desc:'The team holding the bomb must answer right to throw it to the other team. Nobody knows when it blows! If it explodes on your side, the other team scores. First to 3.',
  init:function(g){var s=g.state;s.pt={A:0,B:0};s.parts=[];s.hold=Math.random()<.5?'A':'B';this.round(g);},
  round:function(g){var s=g.state;s.fuse=12+Math.random()*14;s.boom=0;s.fly=0;this.next(g);},
  next:function(g){var s=g.state;s.q=cq(g);s.opts=cc(s.q,g.L);setQ(teamName(s.hold)+': '+qText(s.q));},
  update:function(g,dt){var s=g.state;if(s.fly>0)s.fly=Math.max(0,s.fly-dt*2.5);
    if(s.boom>0){s.boom-=dt;if(s.boom<=0&&!g.over)this.round(g);return;}
    s.fuse-=dt;if(s.fuse<=0){var o=s.hold==='A'?'B':'A';s.pt[o]++;s.boom=1.6;var x=s.hold==='A'?g.w/4:g.w*3/4;['#f97316','#ef4444','#fde047'].forEach(function(c){burst(s.parts,x,g.h*.3,c);});flash('💥 BOOM! +1 '+teamName(o),'#fca5a5');
      if(s.pt[o]>=3){vsWin(g,o);return;}s.hold=o==='A'?'B':'A';}},
  draw:function(g,ctx){var s=g.state;wcover(ctx,g,'bg_table.jpg');vsDivider(ctx,g);
    label(ctx,teamName('A')+': '+s.pt.A,g.w/4,26,Math.min(26,g.w/18),TA);label(ctx,teamName('B')+': '+s.pt.B,g.w*3/4,26,Math.min(26,g.w/18),TB);
    var fx=s.hold==='A'?g.w*3/4:g.w/4,tx=s.hold==='A'?g.w/4:g.w*3/4,p=1-s.fly,bx=s.fly>0?fx+(tx-fx)*p:tx,by=g.h*.3-(s.fly>0?Math.sin(p*3.14)*80:0),r=Math.min(70,g.w*.1);
    s.btns=[];
    if(s.boom>0)label(ctx,'💥',bx,g.h*.3,90,'#fff',false);
    else{if(ok(IMG['bomb.png']))ctx.drawImage(IMG['bomb.png'],bx-r,by-r,r*2,r*2);ctx.fillStyle=Math.random()<.5?'#fde047':'#f97316';ctx.beginPath();ctx.arc(bx+r*.5,by-r*.85,6+Math.random()*5,0,6.28);ctx.fill();
      s.btns=vsBtns(g,ctx,s.hold,s.opts,g.h*.52,false);}
    drawParts(ctx,s.parts,1/60);},
  pick:function(g,b){var s=g.state;if(!b||s.boom>0||b.side!==s.hold)return;
    if(b.v===s.q.a){s.fly=1;s.hold=s.hold==='A'?'B':'A';this.next(g);}else{flash(T('Wrong! Keep holding it'),'#fca5a5');this.next(g);}},
  down:function(g,x,y){this.pick(g,vsHit(g.state.btns||[],x,y));},
  key:function(g,k){this.pick(g,vsKey(g.state.btns||[],k));}
};

/* 🏁 Team Race: each team answers its own questions; every right answer moves your car */
var TEAMRACE={id:'c_race',icon:'🏁',name:'Team Race',thumb:'car_purple.png',bg:'bg_road.jpg',versus:true,lives:false,classOnly:true,
  desc:'Each team gets its own questions on its side. Every right answer moves your car forward; a wrong one spins you out. First car over the line wins.',
  init:function(g){var s=g.state;s.pos={A:0,B:0};s.spin={A:0,B:0};s.q={};s.o={};s.parts=[];this.next(g,'A');this.next(g,'B');setQ(T('Race! Each team answers its own questions'));},
  next:function(g,t){var s=g.state;s.q[t]=cq(g);s.o[t]=cc(s.q[t],g.L);},
  update:function(g,dt){var s=g.state;s.spin.A=Math.max(0,s.spin.A-dt);s.spin.B=Math.max(0,s.spin.B-dt);},
  draw:function(g,ctx){var s=g.state;if(ok(IMG['bg_'+classWorld(g.def,g.L)[0]+'.jpg']))wcover(ctx,g,'bg_road.jpg');else{ctx.fillStyle='#3f6212';ctx.fillRect(0,0,g.w,g.h);}var top=10,rh=Math.min(150,g.h*.28);ctx.fillStyle='#374151';ctx.fillRect(0,top,g.w,rh);
    ctx.strokeStyle='#fde047';ctx.setLineDash([24,18]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,top+rh/2);ctx.lineTo(g.w,top+rh/2);ctx.stroke();ctx.setLineDash([]);
    var x0=50,x1=g.w-70,cw=Math.min(90,g.w*.12);for(var i=0;i<6;i++){ctx.fillStyle=i%2?'#fff':'#111';ctx.fillRect(x1+40,top+i*rh/6,12,rh/6);}
    [['A','car_orange.png',.27],['B','car_purple.png',.73]].forEach(function(c){var x=x0+(x1-x0)*clamp(s.pos[c[0]]/10,0,1),y=top+rh*c[2];ctx.save();ctx.translate(x,y);if(s.spin[c[0]]>0)ctx.rotate(Math.sin(g.t*30)*.4);if(ok(IMG[c[1]]))ctx.drawImage(IMG[c[1]],-cw/2,-cw*.25,cw,cw*.5);spr(ctx,wsp(g),cw*.05,-cw*.42,cw*.5,c[0]==='B');ctx.restore();});
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(g.w/2-2,top+rh,4,g.h-top-rh);
    var qy=top+rh+34;['A','B'].forEach(function(t){var cx=t==='A'?g.w/4:g.w*3/4,qt=qText(s.q[t]);label(ctx,teamName(t),cx,qy,18,t==='A'?TA:TB);label(ctx,qt,cx,qy+32,Math.max(12,Math.min(26,g.w/(qt.length+6)*1.6)),'#fff');});
    s.btns=vsBtns(g,ctx,'A',s.o.A,qy+62,s.spin.A>0).concat(vsBtns(g,ctx,'B',s.o.B,qy+62,s.spin.B>0));drawParts(ctx,s.parts,1/60);},
  pick:function(g,b){var s=g.state;if(!b||s.spin[b.side]>0)return;var t=b.side;
    if(b.v===s.q[t].a){s.pos[t]++;if(s.pos[t]>=10){vsWin(g,t);return;}}else{s.spin[t]=1.5;flash(teamName(t)+': '+T('spin out!'),'#fca5a5');}this.next(g,t);},
  down:function(g,x,y){this.pick(g,vsHit(g.state.btns||[],x,y));},
  key:function(g,k){this.pick(g,vsKey(g.state.btns||[],k));}
};
/* 1.6.0: topic team games. TOPIC is the class topic being played (null = mixed questions for the grade).
   cq/cc give the team games their question and four answers from that topic. */
var TOPIC=null;
function cq(g){if(TOPIC){var t=TOPIC.gen(g.L);return {q:t.q,a:t.a,opts:t.opts||[],topic:true};}return makeQ(g.L);}
function cc(q,L){if(q.topic)return shuffle([q.a].concat(q.opts.slice(0,3)));return choices(q,L,4);}
function vsScore(ctx,g,s){label(ctx,teamName('A')+': '+s.pt.A,g.w/4,26,Math.min(26,g.w/18),TA);label(ctx,teamName('B')+': '+s.pt.B,g.w*3/4,26,Math.min(26,g.w/18),TB);}
function vsCheckBtn(g,ctx,side,y,txt){var h=vsHalf(g,side),bw=Math.min(220,h.w-40),bh=52,x=h.x+(h.w-bw)/2;
  ctx.fillStyle=side==='A'?TA:TB;rr(ctx,x,y,bw,bh,16);ctx.fill();label(ctx,txt,x+bw/2,y+bh/2,22,'#fff',false);return {x:x,y:y,w:bw,h:bh,side:side,check:true};}


var CLASS_GAMES=[TUG,BUZZER,POTATO,TEAMRACE];

var GAMES=[FISH,STARS,GEMS,DUEL,ASTEROIDS,TRUEFALSE,CASTLE,FLIGHT,BALLOONS,SNAKE,BOMB,RACE,STONES,CATCHER,FRUITS,RUNNER,MEMORY].concat(THEMED);
var ALLG=GAMES;
/* Each home game is made for certain grades, so every grade gets its own set of games.
   Themed worlds go from little-kid worlds (farm, candy) to older ones (robots, haunted). */
var LV={fish:[1,13],stars:[1,13],gems:[2,13],duel:[1,9],asteroids:[3,13],truefalse:[4,13],castle:[4,13],flight:[5,13],balloons:[1,6],snake:[3,13],bomb:[6,13],race:[5,13],stones:[1,8],catcher:[1,8],fruit:[1,6],runner:[2,10],memory:[1,13]};
var THEME_LV={farm:[1,3],candy:[1,4],rainbow:[2,5],jungle:[2,5],dino:[3,6],island:[4,7],arctic:[5,8],pirate:[6,9],desert:[7,10],volcano:[8,11],haunted:[9,13],robot:[10,13]};
function gradeRange(g){if(LV[g.id])return LV[g.id];var m=/^t_([a-z]+)_/.exec(g.id);if(m&&THEME_LV[m[1]])return THEME_LV[m[1]];if(g.lv)return g.lv;return [1,13];}
function forGrade(g,L){if(g.th){if(g.mj==null)g.mj=THEMED.indexOf(g)%8;return g.th===themeFor(L,g.mj)[0];}var r=gradeRange(g);return L>=r[0]&&L<=r[1];}
function isFr(){try{return W.mxLang&&W.mxLang.get()==='fr';}catch(e){return false;}}
function worldName(w){return isFr()?'Monde '+T(w[2]):w[2]+' world';}
function gName(g,L){if(g.classOnly&&!g.topicOnly&&!g.board){var w=classWorld(g,L);return isFr()?T(g.name)+' · '+T(w[2]):w[2]+' '+g.name;}return T(g.name);}
/* ---------- best scores sync between the app and the website (signed-in players) ---------- */
function who(){return W.ME||W.mxUser||null;}
function fbBase(){return W.FB||'https://matix-1d538-default-rtdb.firebaseio.com';}
function fbJ(p,m,d){var o={method:m||'GET'};if(d!==undefined){o.headers={'Content-Type':'application/json'};o.body=JSON.stringify(d);}return fetch(fbBase()+p+'.json',o).then(function(r){return r.json();});}
function gkey(id){return encodeURIComponent(String(id).replace(/[.#$\[\]\/]/g,'_'));}
function pushBest(id,score){var u=who();if(!u||!(score>0))return;var k=encodeURIComponent(u),g=gkey(id);
  fbJ('/arcade/best/'+k+'/'+g).then(function(cur){if(!(+cur>=score)){fbJ('/arcade/best/'+k+'/'+g,'PUT',score);fbJ('/arcade/top/'+g+'/'+k,'PUT',score);}})['catch'](function(){});}
var lastPull=0;
function syncBests(after){var u=who();if(!u||Date.now()-lastPull<60000)return;lastPull=Date.now();
  fbJ('/arcade/best/'+encodeURIComponent(u)).then(function(o){o=o||{};var changed=false;
    ALLG.forEach(function(g){var r=+o[gkey(g.id)]||0,l=best(g.id);if(r>l){ls('mx_arcade_best_'+g.id,String(r));changed=true;}else if(l>r)pushBest(g.id,l);});
    if(changed&&after)after();})['catch'](function(){});}
function showTop(id){var box=$('mxgTop');if(!box)return;
  fbJ('/arcade/top/'+gkey(id)).then(function(o){if(!$('mxgTop'))return;var rows=Object.keys(o||{}).map(function(k){return [decodeURIComponent(k),+o[k]||0];}).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
    if(!rows.length){box.innerHTML='';return;}
    box.innerHTML='<b>\uD83C\uDFC6 '+E(T('Top players'))+'</b><ol>'+rows.map(function(r){return '<li'+(r[0]===who()?' class="me"':'')+'><span>@'+E(r[0])+'</span><b>'+r[1]+'</b></li>';}).join('')+'</ol>';})['catch'](function(){});}

/* =====================================================================
   🎤 Presentation mode (Arcade 1.6): the teacher makes the exercises.
   A "set" = a title, a grade and slides {q, a, steps, opts[], time}.
   Sets are kept on this device and, when signed in, synced to
   /arcade/decks/<user>/<id> so they work on the website and in the app.
   Present: full screen, big question, timer, pen board, reveal the
   answer and steps, give a point to Team A or B, arrows to move.
   ===================================================================== */
var DK={list:null,edit:null,pv:null};
function dkLoad(){if(DK.list)return DK.list;try{DK.list=JSON.parse(ls('mx_arcade_decks')||'[]')||[];}catch(e){DK.list=[];}return DK.list;}
function dkSave(){ls('mx_arcade_decks',JSON.stringify(DK.list||[]));}
function dkId(){return 'd'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);}
function dkPush(d){var u=who();if(!u)return;fbJ('/arcade/decks/'+encodeURIComponent(u)+'/'+d.id,'PUT',d)['catch'](function(){});}
function dkDrop(id){var u=who();if(!u)return;fbJ('/arcade/decks/'+encodeURIComponent(u)+'/'+id,'PUT',null)['catch'](function(){});}
function dkSync(after){var u=who();if(!u)return;
  fbJ('/arcade/decks/'+encodeURIComponent(u)).then(function(o){o=o||{};var L=dkLoad(),ch=false,byId={};L.forEach(function(d){byId[d.id]=d;});
    Object.keys(o).forEach(function(id){var r=o[id];if(!r||!r.slides)return;var l=byId[id];if(!l){L.push(r);ch=true;}else if((r.updatedAt||0)>(l.updatedAt||0)){L[L.indexOf(l)]=r;ch=true;}});
    L.forEach(function(d){if(!o[d.id])dkPush(d);});
    if(ch){dkSave();if(after)after();}})['catch'](function(){});}
function dkFill(L,n){var out=[];for(var i=0;i<n;i++){var q=makeQ(L);out.push({q:qText(q),a:String(q.a),steps:'',opts:wrongs(q.a,3,L).map(String),time:30});}return out;}

/* the list of sets + the editor, drawn inside the class panel */
function presentPanel(host,L,rerender){
  var list=dkLoad();
  if(DK.edit){editDeck(host,L,rerender);return;}
  host.innerHTML='<p>'+E(T('Make your own exercises, then present them on the board: big question, timer, pen, reveal the answer and the steps, and points for each team.'))+'</p>'
    +'<div class="mxp-actions"><button type="button" class="mxm-btn pri" id="mxpNew">➕ '+E(T('New exercise set'))+'</button><button type="button" class="mxm-btn sec" id="mxpAuto">✨ '+E(T('Quick set for this grade'))+'</button></div>'
    +(list.length?'<div class="mxp-list">'+list.map(function(d,i){return '<div class="mxp-row"><div><b>'+E(d.title||T('Untitled'))+'</b><small>'+(d.slides||[]).length+' '+E(T('exercises'))+' · '+E(T((LEVELS[(d.grade||3)-1]||LEVELS[2])[1]))+'</small></div>'
      +'<span><button type="button" class="mxm-btn pri" data-play="'+i+'">▶ '+E(T('Present'))+'</button><button type="button" class="mxm-btn sec" data-edit="'+i+'">✏️</button><button type="button" class="mxm-btn sec" data-del="'+i+'" aria-label="'+E(T('Delete'))+'">🗑</button></span></div>';}).join('')+'</div>'
      :'<p class="mxp-empty">'+E(T('No exercise sets yet. Make one, or start with a quick set for this grade and edit it.'))+'</p>')
    +(who()?'':'<p class="mxp-note">'+E(T('Sign in to keep your sets on all your devices.'))+'</p>');
  $('mxpNew').onclick=function(){DK.edit={id:dkId(),title:'',grade:L,slides:[{q:'',a:'',steps:'',opts:[],time:30}]};rerender();};
  $('mxpAuto').onclick=function(){DK.edit={id:dkId(),title:T('Practice')+' · '+T(LEVELS[L-1][1]),grade:L,slides:dkFill(L,8)};rerender();};
  host.querySelectorAll('[data-play]').forEach(function(b){b.onclick=function(){presentDeck(list[+b.dataset.play]);};});
  host.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){DK.edit=JSON.parse(JSON.stringify(list[+b.dataset.edit]));rerender();};});
  host.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){var d=list[+b.dataset.del];if(!confirm(T('Delete this exercise set?')+' '+(d.title||'')))return;list.splice(+b.dataset.del,1);dkSave();dkDrop(d.id);rerender();};});
  dkSync(rerender);
}
function editDeck(host,L,rerender){
  var d=DK.edit;
  function slideHtml(s,i){return '<div class="mxp-slide" data-i="'+i+'"><div class="mxp-sh"><b>'+(i+1)+'</b><span><button type="button" data-up="'+i+'" aria-label="'+E(T('Move up'))+'">▲</button><button type="button" data-dn="'+i+'" aria-label="'+E(T('Move down'))+'">▼</button><button type="button" data-rm="'+i+'" aria-label="'+E(T('Remove'))+'">✕</button></span></div>'
    +'<label>'+E(T('Question'))+'<textarea data-f="q" rows="2" placeholder="'+E(T('e.g. 3/4 + 1/8 = ?'))+'">'+E(s.q)+'</textarea></label>'
    +'<div class="mxp-two"><label>'+E(T('Answer'))+'<input data-f="a" value="'+E(s.a)+'"></label><label>'+E(T('Time (seconds, 0 = no timer)'))+'<input data-f="time" type="number" min="0" max="600" value="'+(s.time==null?30:s.time)+'"></label></div>'
    +'<label>'+E(T('Worked steps (one per line, optional)'))+'<textarea data-f="steps" rows="2">'+E(s.steps||'')+'</textarea></label>'
    +'<label>'+E(T('Wrong choices for multiple choice (comma separated, optional)'))+'<input data-f="opts" value="'+E((s.opts||[]).join(', '))+'"></label></div>';}
  host.innerHTML='<div class="mxp-edit"><label>'+E(T('Set title'))+'<input id="mxpTitle" value="'+E(d.title)+'" placeholder="'+E(T('e.g. Fractions warm-up'))+'"></label>'
    +'<label>'+E(T('Grade'))+'<select id="mxpGrade">'+LEVELS.map(function(l){return '<option value="'+l[0]+'"'+(+l[0]===(d.grade||L)?' selected':'')+'>'+E(T(l[1]))+'</option>';}).join('')+'</select></label>'
    +d.slides.map(slideHtml).join('')
    +'<div class="mxp-actions"><button type="button" class="mxm-btn sec" id="mxpAdd">➕ '+E(T('Add exercise'))+'</button><button type="button" class="mxm-btn sec" id="mxpGen">✨ '+E(T('Add 5 for this grade'))+'</button></div>'
    +'<div class="mxp-actions"><button type="button" class="mxm-btn pri" id="mxpSave">💾 '+E(T('Save'))+'</button><button type="button" class="mxm-btn pri" id="mxpSavePlay">▶ '+E(T('Save and present'))+'</button><button type="button" class="mxm-btn sec" id="mxpCancel">'+E(T('Cancel'))+'</button></div><p class="mxp-err" id="mxpErr" role="alert"></p></div>';
  function read(){d.title=$('mxpTitle').value.trim();d.grade=+$('mxpGrade').value;
    host.querySelectorAll('.mxp-slide').forEach(function(el){var s=d.slides[+el.dataset.i];el.querySelectorAll('[data-f]').forEach(function(f){var k=f.dataset.f,v=f.value;
      if(k==='opts')s.opts=v.split(',').map(function(x){return x.trim();}).filter(Boolean).slice(0,5);else if(k==='time')s.time=Math.max(0,Math.min(600,parseInt(v,10)||0));else s[k]=v.trim();});});}
  host.querySelectorAll('[data-up],[data-dn],[data-rm]').forEach(function(b){b.onclick=function(){read();var i=+(b.dataset.up||b.dataset.dn||b.dataset.rm);
    if(b.dataset.rm!=null){d.slides.splice(i,1);if(!d.slides.length)d.slides.push({q:'',a:'',steps:'',opts:[],time:30});}
    else{var j=b.dataset.up!=null?i-1:i+1;if(j<0||j>=d.slides.length)return;var t=d.slides[i];d.slides[i]=d.slides[j];d.slides[j]=t;}rerender();};});
  $('mxpAdd').onclick=function(){read();d.slides.push({q:'',a:'',steps:'',opts:[],time:30});rerender();};
  $('mxpGen').onclick=function(){read();d.slides=d.slides.filter(function(s){return s.q;}).concat(dkFill(d.grade||L,5));rerender();};
  $('mxpCancel').onclick=function(){DK.edit=null;rerender();};
  function save(play){read();d.slides=d.slides.filter(function(s){return s.q;});
    if(!d.slides.length){$('mxpErr').textContent=T('Add at least one question.');if(!d.slides.length)d.slides.push({q:'',a:'',steps:'',opts:[],time:30});return;}
    if(!d.title)d.title=T('Exercise set');d.updatedAt=Date.now();var L2=dkLoad(),k=-1;L2.forEach(function(x,i){if(x.id===d.id)k=i;});if(k>-1)L2[k]=d;else L2.unshift(d);dkSave();dkPush(d);
    var saved=d;DK.edit=null;rerender();if(play)presentDeck(saved);}
  $('mxpSave').onclick=function(){save(false);};$('mxpSavePlay').onclick=function(){save(true);};
}

/* full-screen presenter */
function presentDeck(d){
  if(!d||!d.slides||!d.slides.length)return;
  closePresent();
  var ov=D.createElement('div');ov.id='mxpOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',d.title||T('Presentation'));ov.tabIndex=-1;
  ov.innerHTML='<div class="mxp-top"><button type="button" class="mxg-ib" id="mxpX" aria-label="'+E(T('Close'))+'">✕</button><b class="mxp-tt"></b><span class="mxp-n" id="mxpN"></span>'
    +'<span class="mxp-tm" id="mxpTm" aria-live="off"></span><button type="button" class="mxg-ib" id="mxpFs" aria-label="'+E(T('Full screen'))+'">⛶</button></div>'
    +'<div class="mxp-stage"><div class="mxp-q" id="mxpQ"></div><div class="mxp-body" id="mxpB" hidden></div><div class="mxp-opts" id="mxpOpts"></div><div class="mxp-ans" id="mxpA" hidden></div><canvas id="mxpPen"></canvas></div>'
    +'<div class="mxp-bar"><button type="button" class="mxm-btn sec" id="mxpPrev">← '+E(T('Previous'))+'</button><button type="button" class="mxm-btn sec" id="mxpPenB" aria-pressed="false">✏️ '+E(T('Pen'))+'</button><button type="button" class="mxm-btn sec" id="mxpClr">🧽 '+E(T('Clear'))+'</button>'
    +'<button type="button" class="mxm-btn pri" id="mxpShow">👀 '+E(T('Show answer'))+'</button>'
    +'<span class="mxp-teams"><button type="button" class="mxm-btn sec mxp-ta" id="mxpTA"></button><button type="button" class="mxm-btn sec mxp-tb" id="mxpTB"></button></span>'
    +'<button type="button" class="mxm-btn pri" id="mxpNext">'+E(T('Next'))+' →</button></div>';
  D.body.appendChild(ov);D.body.classList.add('mxg-on');ov.querySelector('.mxp-tt').textContent=d.title||'';
  var P=DK.pv={d:d,i:0,tm:null,left:0,pen:false,ov:ov},cv=$('mxpPen'),ctx=cv.getContext('2d'),drawing=false;
  function sizePen(){var r=cv.getBoundingClientRect(),dpr=Math.min(2,W.devicePixelRatio||1);cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#fde047';}
  P.rs=sizePen;W.addEventListener('resize',sizePen);
  function teams(){$('mxpTA').textContent='+1 '+teamName('A')+' ('+CLS.A+')';$('mxpTB').textContent='+1 '+teamName('B')+' ('+CLS.B+')';}
  function show(){var s=d.slides[P.i];clearInterval(P.tm);sizePen();ctx.clearRect(0,0,cv.width,cv.height);
    $('mxpN').textContent=(P.i+1)+' / '+d.slides.length;$('mxpQ').textContent=s.q;$('mxpA').hidden=true;
    var lrn=!!s.learn;$('mxpQ').classList.toggle('mxp-lt',lrn);$('mxpB').hidden=!lrn;$('mxpB').textContent=s.body||'';$('mxpShow').hidden=lrn;ov.querySelector('.mxp-teams').hidden=lrn;
    var st=(s.steps||'').split('\n').map(function(x){return x.trim();}).filter(Boolean);
    $('mxpA').innerHTML='<b>'+E(s.a)+'</b>'+(st.length?'<ol>'+st.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ol>':'');
    var opts=(s.opts&&s.opts.length&&s.a)?shuffle([s.a].concat(s.opts)):[];
    $('mxpOpts').innerHTML=opts.map(function(o,k){return '<span class="mxp-opt" data-o="'+E(o)+'">'+String.fromCharCode(65+k)+'. '+E(o)+'</span>';}).join('');
    P.left=s.time||0;$('mxpTm').textContent=P.left?'⏱ '+P.left:'';
    if(P.left)P.tm=setInterval(function(){P.left--;$('mxpTm').textContent='⏱ '+Math.max(0,P.left);if(P.left<=0){clearInterval(P.tm);reveal();}},1000);
    $('mxpPrev').disabled=P.i===0;$('mxpNext').textContent=P.i===d.slides.length-1?T('Finish')+' ✓':T('Next')+' →';teams();}
  function reveal(){clearInterval(P.tm);$('mxpA').hidden=false;var a=d.slides[P.i].a;ov.querySelectorAll('.mxp-opt').forEach(function(o){if(o.dataset.o===a)o.classList.add('ok');});}
  function go(k){var n=P.i+k;if(n<0)return;if(n>=d.slides.length){closePresent();return;}P.i=n;show();}
  $('mxpX').onclick=closePresent;$('mxpPrev').onclick=function(){go(-1);};$('mxpNext').onclick=function(){go(1);};$('mxpShow').onclick=reveal;
  $('mxpFs').onclick=function(){try{(ov.requestFullscreen||ov.webkitRequestFullscreen).call(ov);}catch(e){}};
  $('mxpTA').onclick=function(){CLS.A++;saveCls();teams();};$('mxpTB').onclick=function(){CLS.B++;saveCls();teams();};
  $('mxpPenB').onclick=function(){P.pen=!P.pen;this.setAttribute('aria-pressed',P.pen);this.classList.toggle('on',P.pen);cv.style.pointerEvents=P.pen?'auto':'none';};
  $('mxpClr').onclick=function(){ctx.clearRect(0,0,cv.width,cv.height);};
  function pos(e){var r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
  cv.addEventListener('pointerdown',function(e){if(!P.pen)return;drawing=true;var p=pos(e);ctx.beginPath();ctx.moveTo(p[0],p[1]);try{cv.setPointerCapture(e.pointerId);}catch(x){}});
  cv.addEventListener('pointermove',function(e){if(!drawing)return;var p=pos(e);ctx.lineTo(p[0],p[1]);ctx.stroke();});
  cv.addEventListener('pointerup',function(){drawing=false;});
  ov.addEventListener('keydown',function(e){if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='Escape')closePresent();else if(e.key==='ArrowRight'||e.key==='PageDown')go(1);else if(e.key==='ArrowLeft'||e.key==='PageUp')go(-1);else if(e.key===' '||e.key==='Enter'){e.preventDefault();reveal();}});
  try{history.pushState({mxp:1},'');P.pushed=true;}catch(e){}
  show();try{ov.focus();}catch(e){}
}
function closePresent(fromPop){var P=DK.pv;if(!P)return;DK.pv=null;clearInterval(P.tm);W.removeEventListener('resize',P.rs);if(P.ov.parentNode)P.ov.parentNode.removeChild(P.ov);D.body.classList.remove('mxg-on');
  if(P.pushed&&fromPop!==true){try{history.back();}catch(e){}}var c=$('content');if(c&&c.querySelector('.mxr-arcade'))renderArcade(c);}
W.addEventListener('popstate',function(){if(DK.pv)closePresent(true);});

/* =====================================================================
   1.6.0: Lessons for class mode. Each topic has an idea slide that
   explains it, a worked example, then practice questions with worked
   steps, all made for the class's grade. Teach it on the board with the
   presenter (pen, timer, team points), or copy the practice into
   "My sets" to edit it. English and French.
   ===================================================================== */
function X(e,f){return isFr()?f:e;}
function ng(n){return n<0?'−'+(-n):String(n);}
function pn(n){return n<0?'('+ng(n)+')':String(n);}
function fs(n,d){if(d<0){n=-n;d=-d;}var g=gcd(n,d)||1;n/=g;d/=g;return d===1?ng(n):ng(n)+'/'+d;}
function dec(x){var s=String(+(+x).toFixed(4));if(s.charAt(0)==='-')s='−'+s.slice(1);return isFr()?s.replace('.',','):s;}
function U(a,list){var out=[];a=String(a);list.forEach(function(x){x=String(x);if(x!==a&&out.indexOf(x)<0&&!/NaN|undefined|Infinity/.test(x))out.push(x);});return out.slice(0,3);}
function cop(lo,hi){var d=rnd(Math.max(2,lo),hi),n=rnd(1,d-1);while(gcd(n,d)!==1)n=rnd(1,d-1);return [n,d];}
function poly(c){/* c = [[coef,power],...] -> "3x² + 2x − 5" */
  var sup=['','','²','³','⁴','⁵','⁶'],out='';c.forEach(function(t){var k=t[0],p=t[1];if(!k)return;var abs=Math.abs(k),body=p===0?String(abs):(abs===1?'':abs)+'x'+(p===1?'':(sup[p]||'^'+p));
    out+=out?(k<0?' − ':' + ')+body:(k<0?'−':'')+body;});return out||'0';}

var LESSONS=[
{id:'place',icon:'🔢',lv:[1,3],n:['Place value','Valeur de position'],
 idea:['Every digit has a value that depends on its place: ones, tens, hundreds, thousands.\nIn 347, the 3 is worth 300, the 4 is worth 40 and the 7 is worth 7.',
       'Chaque chiffre a une valeur qui dépend de sa place : unités, dizaines, centaines, milliers.\nDans 347, le 3 vaut 300, le 4 vaut 40 et le 7 vaut 7.'],
 gen:function(L){var n,s,i;do{n=L<=1?rnd(11,99):L===2?rnd(101,999):rnd(1001,9999);s=String(n);i=rnd(0,s.length-1);}while(s[i]==='0'||s.split(s[i]).length>2);var dg=+s[i],p=Math.pow(10,s.length-1-i),v=dg*p,
   pl=X(['ones','tens','hundreds','thousands'],['unités','dizaines','centaines','milliers'])[s.length-1-i];
   return {q:X('What is the value of the digit '+dg+' in '+n+'?','Quelle est la valeur du chiffre '+dg+' dans '+n+' ?'),a:String(v),
     steps:[X('The '+dg+' is in the '+pl+' place','Le '+dg+' est à la place des '+pl),dg+' × '+p+' = '+v],opts:U(v,[dg,v*10,dg*(p>1?p/10:10),dg+p])};}},
{id:'addsub',icon:'➕',lv:[1,4],n:['Adding and taking away','Additionner et soustraire'],
 idea:['Split numbers into tens and ones.\nTo add: add the tens, add the ones, then put them together. 34 + 25 = 50 + 9 = 59.\nTo take away: take away the tens, then the ones. 74 − 31 = 44 − 1 = 43.',
       'Décompose les nombres en dizaines et unités.\nPour additionner : ajoute les dizaines, puis les unités, puis rassemble. 34 + 25 = 50 + 9 = 59.\nPour soustraire : enlève les dizaines, puis les unités. 74 − 31 = 44 − 1 = 43.'],
 gen:function(L){var hi=L<=1?20:L===2?99:L===3?499:999,a=rnd(5,hi),b=rnd(2,hi);if(Math.random()<.5){var bt=b-b%10,bo=b%10,s1=a+bt;
     return {q:a+' + '+b+' = ?',a:String(a+b),steps:(bt?[X('Add the tens: ','Ajoute les dizaines : ')+a+' + '+bt+' = '+s1]:[]).concat([X('Add the ones: ','Ajoute les unités : ')+s1+' + '+bo+' = '+(a+b)]),opts:U(a+b,[a+b+10,a+b-10,a+b+1,a+b-1])};}
   if(b>a){var t=a;a=b;b=t;}var tt=b-b%10,oo=b%10,m=a-tt;
   return {q:a+' − '+b+' = ?',a:String(a-b),steps:(tt?[X('Take away the tens: ','Enlève les dizaines : ')+a+' − '+tt+' = '+m]:[]).concat([X('Take away the ones: ','Enlève les unités : ')+m+' − '+oo+' = '+(a-b)]),opts:U(a-b,[a-b+10,a-b-10,a+b,a-b+1])};}},
{id:'times',icon:'✖️',lv:[2,5],n:['Times tables','Tables de multiplication'],
 idea:['Multiplying is adding the same number again and again: 4 × 3 = 4 + 4 + 4 = 12.\nThe order does not matter: 4 × 3 = 3 × 4.\nTip: for × 9, do × 10 and take one lot away: 7 × 9 = 70 − 7 = 63.',
       'Multiplier, c’est additionner le même nombre plusieurs fois : 4 × 3 = 4 + 4 + 4 = 12.\nL’ordre ne compte pas : 4 × 3 = 3 × 4.\nAstuce : pour × 9, fais × 10 et enlève une fois le nombre : 7 × 9 = 70 − 7 = 63.'],
 gen:function(L){var a=rnd(2,L<=2?5:L===3?10:12),b=rnd(2,L<=3?10:12),p=a*b,st;
   if(b===9)st=[a+' × 10 = '+(a*10),a*10+' − '+a+' = '+p];else if(a===9)st=[b+' × 10 = '+(b*10),b*10+' − '+b+' = '+p];
   else if(b>10)st=[a+' × 10 = '+(a*10),a+' × '+(b-10)+' = '+(a*(b-10)),a*10+' + '+a*(b-10)+' = '+p];
   else st=[a+' × '+(b-1)+' = '+a*(b-1),a*(b-1)+' + '+a+' = '+p];
   return {q:a+' × '+b+' = ?',a:String(p),steps:st,opts:U(p,[p+a,p-a,a*(b+1)+1,a+b])};}},
{id:'divide',icon:'➗',lv:[3,6],n:['Division','La division'],
 idea:['Dividing shares a number into equal groups. 12 ÷ 3 = 4 because 3 groups of 4 make 12.\nDivision is the opposite of times: use your tables. 3 × 4 = 12, so 12 ÷ 3 = 4.\nWhat cannot be shared is the remainder: 14 ÷ 3 = 4 remainder 2.',
       'Diviser, c’est partager un nombre en groupes égaux. 12 ÷ 3 = 4 car 3 groupes de 4 font 12.\nLa division est l’inverse de la multiplication : utilise tes tables. 3 × 4 = 12, donc 12 ÷ 3 = 4.\nCe qu’on ne peut pas partager, c’est le reste : 14 ÷ 3 = 4 reste 2.'],
 gen:function(L){var b=rnd(2,L<=3?5:12),k=rnd(2,12),r=L>=5&&Math.random()<.5?rnd(1,b-1):0,a=b*k+r,R=X(' remainder ',' reste '),ans=r?k+R+r:String(k);
   return {q:a+' ÷ '+b+' = ?',a:ans,steps:[b+' × '+k+' = '+b*k].concat(r?[a+' − '+b*k+' = '+r+X(' left over',' de reste')]:[X('So ','Donc ')+a+' ÷ '+b+' = '+k]),
     opts:U(ans,r?[k+R+(r+1),(k+1)+R+r,(k-1)+R+(r+b<a?r:1)]:[k+1,k-1,a-b])};}},
{id:'frac',icon:'🍕',lv:[2,4],n:['What is a fraction?','Qu’est-ce qu’une fraction ?'],
 idea:['A fraction is a part of a whole cut into equal parts.\nThe bottom number (denominator) says how many equal parts there are.\nThe top number (numerator) says how many parts we take.\n3/8 of a pizza: cut it into 8 equal slices, take 3.',
       'Une fraction est une partie d’un tout coupé en parts égales.\nLe nombre du bas (dénominateur) dit en combien de parts égales on coupe.\nLe nombre du haut (numérateur) dit combien de parts on prend.\n3/8 d’une pizza : coupe-la en 8 parts égales, prends-en 3.'],
 gen:function(L){var d=rnd(3,L<=2?8:12),n=rnd(1,d-1);
   return {q:X('A pizza is cut into '+d+' equal slices. You eat '+n+'. What fraction of the pizza did you eat?','Une pizza est coupée en '+d+' parts égales. Tu en manges '+n+'. Quelle fraction de la pizza as-tu mangée ?'),a:n+'/'+d,
     steps:[X(d+' equal slices: the bottom number is '+d,d+' parts égales : le nombre du bas est '+d),X(n+' eaten: the top number is '+n,n+' mangées : le nombre du haut est '+n)],opts:U(n+'/'+d,[d+'/'+n,n+'/'+(d+n),(d-n)+'/'+d])};}},
{id:'fracof',icon:'🧮',lv:[3,6],n:['Fraction of a number','Fraction d’un nombre'],
 idea:['To find a fraction of a number: divide by the bottom, then times by the top.\n3/4 of 20: 20 ÷ 4 = 5, then 5 × 3 = 15.',
       'Pour trouver une fraction d’un nombre : divise par le nombre du bas, puis multiplie par le nombre du haut.\n3/4 de 20 : 20 ÷ 4 = 5, puis 5 × 3 = 15.'],
 gen:function(L){var d=pick([2,3,4,5,6,8,10]),n=L<=3?1:rnd(1,d-1),m=d*rnd(2,L<=3?6:12),one=m/d,ans=one*n;
   return {q:X(n+'/'+d+' of '+m+' = ?',n+'/'+d+' de '+m+' = ?'),a:String(ans),steps:[m+' ÷ '+d+' = '+one].concat(n>1?[one+' × '+n+' = '+ans]:[]),opts:U(ans,[one,m-ans,m*n,ans+one])};}},
{id:'fraccmp',icon:'⚖️',lv:[3,6],n:['Comparing fractions','Comparer des fractions'],
 idea:['Same bottom number: the bigger top wins. 5/8 > 3/8.\nSame top number: the smaller bottom wins (bigger pieces). 1/3 > 1/5.\nDifferent fractions: change them to the same bottom number first, then compare the tops.',
       'Même nombre du bas : le plus grand numérateur gagne. 5/8 > 3/8.\nMême nombre du haut : le plus petit dénominateur gagne (les parts sont plus grandes). 1/3 > 1/5.\nSinon : mets-les au même dénominateur, puis compare les numérateurs.'],
 gen:function(L){var f1=cop(2,L<=4?8:12),f2=cop(2,L<=4?8:12);while(f1[0]*f2[1]===f2[0]*f1[1])f2=cop(2,12);
   var c=f1[1]*f2[1]/gcd(f1[1],f2[1]),x=f1[0]*c/f1[1],y=f2[0]*c/f2[1],A=f1[0]+'/'+f1[1],B=f2[0]+'/'+f2[1],big=x>y?A:B;
   return {q:X('Which is bigger: '+A+' or '+B+'?','Laquelle est la plus grande : '+A+' ou '+B+' ?'),a:big,
     steps:[X('Same bottom number: ','Même dénominateur : ')+c,A+' = '+x+'/'+c+X(' and ',' et ')+B+' = '+y+'/'+c,(x>y?x+' > '+y:y+' > '+x)+X(', so '+big+' is bigger',', donc '+big+' est la plus grande')],
     opts:[big===A?B:A,X('They are equal','Elles sont égales')]};}},
{id:'fraceq',icon:'🟰',lv:[4,7],n:['Equivalent fractions and simplifying','Fractions équivalentes et simplification'],
 idea:['Times or divide the top and the bottom by the same number and the fraction keeps its value: 1/2 = 2/4 = 3/6.\nTo simplify, divide the top and the bottom by the biggest number that goes into both. 12/18: both ÷ 6 = 2/3.',
       'Multiplie ou divise le numérateur et le dénominateur par le même nombre : la fraction garde sa valeur. 1/2 = 2/4 = 3/6.\nPour simplifier, divise le haut et le bas par le plus grand nombre qui divise les deux. 12/18 : les deux ÷ 6 = 2/3.'],
 gen:function(L){var f=cop(2,9),k=rnd(2,L<=5?5:9),N=f[0]*k,D=f[1]*k;
   if(Math.random()<.5)return {q:X('Simplify ','Simplifie ')+N+'/'+D,a:f[0]+'/'+f[1],steps:[X('The biggest number that goes into '+N+' and '+D+' is '+k,'Le plus grand nombre qui divise '+N+' et '+D+' est '+k),N+' ÷ '+k+' = '+f[0]+',  '+D+' ÷ '+k+' = '+f[1]],opts:U(f[0]+'/'+f[1],[f[0]+'/'+D,N+'/'+f[1],(f[0]+1)+'/'+f[1]])};
   return {q:f[0]+'/'+f[1]+' = ?/'+D,a:String(N),steps:[f[1]+' × '+k+' = '+D,X('Do the same to the top: ','Fais pareil en haut : ')+f[0]+' × '+k+' = '+N],opts:U(N,[N+k,f[0]+k,D-f[1]+f[0]])};}},
{id:'fracmix',icon:'🥧',lv:[4,7],n:['Mixed numbers','Nombres fractionnaires'],
 idea:['A mixed number is a whole number and a fraction: 2 3/4 means 2 wholes and 3/4.\nImproper to mixed: divide. 11/4: 11 ÷ 4 = 2 remainder 3, so 2 3/4.\nMixed to improper: whole × bottom + top. 2 3/4: 2 × 4 + 3 = 11, so 11/4.',
       'Un nombre fractionnaire, c’est un entier et une fraction : 2 3/4 veut dire 2 unités et 3/4.\nFraction vers nombre fractionnaire : divise. 11/4 : 11 ÷ 4 = 2 reste 3, donc 2 3/4.\nNombre fractionnaire vers fraction : entier × dénominateur + numérateur. 2 3/4 : 2 × 4 + 3 = 11, donc 11/4.'],
 gen:function(L){var d=rnd(2,9),w=rnd(1,5),r=rnd(1,d-1),N=w*d+r,M=w+' '+r+'/'+d,I=N+'/'+d;
   if(Math.random()<.5)return {q:X('Write '+I+' as a mixed number','Écris '+I+' en nombre fractionnaire'),a:M,steps:[N+' ÷ '+d+' = '+w+X(' remainder ',' reste ')+r,X(w+' wholes and '+r+'/'+d+' left',w+' entiers et il reste '+r+'/'+d)],opts:U(M,[(w+1)+' '+r+'/'+d,w+' '+d+'/'+r,r+' '+w+'/'+d])};
   return {q:X('Write '+M+' as an improper fraction','Écris '+M+' sous forme de fraction'),a:I,steps:[w+' × '+d+' = '+w*d,w*d+' + '+r+' = '+N,X('Keep the bottom: ','Garde le dénominateur : ')+I],opts:U(I,[(w*r+d)+'/'+d,(w+r)+'/'+d,N+'/'+(d+w)])};}},
{id:'fracadd',icon:'➕',lv:[4,8],n:['Adding and subtracting fractions','Additionner et soustraire des fractions'],
 idea:['Same bottom number: add or take away the tops, keep the bottom. 2/7 + 3/7 = 5/7.\nDifferent bottoms: change both fractions to the same bottom number first.\n1/3 + 1/4 = 4/12 + 3/12 = 7/12. Never add the bottoms!\nSimplify the answer at the end.',
       'Même dénominateur : additionne ou soustrais les numérateurs, garde le dénominateur. 2/7 + 3/7 = 5/7.\nDénominateurs différents : mets d’abord les deux fractions au même dénominateur.\n1/3 + 1/4 = 4/12 + 3/12 = 7/12. N’additionne jamais les dénominateurs !\nSimplifie la réponse à la fin.'],
 gen:function(L){var sub=Math.random()<.4,a,b,c,d;
   if(L<=5){d=rnd(3,12);b=d;a=rnd(1,d-1);c=rnd(1,d-1);}else{var f1=cop(2,10),f2=cop(2,10);while(f2[1]===f1[1])f2=cop(2,10);a=f1[0];b=f1[1];c=f2[0];d=f2[1];}
   if(sub&&a*d<c*b){var t=a;a=c;c=t;t=b;b=d;d=t;}
   var m=b*d/gcd(b,d),x=a*m/b,y=c*m/d,top=sub?x-y:x+y,ans=fs(top,m),op=sub?' − ':' + ';
   var st=b===d?[X('Same bottom number: ','Même dénominateur : ')+a+op+c+' = '+top,top+'/'+m+(ans!==top+'/'+m?' = '+ans:'')]
     :[X('Same bottom number: ','Même dénominateur : ')+m,a+'/'+b+' = '+x+'/'+m+',  '+c+'/'+d+' = '+y+'/'+m,x+op+y+' = '+top+'  →  '+top+'/'+m+(ans!==top+'/'+m?' = '+ans:'')];
   return {q:a+'/'+b+op+c+'/'+d+' = ?',a:ans,steps:st,opts:U(ans,[fs(sub?a-c:a+c,b===d?b:b+d),fs(top+1,m),fs(sub?a+c:a+c,b===d?b*2:b*d)])};}},
{id:'fracmul',icon:'✖️',lv:[5,9],n:['Multiplying and dividing fractions','Multiplier et diviser des fractions'],
 idea:['To multiply: top × top and bottom × bottom. 2/3 × 3/5 = 6/15 = 2/5.\nTo divide: keep the first fraction, change ÷ to ×, flip the second. 2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6.',
       'Pour multiplier : numérateur × numérateur et dénominateur × dénominateur. 2/3 × 3/5 = 6/15 = 2/5.\nPour diviser : garde la première fraction, change ÷ en ×, retourne la deuxième. 2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6.'],
 gen:function(L){var f1=cop(2,L<=6?6:10),f2=cop(2,L<=6?6:10),a=f1[0],b=f1[1],c=f2[0],d=f2[1];
   if(Math.random()<.5||L<=5){var ans=fs(a*c,b*d);return {q:a+'/'+b+' × '+c+'/'+d+' = ?',a:ans,steps:[X('Tops: ','En haut : ')+a+' × '+c+' = '+a*c+X(',  bottoms: ',',  en bas : ')+b+' × '+d+' = '+b*d,a*c+'/'+b*d+(ans!==a*c+'/'+b*d?' = '+ans:'')],opts:U(ans,[fs(a*d,b*c),fs(a+c,b+d),fs(a*c,b+d)])};}
   var ans2=fs(a*d,b*c);return {q:a+'/'+b+' ÷ '+c+'/'+d+' = ?',a:ans2,steps:[X('Keep, change, flip: ','Garde, change, retourne : ')+a+'/'+b+' × '+d+'/'+c,a*d+'/'+b*c+(ans2!==a*d+'/'+b*c?' = '+ans2:'')],opts:U(ans2,[fs(a*c,b*d),fs(b*c,a*d),fs(a*d,b*d)])};}},
{id:'dec',icon:'🔟',lv:[4,7],n:['Decimals','Les nombres décimaux'],
 idea:['After the decimal point come tenths, hundredths, thousandths. 0.3 = 3/10, 0.07 = 7/100.\nTo add or take away decimals, line up the decimal points.\nUseful ones: 1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/5 = 0.2.',
       'Après la virgule viennent les dixièmes, les centièmes, les millièmes. 0,3 = 3/10, 0,07 = 7/100.\nPour additionner ou soustraire des décimaux, aligne les virgules.\nÀ connaître : 1/2 = 0,5, 1/4 = 0,25, 3/4 = 0,75, 1/5 = 0,2.'],
 gen:function(L){var r=Math.random();
   if(r<.35){var F=pick([[1,2],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[1,10],[3,10],[7,10],[1,20],[3,20],[1,25],[7,100],[13,100]]),v=F[0]/F[1];
     return {q:X('Write '+F[0]+'/'+F[1]+' as a decimal','Écris '+F[0]+'/'+F[1]+' en nombre décimal'),a:dec(v),steps:[F[0]+' ÷ '+F[1]+' = '+dec(v)],opts:U(dec(v),[dec(v*10),dec(F[0]+F[1]/100),dec(v/10)])};}
   var a=rnd(11,L<=5?99:999)/10,b=rnd(11,L<=5?99:999)/100,sub=r>.7&&a>b,ans=sub?a-b:a+b,op=sub?' − ':' + ';
   return {q:dec(a)+op+dec(b)+' = ?',a:dec(ans),steps:[X('Line up the decimal points: ','Aligne les virgules : ')+dec(a.toFixed(2))+op+dec(b),X('Answer: ','Réponse : ')+dec(ans)],opts:U(dec(ans),[dec(sub?ans+.1:ans-.1),dec(sub?a-b*10:a+b*10),dec(ans+.01)])};}},
{id:'pct',icon:'💯',lv:[6,9],n:['Percentages','Les pourcentages'],
 idea:['Per cent means out of 100: 35% = 35/100 = 0.35.\n10% is a tenth: divide by 10. 50% is a half. 25% is a quarter.\nTo find p% of a number: number × p ÷ 100. 15% of 80 = 80 × 15 ÷ 100 = 12.',
       'Pour cent veut dire sur 100 : 35 % = 35/100 = 0,35.\n10 %, c’est un dixième : divise par 10. 50 %, c’est la moitié. 25 %, c’est le quart.\nPour trouver p % d’un nombre : nombre × p ÷ 100. 15 % de 80 = 80 × 15 ÷ 100 = 12.'],
 gen:function(L){var p=pick([10,20,25,50,75,5,15,30,40,60]),step=100/gcd(p,100),n=step*rnd(1,L<=7?8:20),ans=n*p/100;
   if(L>=8&&Math.random()<.4){return {q:X('What percent of '+n+' is '+ans+'?','Quel pourcentage de '+n+' représente '+ans+' ?'),a:p+' %',steps:[ans+' ÷ '+n+' = '+dec(ans/n),dec(ans/n)+' × 100 = '+p+' %'],opts:U(p+' %',[(p+5)+' %',(100-p)+' %',(p*2)+' %'])};}
   return {q:X(p+'% of '+n+' = ?',p+' % de '+n+' = ?'),a:dec(ans),steps:[p+'% = '+p+'/100',n+' × '+p+' ÷ 100 = '+dec(ans)],opts:U(dec(ans),[dec(ans*2),dec(n-ans),dec(ans+n/10)])};}},
{id:'ratio',icon:'⚗️',lv:[6,9],n:['Ratio and sharing','Ratios et partages'],
 idea:['A ratio compares amounts: 2 : 3 means for every 2 of one there are 3 of the other.\nTo share in a ratio: add the parts, find one part, then times.\nShare 40 in the ratio 3 : 5. 3 + 5 = 8 parts, 40 ÷ 8 = 5, so 15 and 25.',
       'Un ratio compare des quantités : 2 : 3 veut dire que pour 2 de l’un, il y a 3 de l’autre.\nPour partager selon un ratio : additionne les parts, trouve une part, puis multiplie.\nPartage 40 selon le ratio 3 : 5. 3 + 5 = 8 parts, 40 ÷ 8 = 5, donc 15 et 25.'],
 gen:function(L){var a=rnd(1,7),b=rnd(1,7);while(b===a||gcd(a,b)!==1)b=rnd(1,7);var k=rnd(2,12),N=(a+b)*k,big=Math.max(a,b)*k;
   return {q:X('Share '+N+' in the ratio '+a+' : '+b+'. How much is the bigger share?','Partage '+N+' selon le ratio '+a+' : '+b+'. Combien vaut la plus grande part ?'),a:String(big),
     steps:[a+' + '+b+' = '+(a+b)+X(' parts',' parts'),N+' ÷ '+(a+b)+' = '+k+X(' (one part)',' (une part)'),Math.max(a,b)+' × '+k+' = '+big],opts:U(big,[Math.min(a,b)*k,N-k,big+k])};}},
{id:'neg',icon:'🌡️',lv:[6,8],n:['Negative numbers','Les nombres négatifs'],
 idea:['Negative numbers are below zero, like temperatures in winter.\nAdding a negative is taking away: 5 + (−8) = −3.\nTaking away a negative is adding: 4 − (−6) = 10.\nTimes or divide: same signs give +, different signs give −.',
       'Les nombres négatifs sont sous zéro, comme les températures en hiver.\nAjouter un négatif, c’est soustraire : 5 + (−8) = −3.\nSoustraire un négatif, c’est ajouter : 4 − (−6) = 10.\nMultiplier ou diviser : mêmes signes donnent +, signes différents donnent −.'],
 gen:function(L){var a=rnd(-12,12)||-3,b=rnd(-12,12)||-5,o=rnd(0,2),ans,st;
   if(o===0){ans=a+b;st=[b<0?X('Adding a negative is taking away: ','Ajouter un négatif, c’est soustraire : ')+ng(a)+' − '+(-b)+' = '+ng(ans):ng(a)+' + '+b+' = '+ng(ans)];return {q:ng(a)+' + '+pn(b)+' = ?',a:ng(ans),steps:st,opts:U(ng(ans),[ng(a-b),ng(-ans),ng(ans+1)])};}
   if(o===1){ans=a-b;st=[b<0?X('Taking away a negative is adding: ','Soustraire un négatif, c’est ajouter : ')+ng(a)+' + '+(-b)+' = '+ng(ans):ng(a)+' − '+b+' = '+ng(ans)];return {q:ng(a)+' − '+pn(b)+' = ?',a:ng(ans),steps:st,opts:U(ng(ans),[ng(a+b),ng(-ans),ng(ans-1)])};}
   ans=a*b;return {q:ng(a)+' × '+pn(b)+' = ?',a:ng(ans),steps:[Math.abs(a)+' × '+Math.abs(b)+' = '+Math.abs(ans),(a<0)===(b<0)?X('Same signs: the answer is positive','Mêmes signes : la réponse est positive'):X('Different signs: the answer is negative','Signes différents : la réponse est négative')],opts:U(ng(ans),[ng(-ans),ng(a+b),ng(ans+a)])};}},
{id:'bodmas',icon:'🧩',lv:[5,8],n:['Order of operations','Priorité des opérations'],
 idea:['Work in this order: brackets first, then powers, then × and ÷ (left to right), then + and − (left to right).\n2 + 3 × 4 = 2 + 12 = 14, not 20.\n(2 + 3) × 4 = 5 × 4 = 20.',
       'Calcule dans cet ordre : d’abord les parenthèses, puis les puissances, puis × et ÷ (de gauche à droite), puis + et − (de gauche à droite).\n2 + 3 × 4 = 2 + 12 = 14, pas 20.\n(2 + 3) × 4 = 5 × 4 = 20.'],
 gen:function(L){var a=rnd(2,12),b=rnd(2,9),c=rnd(2,9),o=rnd(0,3),ans,q,st;
   if(o===0){ans=a+b*c;q=a+' + '+b+' × '+c;st=[X('× first: ','× d’abord : ')+b+' × '+c+' = '+b*c,a+' + '+b*c+' = '+ans];return {q:q+' = ?',a:String(ans),steps:st,opts:U(ans,[(a+b)*c,a*b+c,ans+1])};}
   if(o===1){ans=(a+b)*c;q='('+a+' + '+b+') × '+c;st=[X('Brackets first: ','Parenthèses d’abord : ')+a+' + '+b+' = '+(a+b),(a+b)+' × '+c+' = '+ans];return {q:q+' = ?',a:String(ans),steps:st,opts:U(ans,[a+b*c,a*c+b,ans-c])};}
   if(o===2){var m=b*c;a=m+rnd(1,20);ans=a-m/c;q=a+' − '+m+' ÷ '+c;st=[X('÷ first: ','÷ d’abord : ')+m+' ÷ '+c+' = '+m/c,a+' − '+m/c+' = '+ans];return {q:q+' = ?',a:String(ans),steps:st,opts:U(ans,[ans+1,ans+c,a-m])};}
   ans=a*a-b*c;q=a+'² − '+b+' × '+c;st=[X('Powers first: ','Puissances d’abord : ')+a+'² = '+a*a,X('Then × : ','Puis × : ')+b+' × '+c+' = '+b*c,a*a+' − '+b*c+' = '+ng(ans)];return {q:q+' = ?',a:ng(ans),steps:st,opts:U(ng(ans),[ng((a*a-b)*c),ng(a*2-b*c),ng(ans+b)])};}},
{id:'pow',icon:'🔺',lv:[6,10],n:['Powers and square roots','Puissances et racines carrées'],
 idea:['A power says how many times to multiply a number by itself: 5³ = 5 × 5 × 5 = 125.\nA square root goes back: √49 = 7 because 7² = 49.\nLearn the squares up to 15² = 225.',
       'Une puissance dit combien de fois multiplier un nombre par lui-même : 5³ = 5 × 5 × 5 = 125.\nLa racine carrée fait l’inverse : √49 = 7 car 7² = 49.\nApprends les carrés jusqu’à 15² = 225.'],
 gen:function(L){var r=Math.random(),sup={2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶'};
   if(r<.4){var n=rnd(2,15);return {q:'√'+n*n+' = ?',a:String(n),steps:[n+' × '+n+' = '+n*n,X('So ','Donc ')+'√'+n*n+' = '+n],opts:U(n,[n+1,n-1,n*n/2])};}
   var b=rnd(2,L<=7?6:9),e=b===2?rnd(2,6):rnd(2,3),v=Math.pow(b,e),parts=[];for(var i=0;i<e;i++)parts.push(b);
   return {q:b+sup[e]+' = ?',a:String(v),steps:[parts.join(' × ')+' = '+v],opts:U(v,[b*e,v+b,Math.pow(b,e-1)])};}},
{id:'eq',icon:'🔍',lv:[7,10],n:['Solving equations','Résoudre des équations'],
 idea:['An equation is a balance: do the same thing to both sides.\nUndo the operations in reverse order.\n3x + 5 = 20: take away 5 → 3x = 15, divide by 3 → x = 5.\nCheck: 3 × 5 + 5 = 20 ✓',
       'Une équation est une balance : fais la même chose des deux côtés.\nDéfais les opérations dans l’ordre inverse.\n3x + 5 = 20 : enlève 5 → 3x = 15, divise par 3 → x = 5.\nVérifie : 3 × 5 + 5 = 20 ✓'],
 gen:function(L){var x=rnd(-6,12)||4,a=rnd(2,9),b=rnd(1,15),ans='x = '+ng(x);
   if(L<=7&&Math.random()<.5){var c=x+b;return {q:X('Solve: ','Résous : ')+'x + '+b+' = '+ng(c),a:ans,steps:[X('Take away '+b+' from both sides','Enlève '+b+' des deux côtés'),'x = '+ng(c)+' − '+b+' = '+ng(x)],opts:U(ans,['x = '+ng(c+b),'x = '+ng(-x),'x = '+ng(x+1)])};}
   var neg=Math.random()<.3,c2=neg?a*x-b:a*x+b,lhs=a+'x '+(neg?'− ':'+ ')+b;
   return {q:X('Solve: ','Résous : ')+lhs+' = '+ng(c2),a:ans,steps:[(neg?X('Add '+b+' to both sides: ','Ajoute '+b+' des deux côtés : '):X('Take away '+b+' from both sides: ','Enlève '+b+' des deux côtés : '))+a+'x = '+ng(a*x),
     X('Divide both sides by '+a+': ','Divise les deux côtés par '+a+' : ')+'x = '+ng(x),X('Check: ','Vérifie : ')+a+' × '+pn(x)+(neg?' − ':' + ')+b+' = '+ng(c2)+' ✓'],opts:U(ans,['x = '+ng(neg?x-1:x+1),'x = '+fs(c2,a),'x = '+ng(-x)])};}},
{id:'area',icon:'📐',lv:[3,7],n:['Area and perimeter','Aire et périmètre'],
 idea:['Perimeter is the distance all the way around a shape: add all the sides.\nArea is the space inside, in squares. Rectangle: length × width.\nTriangle: base × height ÷ 2.\nA 5 cm by 3 cm rectangle: perimeter 16 cm, area 15 cm².',
       'Le périmètre est la longueur du tour d’une figure : additionne tous les côtés.\nL’aire est l’espace à l’intérieur, en carrés. Rectangle : longueur × largeur.\nTriangle : base × hauteur ÷ 2.\nUn rectangle de 5 cm sur 3 cm : périmètre 16 cm, aire 15 cm².'],
 gen:function(L){var l=rnd(3,L<=4?10:20),w=rnd(2,l-1),r=Math.random();
   if(L>=5&&r<.33){var b=2*rnd(2,10),h=rnd(2,12),A=b*h/2;return {q:X('A triangle has base '+b+' cm and height '+h+' cm. What is its area?','Un triangle a une base de '+b+' cm et une hauteur de '+h+' cm. Quelle est son aire ?'),a:A+' cm²',steps:[b+' × '+h+' = '+b*h,b*h+' ÷ 2 = '+A+' cm²'],opts:U(A+' cm²',[b*h+' cm²',(b+h)+' cm²',(A+b)+' cm²'])};}
   if(r<.66)return {q:X('A rectangle is '+l+' cm long and '+w+' cm wide. What is its area?','Un rectangle mesure '+l+' cm de long et '+w+' cm de large. Quelle est son aire ?'),a:l*w+' cm²',steps:[X('Area = length × width','Aire = longueur × largeur'),l+' × '+w+' = '+l*w+' cm²'],opts:U(l*w+' cm²',[2*(l+w)+' cm²',(l+w)+' cm²',l*w+l+' cm²'])};
   return {q:X('A rectangle is '+l+' cm long and '+w+' cm wide. What is its perimeter?','Un rectangle mesure '+l+' cm de long et '+w+' cm de large. Quel est son périmètre ?'),a:2*(l+w)+' cm',steps:[X('Add all four sides','Additionne les quatre côtés'),l+' + '+w+' + '+l+' + '+w+' = '+2*(l+w)+' cm'],opts:U(2*(l+w)+' cm',[l*w+' cm',(l+w)+' cm',2*l+w+' cm'])};}},
{id:'angle',icon:'📏',lv:[5,8],n:['Angles','Les angles'],
 idea:['Angles on a straight line add up to 180°.\nAngles in a triangle add up to 180°.\nAngles around a point add up to 360°.\nA right angle is 90°.',
       'Les angles sur une droite font 180° au total.\nLes angles d’un triangle font 180° au total.\nLes angles autour d’un point font 360° au total.\nUn angle droit mesure 90°.'],
 gen:function(L){var r=Math.random();
   if(r<.4){var a=rnd(20,100),b=rnd(20,150-a),c=180-a-b;return {q:X('Two angles of a triangle are '+a+'° and '+b+'°. What is the third angle?','Deux angles d’un triangle mesurent '+a+'° et '+b+'°. Combien mesure le troisième ?'),a:c+'°',steps:[a+' + '+b+' = '+(a+b),'180 − '+(a+b)+' = '+c+'°'],opts:U(c+'°',[360-a-b+'°',(c+10)+'°',(a+b)+'°'])};}
   if(r<.7){var s=rnd(15,165),t=180-s;return {q:X('Two angles on a straight line. One is '+s+'°. What is the other?','Deux angles sur une droite. L’un mesure '+s+'°. Combien mesure l’autre ?'),a:t+'°',steps:['180 − '+s+' = '+t+'°'],opts:U(t+'°',[(360-s)+'°',(90-s>0?90-s:s+10)+'°',(t+10)+'°'])};}
   var p=rnd(60,150),q=rnd(40,330-p),u=360-p-q;return {q:X('Three angles around a point: '+p+'°, '+q+'° and ?','Trois angles autour d’un point : '+p+'°, '+q+'° et ?'),a:u+'°',steps:[p+' + '+q+' = '+(p+q),'360 − '+(p+q)+' = '+u+'°'],opts:U(u+'°',[(180-p-q>0?180-p-q:u+20)+'°',(u+10)+'°',(p+q)+'°'])};}},
{id:'stats',icon:'📊',lv:[6,9],n:['Mean, median and range','Moyenne, médiane et étendue'],
 idea:['Mean: add all the values and divide by how many there are.\nMedian: put the values in order and take the middle one.\nRange: biggest − smallest.\nFor 3, 7, 8, 10, 12: mean 8, median 8, range 9.',
       'Moyenne : additionne toutes les valeurs et divise par leur nombre.\nMédiane : range les valeurs dans l’ordre et prends celle du milieu.\nÉtendue : la plus grande − la plus petite.\nPour 3, 7, 8, 10, 12 : moyenne 8, médiane 8, étendue 9.'],
 gen:function(L){var v=[];for(var i=0;i<4;i++)v.push(rnd(1,20));var s=v.reduce(function(x,y){return x+y;},0),last=5-(s%5);if(last===5)last=0;v.push(last+5*rnd(0,3));if(!v[4])v[4]=5;
   s=v.reduce(function(x,y){return x+y;},0);while(s%5){v[4]++;s++;}var o=v.slice().sort(function(x,y){return x-y;}),mean=s/5,med=o[2],rg=o[4]-o[0],list=v.join(', '),k=rnd(0,2);
   if(k===0)return {q:X('Find the mean of: ','Trouve la moyenne de : ')+list,a:String(mean),steps:[v.join(' + ')+' = '+s,s+' ÷ 5 = '+mean],opts:U(mean,[med,s,mean+1])};
   if(k===1)return {q:X('Find the median of: ','Trouve la médiane de : ')+list,a:String(med),steps:[X('In order: ','Dans l’ordre : ')+o.join(', '),X('The middle value is ','La valeur du milieu est ')+med],opts:U(med,[v[2],mean,o[3]])};
   return {q:X('Find the range of: ','Trouve l’étendue de : ')+list,a:String(rg),steps:[X('Biggest ','Plus grande ')+o[4]+X(', smallest ',', plus petite ')+o[0],o[4]+' − '+o[0]+' = '+rg],opts:U(rg,[o[4],o[4]+o[0],med])};}},
{id:'prob',icon:'🎲',lv:[6,10],n:['Probability','Les probabilités'],
 idea:['Probability = number of ways it can happen ÷ total number of outcomes.\nIt goes from 0 (impossible) to 1 (certain).\nA bag has 3 red and 5 blue balls. P(red) = 3/8.',
       'Probabilité = nombre de cas favorables ÷ nombre total de cas.\nElle va de 0 (impossible) à 1 (certain).\nUn sac contient 3 boules rouges et 5 bleues. P(rouge) = 3/8.'],
 gen:function(L){var r=rnd(1,8),b=rnd(1,8),g=rnd(0,6),t=r+b+g,ans=fs(r,t);
   if(Math.random()<.3){var f=rnd(1,6);return {q:X('You roll a dice. What is the probability of getting a number bigger than '+f+'?','Tu lances un dé. Quelle est la probabilité d’obtenir un nombre plus grand que '+f+' ?'),a:fs(6-f,6),steps:[X((6-f)+' numbers are bigger than '+f,(6-f)+' nombres sont plus grands que '+f),(6-f)+'/6'+(fs(6-f,6)!==(6-f)+'/6'?' = '+fs(6-f,6):'')],opts:U(fs(6-f,6),[fs(f,6),fs(6-f+1,6),(6-f)+'/'+f])};}
   return {q:X('A bag has '+r+' red, '+b+' blue'+(g?' and '+g+' green':'')+' balls. You pick one. What is the probability it is red?','Un sac contient '+r+' boules rouges, '+b+' bleues'+(g?' et '+g+' vertes':'')+'. Tu en tires une. Quelle est la probabilité qu’elle soit rouge ?'),a:ans,
     steps:[X('Total: ','Total : ')+[r,b].concat(g?[g]:[]).join(' + ')+' = '+t,X('Red: ','Rouges : ')+r,r+'/'+t+(ans!==r+'/'+t?' = '+ans:'')],opts:U(ans,[fs(r,b),fs(b,t),fs(r,t+r)])};}},
{id:'pyth',icon:'📐',lv:[8,11],n:['Pythagoras','Le théorème de Pythagore'],
 idea:['In a right-angled triangle: a² + b² = c², where c is the longest side (the hypotenuse).\nSides 6 and 8: 36 + 64 = 100, so c = √100 = 10.\nFor a shorter side: c² − b² = a².',
       'Dans un triangle rectangle : a² + b² = c², où c est le plus grand côté (l’hypoténuse).\nCôtés 6 et 8 : 36 + 64 = 100, donc c = √100 = 10.\nPour un petit côté : c² − b² = a².'],
 gen:function(L){var T3=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29]]),k=T3[0]===3?rnd(1,5):rnd(1,2),a=T3[0]*k,b=T3[1]*k,c=T3[2]*k;
   if(Math.random()<.6)return {q:X('A right-angled triangle has short sides '+a+' and '+b+'. How long is the hypotenuse?','Un triangle rectangle a deux petits côtés de '+a+' et '+b+'. Combien mesure l’hypoténuse ?'),a:String(c),steps:[a+'² + '+b+'² = '+a*a+' + '+b*b+' = '+c*c,'√'+c*c+' = '+c],opts:U(c,[a+b,c+1,b+1])};
   return {q:X('A right-angled triangle has hypotenuse '+c+' and one side '+a+'. How long is the other side?','Un triangle rectangle a une hypoténuse de '+c+' et un côté de '+a+'. Combien mesure l’autre côté ?'),a:String(b),steps:[c+'² − '+a+'² = '+c*c+' − '+a*a+' = '+b*b,'√'+b*b+' = '+b],opts:U(b,[c-a,c+a,b+1])};}},
{id:'slope',icon:'📈',lv:[8,11],n:['Straight lines and slope','Droites et pente'],
 idea:['A straight line is y = mx + b: m is the slope (how steep), b is where it crosses the y-axis.\nSlope between two points = change in y ÷ change in x.\nFrom (1, 2) to (3, 8): (8 − 2) ÷ (3 − 1) = 3.',
       'Une droite s’écrit y = mx + b : m est la pente (l’inclinaison), b est l’endroit où elle coupe l’axe des y.\nPente entre deux points = variation de y ÷ variation de x.\nDe (1, 2) à (3, 8) : (8 − 2) ÷ (3 − 1) = 3.'],
 gen:function(L){var m=rnd(-5,6)||2,x1=rnd(-5,5),dx=rnd(1,5),y1=rnd(-9,9),x2=x1+dx,y2=y1+m*dx;
   if(Math.random()<.5)return {q:X('Find the slope of the line through ('+ng(x1)+', '+ng(y1)+') and ('+ng(x2)+', '+ng(y2)+')','Trouve la pente de la droite passant par ('+ng(x1)+', '+ng(y1)+') et ('+ng(x2)+', '+ng(y2)+')'),a:ng(m),
     steps:[X('Change in y: ','Variation de y : ')+ng(y2)+' − '+pn(y1)+' = '+ng(y2-y1),X('Change in x: ','Variation de x : ')+ng(x2)+' − '+pn(x1)+' = '+dx,ng(y2-y1)+' ÷ '+dx+' = '+ng(m)],opts:U(ng(m),[ng(-m),fs(dx,m*dx||1),ng(m+1)])};
   var b=rnd(-9,9),x=rnd(-4,6),y=m*x+b;return {q:'y = '+poly([[m,1],[b,0]])+X('. Find y when x = ',' . Trouve y quand x = ')+ng(x),a:ng(y),steps:['y = '+ng(m)+' × '+pn(x)+(b<0?' − '+(-b):' + '+b),'y = '+ng(m*x)+(b<0?' − '+(-b):' + '+b)+' = '+ng(y)],opts:U(ng(y),[ng(m*x-b),ng(m+x+b),ng(y+m)])};}},
{id:'quad',icon:'🎯',lv:[9,13],n:['Quadratic equations','Équations du second degré'],
 idea:['To solve x² + bx + c = 0, find two numbers that multiply to c and add to b.\nx² − 5x + 6 = 0: −2 and −3 multiply to 6 and add to −5.\nSo (x − 2)(x − 3) = 0, and x = 2 or x = 3.',
       'Pour résoudre x² + bx + c = 0, trouve deux nombres dont le produit est c et la somme est b.\nx² − 5x + 6 = 0 : −2 et −3 ont pour produit 6 et pour somme −5.\nDonc (x − 2)(x − 3) = 0, et x = 2 ou x = 3.'],
 gen:function(L){var p=rnd(-7,7)||1,q=rnd(-7,7)||-2;if(p>q){var t=p;p=q;q=t;}var B=-(p+q),C=p*q,OR=X(' or ',' ou '),ans=p===q?'x = '+ng(p):'x = '+ng(p)+OR+'x = '+ng(q);
   function fac(r){return r<0?'(x + '+(-r)+')':r===0?'x':'(x − '+r+')';}
   return {q:X('Solve: ','Résous : ')+poly([[1,2],[B,1],[C,0]])+' = 0',a:ans,steps:[X('Two numbers that multiply to '+ng(C)+' and add to '+ng(B)+': ','Deux nombres de produit '+ng(C)+' et de somme '+ng(B)+' : ')+ng(-p)+X(' and ',' et ')+ng(-q),fac(p)+fac(q)+' = 0',ans],
     opts:U(ans,['x = '+ng(-p)+OR+'x = '+ng(-q),'x = '+ng(p+1)+OR+'x = '+ng(q),'x = '+ng(B)+OR+'x = '+ng(C)])};}},
{id:'deriv',icon:'📉',lv:[11,13],n:['Derivatives','Les dérivées'],
 idea:['The derivative gives the slope of a curve at each point.\nPower rule: the derivative of xⁿ is n·xⁿ⁻¹. Numbers in front stay; a constant gives 0.\nf(x) = 3x² + 5x − 4  →  f′(x) = 6x + 5.',
       'La dérivée donne la pente d’une courbe en chaque point.\nRègle des puissances : la dérivée de xⁿ est n·xⁿ⁻¹. Les coefficients restent ; une constante donne 0.\nf(x) = 3x² + 5x − 4  →  f′(x) = 6x + 5.'],
 gen:function(L){var n=rnd(2,L>=12?4:3),a=rnd(1,6),b=rnd(-9,9)||3,c=rnd(-9,9),f=poly([[a,n],[b,1],[c,0]]),d=poly([[a*n,n-1],[b,0]]);
   if(Math.random()<.4){var x=rnd(-3,3),v=a*n*Math.pow(x,n-1)+b;return {q:X('f(x) = '+f+'. Find f′('+ng(x)+')','f(x) = '+f+'. Calcule f′('+ng(x)+')'),a:ng(v),steps:['f′(x) = '+d,'f′('+ng(x)+') = '+ng(v)],opts:U(ng(v),[ng(v+b),ng(a*Math.pow(x,n)+b*x+c),ng(-v)])};}
   return {q:X('Find the derivative of f(x) = ','Trouve la dérivée de f(x) = ')+f,a:"f′(x) = "+d,steps:[poly([[a,n]])+'  →  '+poly([[a*n,n-1]]),poly([[b,1]])+'  →  '+ng(b),ng(c)+'  →  0'],
     opts:U("f′(x) = "+d,["f′(x) = "+poly([[a*n,n-1],[b,0],[c,0]]),"f′(x) = "+poly([[a,n-1],[b,0]]),"f′(x) = "+poly([[a*n,n+1],[b,0]])])};}}
];
function lsnName(t){return isFr()?t.n[1]:t.n[0];}
function lsnFor(L){return LESSONS.filter(function(t){return L>=t.lv[0]&&L<=t.lv[1];});}
var LSN={all:false};
function tw(ctx,s,cx,y,maxW,size,col){ctx.font='800 '+size+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=col||'#fff';
  var words=String(s).split(' '),lines=[],cur='';words.forEach(function(w){var t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;});if(cur)lines.push(cur);
  lines.forEach(function(l,i){ctx.fillText(l,cx,y+i*size*1.2);});ctx.textBaseline='middle';return lines.length*size*1.2;}
function bbtn(ctx,x,y,w,h,txt,bg,fg,size){ctx.fillStyle=bg;rr(ctx,x,y,w,h,Math.min(18,h/2));ctx.fill();label(ctx,txt,x+w/2,y+h/2,Math.max(12,Math.min(size||24,h*.45,(w-12)/(String(txt).length*.6))),fg||'#fff',false);return {x:x,y:y,w:w,h:h};}
function gg(a,C,R){var cs=Math.min(a.w/C,a.h/R);return {cs:cs,ox:a.x+(a.w-cs*C)/2,oy:a.y+(a.h-cs*R)/2,C:C,R:R};}
function gcell(G2,x,y){var c=Math.floor((x-G2.ox)/G2.cs),r=Math.floor((y-G2.oy)/G2.cs);return c>=0&&r>=0&&c<G2.C&&r<G2.R?[c,r]:null;}
function gdraw(ctx,G2,fn){for(var c=0;c<G2.C;c++)for(var r=0;r<G2.R;r++){var col=fn(c,r);ctx.fillStyle=col||'rgba(255,255,255,.9)';ctx.fillRect(G2.ox+c*G2.cs+1,G2.oy+r*G2.cs+1,G2.cs-2,G2.cs-2);}}
function rectCells(x,y,w,h){var o={};for(var c=x;c<x+w;c++)for(var r=y;r<y+h;r++)o[c+','+r]=1;return o;}
function cellsPerim(o){var p=0;Object.keys(o).forEach(function(k){var a=k.split(','),c=+a[0],r=+a[1];[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){if(!o[(c+d[0])+','+(r+d[1])])p++;});});return p;}
function shapeCells(C,R,lshape){var w=rnd(2,C-1),h=rnd(2,R-1),x=rnd(0,C-w),y=rnd(0,R-h),o=rectCells(x,y,w,h);
  if(lshape&&w>=3&&h>=3){var cw=rnd(1,w-2),ch=rnd(1,h-2);for(var c=x+w-cw;c<x+w;c++)for(var r=y;r<y+ch;r++)delete o[c+','+r];}return o;}
function pizza(ctx,cx,cy,r,d,on,col){var st=6.2832/d;ctx.fillStyle='#b45309';ctx.beginPath();ctx.arc(cx,cy,r+Math.max(4,r*.06),0,6.2832);ctx.fill();
  for(var i=0;i<d;i++){var a0=-1.5708+i*st;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a0,a0+st);ctx.closePath();ctx.fillStyle=on[i]?(col||'#f472b6'):'#fde68a';ctx.fill();ctx.strokeStyle='#92400e';ctx.lineWidth=3;ctx.stroke();}}
function pizzaHit(cx,cy,r,d,x,y){var dx=x-cx,dy=y-cy;if(dx*dx+dy*dy>r*r)return -1;var a=Math.atan2(dy,dx)+1.5708;if(a<0)a+=6.2832;return Math.floor(a/(6.2832/d))%d;}
function fbar(ctx,x,y,w,h,d,on,col){var cw=w/d;for(var i=0;i<d;i++){ctx.fillStyle=on[i]?(col||'#f472b6'):'rgba(255,255,255,.9)';ctx.fillRect(x+i*cw,y,cw,h);ctx.strokeStyle='#1f2937';ctx.lineWidth=3;ctx.strokeRect(x+i*cw,y,cw,h);}}
function fbarHit(x0,y0,w,h,d,x,y){if(x<x0||x>x0+w||y<y0||y>y0+h)return -1;return Math.min(d-1,Math.floor((x-x0)/(w/d)));}
function falses(n){var a=[];for(var i=0;i<n;i++)a.push(false);return a;}
function cnt(a){return a.filter(Boolean).length;}
function shadeRand(d,n){var a=falses(d),idx=shuffle(Array.from({length:d},function(_,i){return i;})).slice(0,n);if(Math.random()<.6){a=falses(d);for(var i=0;i<n;i++)a[i]=true;}else idx.forEach(function(i){a[i]=true;});return a;}
function optsFrom(ans,wrong){return shuffle([String(ans)].concat(U(ans,wrong)));}
function fracEq(n1,d1,n2,d2){return d1>0&&d2>0&&n1*d2===n2*d1;}
/* writing pad: two boxes (top / bottom of a fraction) and digit keys */
function padDraw(g,ctx,s,a){var p=s.pad,kw=Math.min(76,a.w/3.6),kh=Math.min(64,(a.h-150)/4.3),bx=a.x+(a.w-kw*3-16)/2,by=a.y+a.h-(kh*4+24);
  var boxW=Math.min(150,a.w*.6),cx=a.x+a.w/2,top=a.y+8,bh=Math.min(70,(by-top-30)/2);
  ['n','d'].forEach(function(f,i){var y=top+i*(bh+18);ctx.fillStyle='#fff';rr(ctx,cx-boxW/2,y,boxW,bh,12);ctx.fill();if(p.f===f&&!s.show){ctx.strokeStyle='#fbbf24';ctx.lineWidth=5;rr(ctx,cx-boxW/2,y,boxW,bh,12);ctx.stroke();}
    label(ctx,p[f]||(p.f===f?'_':''),cx,y+bh/2,bh*.6,'#111827',false);s.ui.push({x:cx-boxW/2,y:y,w:boxW,h:bh,box:f});});
  ctx.fillStyle='#fff';ctx.fillRect(cx-boxW/2-6,top+bh+7,boxW+12,5);
  ['1','2','3','4','5','6','7','8','9','⌫','0','↕'].forEach(function(k,i){var x=bx+(i%3)*(kw+8),y=by+Math.floor(i/3)*(kh+8);var r=bbtn(ctx,x,y,kw,kh,k,'rgba(255,255,255,.16)','#fff',30);r.key=k;s.ui.push(r);});}
function padKey(s,u){var p=s.pad;if(u.box){p.f=u.box;return;}if(!u.key)return;if(u.key==='⌫')p[p.f]=p[p.f].slice(0,-1);else if(u.key==='↕')p.f=p.f==='n'?'d':'n';else if(p[p.f].length<3){p[p.f]+=u.key;if(p.f==='n'&&p.n.length>=String(s.want?s.want[0]:9).length&&!p.d)p.f='d';}}
function split(a,ratio){/* picture area and side area: side-by-side on wide boards, stacked on tall ones */
  if(a.w>a.h*1.15){var w1=a.w*(ratio||.58);return [{x:a.x,y:a.y,w:w1-10,h:a.h},{x:a.x+w1+10,y:a.y,w:a.w-w1-10,h:a.h}];}
  var h1=a.h*.46;return [{x:a.x,y:a.y,w:a.w,h:h1},{x:a.x,y:a.y+h1+8,w:a.w,h:a.h-h1-8}];}
function optRow(g,ctx,s,a){var n=s.opts.length,gap=12,bh=Math.min(74,a.h),bw=Math.min(240,(a.w-gap*(n-1))/n),x0=a.x+(a.w-(bw*n+gap*(n-1)))/2;
  s.opts.forEach(function(o,i){var x=x0+i*(bw+gap),good=(s.show||s.res==='ok')&&o===s.ans,bad=s.pick===o&&s.res==='no';
    var r=bbtn(ctx,x,a.y+(a.h-bh)/2,bw,bh,o,good?'#16a34a':bad?'#dc2626':'#fff',good||bad?'#fff':'#111827',30);r.opt=o;s.ui.push(r);});}
function labRect(ctx,a,l,w,unit,fill){var k=Math.min(a.w*.72/l,a.h*.7/w),W2=l*k,H2=w*k,x=a.x+(a.w-W2)/2,y=a.y+(a.h-H2)/2+8;
  ctx.fillStyle=fill||'rgba(96,165,250,.45)';ctx.fillRect(x,y,W2,H2);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeRect(x,y,W2,H2);
  label(ctx,l+' '+unit,x+W2/2,y-18,24,'#fde68a');label(ctx,w+' '+unit,x-10-String(w+' '+unit).length*6.5,y+H2/2,24,'#fde68a');return {x:x,y:y,w:W2,h:H2};}

var BOARD=[];
function mkBoard(o){var tr0={};tr0[o.name[0]]=o.name[1];tr0[o.desc[0]]=o.desc[1];if(W.trAdd)W.trAdd(tr0);
  var d={id:'b_'+o.id,icon:o.icon,name:o.name[0],desc:o.desc[0],thumb:'star.png',bg:'bg_space.jpg',lives:false,classOnly:true,board:true,topic:o.topic,lv:o.lv||[1,13],o:o};
  d.init=function(g){var s=g.state;s.ok=0;s.parts=[];d.nextR(g);};
  d.nextR=function(g){var s=g.state;s.res='';s.show=false;s.pick=null;s.counted=false;s.ui=[];s.pad={n:'',d:'',f:'n'};o.round(g,s);setQ(s.q);};
  d.update=function(){};
  d.draw=function(g,ctx){var s=g.state;ctx.fillStyle='#163a2c';ctx.fillRect(0,0,g.w,g.h);ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=10;ctx.strokeRect(5,5,g.w-10,g.h-10);
    var hq=0;
    var barY=g.h-78,a={x:24,y:14+hq+12,w:g.w-48,h:barY-(14+hq+12)-(s.opts?92:44)};s.ui=[];
    o.paint(g,ctx,s,a);
    if(s.opts)optRow(g,ctx,s,{x:24,y:a.y+a.h+8,w:g.w-48,h:80});
    var msg=s.show?'✔ '+s.ans:s.res==='ok'?'✔ '+X('Correct!','Bravo !'):s.res==='no'?X('Not yet, try again','Pas encore, réessaie'):s.res==='empty'?X('Do it on the board first','Fais-le d’abord au tableau'):'';
    if(msg)label(ctx,msg,g.w/2,barY-22,Math.min(30,g.w/24),s.show||s.res==='ok'?'#86efac':'#fca5a5');
    var labs=(s.opts?[]:[['chk','✔ '+X('Check','Vérifier'),'#16a34a']]).concat([['ans','👀 '+X('Show answer','Voir la réponse'),'#7c3aed'],['nxt',X('Next student','Élève suivant')+' →','#2563eb']]);
    var gap=10,bw=Math.min(260,(g.w-48-gap*(labs.length-1))/labs.length),x0=(g.w-(bw*labs.length+gap*(labs.length-1)))/2;s.bar=[];
    labs.forEach(function(b,i){var r=bbtn(ctx,x0+i*(bw+gap),barY,bw,60,b[1],b[2],'#fff',24);r.act=b[0];s.bar.push(r);});
    drawParts(ctx,s.parts,1/60);};
  d.judge=function(g,s,r){if(r===null){s.res='empty';return;}if(r){s.res='ok';if(!s.counted&&!s.show){s.ok++;s.counted=true;G.score=s.ok;hud();}burst(s.parts,g.w/2,g.h*.4,'#fbbf24');burst(s.parts,g.w/2,g.h*.4,'#22c55e');}else s.res='no';};
  d.down=function(g,x,y){var s=g.state,b=vsHit(s.bar||[],x,y);
    if(b){if(b.act==='nxt')d.nextR(g);else if(b.act==='ans'){s.show=true;s.res='';}else if(b.act==='chk'&&!s.show)d.judge(g,s,o.check(g,s));return;}
    var u=vsHit(s.ui||[],x,y);if(u&&!s.show){if(u.opt!=null){if(s.res==='ok')return;s.pick=u.opt;d.judge(g,s,u.opt===s.ans);return;}if(u.box||u.key){padKey(s,u);if(s.res!=='ok')s.res='';return;}if(o.ui){o.ui(g,s,u);if(s.res!=='ok')s.res='';return;}}
    if(o.tap&&!s.show&&s.res!=='ok'){o.tap(g,s,x,y);s.res='';}};
  d.key=function(g,k){var s=g.state;if(/^[0-9]$/.test(k)&&s.pad&&o.pad){padKey(s,{key:k});}else if(k==='Backspace'&&o.pad)padKey(s,{key:'⌫'});else if(k==='Enter'&&o.check)d.judge(g,s,o.check(g,s));else if(k==='ArrowRight'||k==='n')d.nextR(g);};
  BOARD.push(d);return d;}

/* ---------- AREA ---------- */
function buildRound(kind){return function(g,s){var C=g.L<=3?8:10,R=6,w=rnd(1,C),h=rnd(1,R);while(w*h<3||(kind==='p'&&w+h<4)){w=rnd(1,C);h=rnd(1,R);}
  s.C=C;s.R=R;s.sol=[w,h];s.sel=null;s.val=kind==='a'?w*h:2*(w+h);
  s.q=kind==='a'?X('Build a rectangle with an area of '+s.val+' squares. Tap two opposite corners.','Construis un rectangle d’aire '+s.val+' carreaux. Touche deux coins opposés.'):X('Build a rectangle with a perimeter of '+s.val+'. Tap two opposite corners.','Construis un rectangle de périmètre '+s.val+'. Touche deux coins opposés.');
  s.ans=w+' × '+h+(kind==='a'?' = '+s.val:' → 2 × ('+w+' + '+h+') = '+s.val);};}
function buildPaint(kind){return function(g,ctx,s,a){var G2=gg(a,s.C,s.R),sel=s.sel,r=null;s.G2=G2;
  if(s.show)r=[0,0,s.sol[0],s.sol[1]];else if(sel&&sel.b)r=[Math.min(sel.a[0],sel.b[0]),Math.min(sel.a[1],sel.b[1]),Math.abs(sel.a[0]-sel.b[0])+1,Math.abs(sel.a[1]-sel.b[1])+1];
  gdraw(ctx,G2,function(c,k){if(r&&c>=r[0]&&c<r[0]+r[2]&&k>=r[1]&&k<r[1]+r[3])return s.show?'#86efac':'#f472b6';if(sel&&!sel.b&&sel.a[0]===c&&sel.a[1]===k)return '#fbbf24';return null;});
  if(r){var info=r[2]+' × '+r[3]+(kind==='a'?' → '+X('area ','aire ')+r[2]*r[3]:' → '+X('perimeter ','périmètre ')+2*(r[2]+r[3]));label(ctx,info,a.x+a.w/2,G2.oy+G2.cs*s.R+18,22,'#fde68a');}};}
function buildTap(g,s,x,y){var c=gcell(s.G2,x,y);if(!c)return;if(!s.sel||s.sel.b)s.sel={a:c};else s.sel.b=c;}
function buildCheck(kind){return function(g,s){var sel=s.sel;if(!sel||!sel.b)return null;var w=Math.abs(sel.a[0]-sel.b[0])+1,h=Math.abs(sel.a[1]-sel.b[1])+1;return (kind==='a'?w*h:2*(w+h))===s.val;};}
mkBoard({id:'a_build',topic:'area',icon:'🧱',lv:[2,8],name:['Build the area','Construis l’aire'],desc:['Build a rectangle with the area asked on the grid.','Construis au quadrillage un rectangle de l’aire demandée.'],
  round:buildRound('a'),paint:buildPaint('a'),tap:buildTap,check:buildCheck('a')});
mkBoard({id:'a_count',topic:'area',icon:'🔲',lv:[1,6],name:['Count the squares','Compte les carreaux'],desc:['How many squares cover the shape? That is its area.','Combien de carreaux couvrent la figure ? C’est son aire.'],
  round:function(g,s){s.C=10;s.R=6;s.cells=shapeCells(10,6,g.L>=3&&Math.random()<.5);var n=Object.keys(s.cells).length;s.ans=String(n);s.opts=optsFrom(n,[n+1,n-1,cellsPerim(s.cells),n+2]);
    s.q=X('What is the area of the pink shape? Count the squares.','Quelle est l’aire de la figure rose ? Compte les carreaux.');},
  paint:function(g,ctx,s,a){var G2=gg(a,s.C,s.R),i=0;gdraw(ctx,G2,function(c,r){return s.cells[c+','+r]?'#f472b6':null;});
    if(s.show)for(var r=0;r<s.R;r++)for(var c=0;c<s.C;c++)if(s.cells[c+','+r]){i++;label(ctx,String(i),G2.ox+(c+.5)*G2.cs,G2.oy+(r+.5)*G2.cs,G2.cs*.4,'#111827',false);}}});
mkBoard({id:'a_rect',topic:'area',icon:'▭',lv:[3,8],name:['Area of a rectangle','Aire d’un rectangle'],desc:['Length × width, with the sides marked.','Longueur × largeur, avec les côtés indiqués.'],
  round:function(g,s){s.l=rnd(3,g.L<=4?10:15);s.w=rnd(2,s.l-1);var A=s.l*s.w;s.ans=A+' cm²';s.opts=optsFrom(s.ans,[2*(s.l+s.w)+' cm²',(s.l+s.w)+' cm²',(A+s.l)+' cm²']);s.q=X('What is the area of this rectangle?','Quelle est l’aire de ce rectangle ?');},
  paint:function(g,ctx,s,a){var r=labRect(ctx,a,s.l,s.w,'cm');if(s.show)label(ctx,s.l+' × '+s.w+' = '+s.l*s.w+' cm²',r.x+r.w/2,r.y+r.h/2,28,'#fff');}});
mkBoard({id:'a_tri',topic:'area',icon:'🔺',lv:[5,9],name:['Area of a triangle','Aire d’un triangle'],desc:['Base × height ÷ 2.','Base × hauteur ÷ 2.'],
  round:function(g,s){s.b=2*rnd(2,9);s.h=rnd(3,12);s.t=Math.random();var A=s.b*s.h/2;s.ans=A+' cm²';s.opts=optsFrom(s.ans,[s.b*s.h+' cm²',(s.b+s.h)+' cm²',(A+s.h)+' cm²']);s.q=X('What is the area of this triangle?','Quelle est l’aire de ce triangle ?');},
  paint:function(g,ctx,s,a){var k=Math.min(a.w*.7/s.b,a.h*.72/s.h),B=s.b*k,H=s.h*k,x=a.x+(a.w-B)/2,y=a.y+(a.h-H)/2+10,px=x+B*(.15+s.t*.7);
    ctx.fillStyle='rgba(251,191,36,.45)';ctx.beginPath();ctx.moveTo(x,y+H);ctx.lineTo(x+B,y+H);ctx.lineTo(px,y);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();
    ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(px,y);ctx.lineTo(px,y+H);ctx.stroke();ctx.setLineDash([]);ctx.strokeRect(px,y+H-16,16,16);
    label(ctx,s.b+' cm',x+B/2,y+H+22,24,'#fde68a');label(ctx,s.h+' cm',px+42,y+H/2,24,'#fde68a');
    if(s.show)label(ctx,s.b+' × '+s.h+' ÷ 2 = '+s.b*s.h/2+' cm²',a.x+a.w/2,a.y+12,26,'#86efac');}});
mkBoard({id:'a_lshape',topic:'area',icon:'⬛',lv:[5,9],name:['Area of an L-shape','Aire d’une figure en L'],desc:['Split the shape into two rectangles and add.','Coupe la figure en deux rectangles et additionne.'],
  round:function(g,s){s.W=rnd(6,14);s.H=rnd(5,12);s.cw=rnd(2,s.W-3);s.ch=rnd(2,s.H-3);var A=s.W*s.H-s.cw*s.ch;s.ans=A+' cm²';s.opts=optsFrom(s.ans,[s.W*s.H+' cm²',(A+s.cw)+' cm²',2*(s.W+s.H)+' cm²']);s.q=X('What is the area of this shape?','Quelle est l’aire de cette figure ?');},
  paint:function(g,ctx,s,a){var k=Math.min(a.w*.66/s.W,a.h*.72/s.H),x=a.x+(a.w-s.W*k)/2,y=a.y+(a.h-s.H*k)/2+8,W2=s.W*k,H2=s.H*k,cw=s.cw*k,ch=s.ch*k;
    ctx.fillStyle='rgba(52,211,153,.45)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+W2-cw,y);ctx.lineTo(x+W2-cw,y+ch);ctx.lineTo(x+W2,y+ch);ctx.lineTo(x+W2,y+H2);ctx.lineTo(x,y+H2);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();
    label(ctx,s.W+' cm',x+W2/2,y+H2+22,22,'#fde68a');label(ctx,s.H+' cm',x-42,y+H2/2,22,'#fde68a');label(ctx,(s.W-s.cw)+' cm',x+(W2-cw)/2,y-18,22,'#fde68a');label(ctx,(s.H-s.ch)+' cm',x+W2+44,y+ch+(H2-ch)/2,22,'#fde68a');
    if(s.show){ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(x,y+ch);ctx.lineTo(x+W2-cw,y+ch);ctx.stroke();ctx.setLineDash([]);
      label(ctx,(s.W-s.cw)+' × '+s.ch+' + '+s.W+' × '+(s.H-s.ch)+' = '+(s.W*s.H-s.cw*s.ch),a.x+a.w/2,a.y+10,24,'#86efac');}}});
mkBoard({id:'a_same',topic:'area',icon:'🔁',lv:[3,8],name:['Same area, new shape','Même aire, autre forme'],desc:['Build a different rectangle with the same area as the blue one.','Construis un autre rectangle de même aire que le bleu.'],
  round:function(g,s){var pairs=[[2,6],[3,4],[2,8],[4,4],[3,6],[2,9],[4,5],[2,10],[3,8],[4,6],[2,12],[3,5],[5,2],[1,6]];var p=pick(pairs);s.C=12;s.R=6;s.base=[p[0],p[1]];s.val=p[0]*p[1];s.sel=null;
    var alt=[];for(var w=1;w<=12;w++)for(var h=1;h<=6;h++)if(w*h===s.val&&!(w===p[0]&&h===p[1]))alt.push([w,h]);s.sol=alt[0]||[p[1],p[0]];
    s.q=X('The blue rectangle has an area of '+s.val+'. Build a DIFFERENT rectangle with the same area.','Le rectangle bleu a une aire de '+s.val+'. Construis un rectangle DIFFÉRENT de même aire.');s.ans=s.sol[0]+' × '+s.sol[1]+' = '+s.val;},
  paint:function(g,ctx,s,a){var p=split(a,.32);labRect(ctx,{x:p[0].x+20,y:p[0].y,w:p[0].w-20,h:p[0].h},s.base[0],s.base[1],'','rgba(96,165,250,.7)');var bp=buildPaint('a');bp(g,ctx,s,p[1]);},
  tap:buildTap,check:function(g,s){var sel=s.sel;if(!sel||!sel.b)return null;var w=Math.abs(sel.a[0]-sel.b[0])+1,h=Math.abs(sel.a[1]-sel.b[1])+1;return w*h===s.val&&!(w===s.base[0]&&h===s.base[1]);}});

/* ---------- PERIMETER ---------- */
mkBoard({id:'p_build',topic:'perim',icon:'🧱',lv:[3,8],name:['Build the perimeter','Construis le périmètre'],desc:['Build a rectangle with the perimeter asked on the grid.','Construis au quadrillage un rectangle du périmètre demandé.'],
  round:buildRound('p'),paint:buildPaint('p'),tap:buildTap,check:buildCheck('p')});
mkBoard({id:'p_count',topic:'perim',icon:'🚶',lv:[2,6],name:['Walk around the shape','Fais le tour de la figure'],desc:['Count every edge around the outside of the shape.','Compte tous les côtés du contour de la figure.'],
  round:function(g,s){s.C=10;s.R=6;s.cells=shapeCells(10,6,g.L>=4&&Math.random()<.5);var p=cellsPerim(s.cells),n=Object.keys(s.cells).length;s.ans=String(p);s.opts=optsFrom(p,[n,p+2,p-2,p+1]);
    s.q=X('What is the perimeter of the pink shape? Count the edges all the way around.','Quel est le périmètre de la figure rose ? Compte les côtés tout autour.');},
  paint:function(g,ctx,s,a){var G2=gg(a,s.C,s.R);gdraw(ctx,G2,function(c,r){return s.cells[c+','+r]?'#f472b6':null;});
    if(s.show){ctx.strokeStyle='#fbbf24';ctx.lineWidth=6;Object.keys(s.cells).forEach(function(k){var q=k.split(','),c=+q[0],r=+q[1],x=G2.ox+c*G2.cs,y=G2.oy+r*G2.cs;
      if(!s.cells[c+','+(r-1)]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+G2.cs,y);ctx.stroke();}if(!s.cells[c+','+(r+1)]){ctx.beginPath();ctx.moveTo(x,y+G2.cs);ctx.lineTo(x+G2.cs,y+G2.cs);ctx.stroke();}
      if(!s.cells[(c-1)+','+r]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+G2.cs);ctx.stroke();}if(!s.cells[(c+1)+','+r]){ctx.beginPath();ctx.moveTo(x+G2.cs,y);ctx.lineTo(x+G2.cs,y+G2.cs);ctx.stroke();}});}}});
mkBoard({id:'p_rect',topic:'perim',icon:'▭',lv:[3,8],name:['Perimeter of a rectangle','Périmètre d’un rectangle'],desc:['Add all four sides.','Additionne les quatre côtés.'],
  round:function(g,s){s.l=rnd(3,g.L<=4?10:20);s.w=rnd(2,s.l-1);var P=2*(s.l+s.w);s.ans=P+' cm';s.opts=optsFrom(s.ans,[s.l*s.w+' cm',(s.l+s.w)+' cm',(2*s.l+s.w)+' cm']);s.q=X('What is the perimeter of this rectangle?','Quel est le périmètre de ce rectangle ?');},
  paint:function(g,ctx,s,a){var r=labRect(ctx,a,s.l,s.w,'cm','rgba(251,146,60,.4)');if(s.show)label(ctx,s.l+' + '+s.w+' + '+s.l+' + '+s.w+' = '+2*(s.l+s.w)+' cm',r.x+r.w/2,r.y+r.h/2,26,'#fff');}});
mkBoard({id:'p_poly',topic:'perim',icon:'⬠',lv:[3,8],name:['Add the sides','Additionne les côtés'],desc:['A shape with every side marked. Add them all.','Une figure avec chaque côté indiqué. Additionne-les tous.'],
  round:function(g,s){s.n=rnd(3,g.L<=4?5:7);s.sides=[];for(var i=0;i<s.n;i++)s.sides.push(rnd(2,g.L<=4?9:20));var P=s.sides.reduce(function(x,y){return x+y;},0);s.ans=P+' cm';s.opts=optsFrom(s.ans,[(P+s.sides[0])+' cm',(P-s.sides[1])+' cm',(P+2)+' cm']);
    s.q=X('What is the perimeter of this shape? (not to scale)','Quel est le périmètre de cette figure ? (pas à l’échelle)');},
  paint:function(g,ctx,s,a){var cx=a.x+a.w/2,cy=a.y+a.h/2+6,R2=Math.min(a.w,a.h)*.36,pts=[];for(var i=0;i<s.n;i++){var t=-1.5708+i*6.2832/s.n+(s.n===4?.785:0);pts.push([cx+R2*Math.cos(t),cy+R2*Math.sin(t)]);}
    ctx.fillStyle='rgba(167,139,250,.45)';ctx.beginPath();pts.forEach(function(p,i){if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();
    pts.forEach(function(p,i){var q=pts[(i+1)%s.n],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,ox=mx-cx,oy=my-cy,ln=Math.sqrt(ox*ox+oy*oy)||1;label(ctx,s.sides[i]+' cm',mx+ox/ln*30,my+oy/ln*24,22,'#fde68a');});
    if(s.show)label(ctx,s.sides.join(' + ')+' = '+s.sides.reduce(function(x,y){return x+y;},0),cx,cy,22,'#fff');}});
mkBoard({id:'p_missing',topic:'perim',icon:'❓',lv:[4,9],name:['Find the missing side','Trouve le côté manquant'],desc:['You know the perimeter and one side. Find the other.','Tu connais le périmètre et un côté. Trouve l’autre.'],
  round:function(g,s){s.l=rnd(4,16);s.w=rnd(2,s.l-1);var P=2*(s.l+s.w);s.P=P;s.ans=s.w+' cm';s.opts=optsFrom(s.ans,[(P-s.l)+' cm',(P/2)+' cm',(s.w+2)+' cm']);
    s.q=X('This rectangle has a perimeter of '+P+' cm. How long is the short side?','Ce rectangle a un périmètre de '+P+' cm. Combien mesure le petit côté ?');},
  paint:function(g,ctx,s,a){var k=Math.min(a.w*.72/s.l,a.h*.7/s.w),W2=s.l*k,H2=s.w*k,x=a.x+(a.w-W2)/2,y=a.y+(a.h-H2)/2+8;ctx.fillStyle='rgba(251,146,60,.4)';ctx.fillRect(x,y,W2,H2);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeRect(x,y,W2,H2);
    label(ctx,s.l+' cm',x+W2/2,y-18,24,'#fde68a');label(ctx,'?',x-26,y+H2/2,34,'#fde68a');if(s.show)label(ctx,s.P+' ÷ 2 = '+s.P/2+',  '+s.P/2+' − '+s.l+' = '+s.w,x+W2/2,y+H2/2,24,'#fff');}});
mkBoard({id:'p_square',topic:'perim',icon:'⬜',lv:[4,9],name:['Square puzzle','L’énigme du carré'],desc:['A square has 4 equal sides. Use the perimeter to find one side.','Un carré a 4 côtés égaux. Utilise le périmètre pour trouver un côté.'],
  round:function(g,s){s.a=rnd(2,15);var P=4*s.a;s.ans=s.a+' cm';s.opts=optsFrom(s.ans,[(P/2)+' cm',(s.a+4)+' cm',(P-4)+' cm']);s.q=X('A square has a perimeter of '+P+' cm. How long is one side?','Un carré a un périmètre de '+P+' cm. Combien mesure un côté ?');},
  paint:function(g,ctx,s,a){var sz=Math.min(a.w,a.h)*.6,x=a.x+(a.w-sz)/2,y=a.y+(a.h-sz)/2+6;ctx.fillStyle='rgba(56,189,248,.4)';ctx.fillRect(x,y,sz,sz);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeRect(x,y,sz,sz);
    ['?','?','?','?'].forEach(function(t,i){label(ctx,s.show?String(s.a):t,[x+sz/2,x+sz+24,x+sz/2,x-24][i],[y-18,y+sz/2,y+sz+20,y+sz/2][i],28,'#fde68a');});if(s.show)label(ctx,4*s.a+' ÷ 4 = '+s.a,x+sz/2,y+sz/2,28,'#fff');}});

/* ---------- FRACTIONS ---------- */
function fracPick(L){var dd=rnd(2,L<=3?6:L<=5?10:12),n=rnd(1,dd-1);return [n,dd];}
mkBoard({id:'f_pizza',topic:'frac',icon:'🍕',lv:[1,9],name:['Shade the pizza','Colorie la pizza'],desc:['Tap slices to shade the fraction asked. Higher grades need equivalent fractions.','Touche les parts pour colorier la fraction demandée. Les grandes classes ont besoin de fractions équivalentes.'],
  round:function(g,s){var f=fracPick(g.L);while(gcd(f[0],f[1])!==1)f=fracPick(g.L);var k=g.L>=4?rnd(1,Math.max(1,Math.floor(12/f[1]))):1;s.f=f;s.d=f[1]*k;s.on=falses(s.d);
    s.q=X('Shade '+f[0]+'/'+f[1]+' of the pizza.','Colorie '+f[0]+'/'+f[1]+' de la pizza.');s.ans=(f[0]*k)+'/'+s.d+(k>1?' = '+f[0]+'/'+f[1]:'');},
  paint:function(g,ctx,s,a){s.r=Math.min(a.w,a.h)*.44;s.cx=a.x+a.w/2;s.cy=a.y+a.h/2;var on=s.show?s.on.map(function(_,i){return i<s.f[0]*s.d/s.f[1];}):s.on;pizza(ctx,s.cx,s.cy,s.r,s.d,on,s.show?'#22c55e':'#f472b6');
    label(ctx,cnt(on)+'/'+s.d,s.cx+s.r+50,s.cy,26,'#fff');},
  tap:function(g,s,x,y){var i=pizzaHit(s.cx,s.cy,s.r,s.d,x,y);if(i>=0)s.on[i]=!s.on[i];},check:function(g,s){var c=cnt(s.on);if(!c)return null;return fracEq(c,s.d,s.f[0],s.f[1]);}});
mkBoard({id:'f_bar',topic:'frac',icon:'🍫',lv:[2,9],name:['Shade the bar','Colorie la barre'],desc:['Tap parts of the chocolate bar to shade the fraction.','Touche les carrés de la tablette pour colorier la fraction.'],
  round:function(g,s){var f=fracPick(g.L);while(gcd(f[0],f[1])!==1)f=fracPick(g.L);var k=g.L>=4?rnd(1,Math.max(1,Math.floor(12/f[1]))):1;s.f=f;s.d=f[1]*k;s.on=falses(s.d);
    s.q=X('Shade '+f[0]+'/'+f[1]+' of the bar.','Colorie '+f[0]+'/'+f[1]+' de la barre.');s.ans=(f[0]*k)+'/'+s.d+(k>1?' = '+f[0]+'/'+f[1]:'');},
  paint:function(g,ctx,s,a){s.bw=Math.min(a.w,900);s.bh=Math.min(140,a.h*.5);s.bx=a.x+(a.w-s.bw)/2;s.by=a.y+(a.h-s.bh)/2;var on=s.show?s.on.map(function(_,i){return i<s.f[0]*s.d/s.f[1];}):s.on;
    fbar(ctx,s.bx,s.by,s.bw,s.bh,s.d,on,s.show?'#22c55e':'#a16207');label(ctx,cnt(on)+'/'+s.d,a.x+a.w/2,s.by+s.bh+30,26,'#fff');},
  tap:function(g,s,x,y){var i=fbarHit(s.bx,s.by,s.bw,s.bh,s.d,x,y);if(i>=0)s.on[i]=!s.on[i];},check:function(g,s){var c=cnt(s.on);if(!c)return null;return fracEq(c,s.d,s.f[0],s.f[1]);}});
function writeCheck(g,s){var n=parseInt(s.pad.n,10),d=parseInt(s.pad.d,10);if(!(n>=0)||!(d>0))return null;return fracEq(n,d,s.want[0],s.want[1]);}
mkBoard({id:'f_write',topic:'frac',icon:'✍️',lv:[1,9],pad:true,name:['Write the fraction','Écris la fraction'],desc:['Look at the shaded part and write the fraction with the number pad.','Regarde la partie coloriée et écris la fraction avec le pavé.'],
  round:function(g,s){var f=fracPick(g.L);s.kind=Math.random()<.5?'p':'b';s.d=f[1];s.on=shadeRand(f[1],f[0]);s.want=f;s.q=X('What fraction is shaded? Write it.','Quelle fraction est coloriée ? Écris-la.');s.ans=f[0]+'/'+f[1]+(fs(f[0],f[1])!==f[0]+'/'+f[1]?' = '+fs(f[0],f[1]):'');},
  paint:function(g,ctx,s,a){var p=split(a,.55),q=p[0];if(s.kind==='p')pizza(ctx,q.x+q.w/2,q.y+q.h/2,Math.min(q.w,q.h)*.42,s.d,s.on);else fbar(ctx,q.x+10,q.y+q.h/2-50,q.w-20,100,s.d,s.on,'#a16207');padDraw(g,ctx,s,p[1]);},
  check:writeCheck});
mkBoard({id:'f_group',topic:'frac',icon:'🍎',lv:[2,8],pad:true,name:['Fraction of a group','Fraction d’un groupe'],desc:['Some of the apples are red. Write the fraction that is red.','Certaines pommes sont rouges. Écris la fraction de pommes rouges.'],
  round:function(g,s){var N=rnd(4,g.L<=3?10:16),k=rnd(1,N-1);s.N=N;s.on=shadeRand(N,k);s.want=[k,N];s.q=X('What fraction of the apples is red? Write it.','Quelle fraction des pommes est rouge ? Écris-la.');s.ans=k+'/'+N+(fs(k,N)!==k+'/'+N?' = '+fs(k,N):'');},
  paint:function(g,ctx,s,a){var p=split(a,.55),q=p[0],cols=Math.ceil(Math.sqrt(s.N*1.6)),rows=Math.ceil(s.N/cols),sz=Math.min(q.w/cols,q.h/rows)*.8;
    for(var i=0;i<s.N;i++){var x=q.x+(q.w-cols*sz/.8)/2+(i%cols+.5)*sz/.8,y=q.y+(q.h-rows*sz/.8)/2+(Math.floor(i/cols)+.5)*sz/.8;ctx.fillStyle=s.on[i]?'#ef4444':'#84cc16';ctx.beginPath();ctx.arc(x,y,sz/2,0,6.2832);ctx.fill();ctx.fillStyle='#78350f';ctx.fillRect(x-2,y-sz/2-8,4,10);}
    padDraw(g,ctx,s,p[1]);},check:writeCheck});
mkBoard({id:'f_colour',topic:'frac',icon:'🎨',lv:[3,9],name:['Colour a fraction of a group','Colorie une fraction d’un groupe'],desc:['Tap the balloons to colour the fraction of the group asked.','Touche les ballons pour colorier la fraction du groupe demandée.'],
  round:function(g,s){var f=fracPick(g.L);while(gcd(f[0],f[1])!==1||f[1]>8)f=fracPick(Math.min(g.L,5));var m=rnd(1,Math.max(1,Math.floor(16/f[1])));s.N=f[1]*m;s.f=f;s.on=falses(s.N);
    s.q=X('Colour '+f[0]+'/'+f[1]+' of the '+s.N+' balloons.','Colorie '+f[0]+'/'+f[1]+' des '+s.N+' ballons.');s.ans=s.N+' ÷ '+f[1]+' × '+f[0]+' = '+(s.N/f[1]*f[0]);},
  paint:function(g,ctx,s,a){var cols=Math.min(s.N,Math.ceil(Math.sqrt(s.N*2.2))),rows=Math.ceil(s.N/cols),cw=a.w/cols,ch=a.h/rows,sz=Math.min(cw,ch)*.7;s.pos=[];var need=s.N/s.f[1]*s.f[0];
    for(var i=0;i<s.N;i++){var x=a.x+(i%cols+.5)*cw,y=a.y+(Math.floor(i/cols)+.5)*ch,on=s.show?i<need:s.on[i];s.pos.push([x,y,sz/2]);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+sz/2);ctx.lineTo(x,y+sz*.9);ctx.stroke();
      ctx.fillStyle=on?(s.show?'#22c55e':'#f472b6'):'rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(x,y,sz*.42,sz/2,0,0,6.2832);ctx.fill();}
    label(ctx,(s.show?need:cnt(s.on))+'/'+s.N,a.x+a.w-40,a.y+14,24,'#fff');},
  tap:function(g,s,x,y){(s.pos||[]).forEach(function(p,i){if((x-p[0])*(x-p[0])+(y-p[1])*(y-p[1])<p[2]*p[2]*1.4)s.on[i]=!s.on[i];});},
  check:function(g,s){var c=cnt(s.on);if(!c)return null;return c*s.f[1]===s.f[0]*s.N;}});
mkBoard({id:'f_line',topic:'frac',icon:'📏',lv:[3,10],name:['Fraction on the number line','Fraction sur la droite graduée'],desc:['Tap the mark where the fraction belongs.','Touche la graduation où se trouve la fraction.'],
  round:function(g,s){var dd=rnd(2,g.L<=4?6:10),mx=g.L>=5&&Math.random()<.4?2:1,n=rnd(1,dd*mx-1);while(n%dd===0)n=rnd(1,dd*mx-1);var k=g.L>=6&&Math.random()<.4?2:1;
    s.dd=dd;s.mx=mx;s.ticks=dd*k;s.n=n;s.k=k;s.pk=-1;var shown=k>1&&gcd(n,dd)===1?n+'/'+dd:n+'/'+dd;s.q=X('Tap where '+shown+' goes on the number line.','Touche l’endroit où va '+shown+' sur la droite graduée.');s.ans=n+'/'+dd+(k>1?' = '+(n*k)+'/'+(dd*k):'');},
  paint:function(g,ctx,s,a){var x1=a.x+40,x2=a.x+a.w-40,y=a.y+a.h/2,tot=s.ticks*s.mx;s.x1=x1;s.x2=x2;s.ly=y;ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();
    for(var i=0;i<=tot;i++){var x=x1+(x2-x1)*i/tot,big=i%s.ticks===0,good=s.show&&i===s.n*s.k,sel=s.pk===i;ctx.lineWidth=big?5:3;ctx.strokeStyle=good?'#22c55e':sel?'#f472b6':'#fff';ctx.beginPath();ctx.moveTo(x,y-(big?28:18));ctx.lineTo(x,y+(big?28:18));ctx.stroke();
      if(big)label(ctx,String(i/s.ticks),x,y+52,30,'#fde68a');if(sel||good){ctx.fillStyle=good?'#22c55e':'#f472b6';ctx.beginPath();ctx.arc(x,y-46,14,0,6.2832);ctx.fill();}}},
  tap:function(g,s,x,y){if(Math.abs(y-s.ly)>80)return;var tot=s.ticks*s.mx,i=Math.round((x-s.x1)/(s.x2-s.x1)*tot);if(i>=0&&i<=tot)s.pk=i;},
  check:function(g,s){if(s.pk<0)return null;return s.pk===s.n*s.k;}});
mkBoard({id:'f_cmp',topic:'frac',icon:'⚖️',lv:[3,8],name:['Which is bigger?','Laquelle est la plus grande ?'],desc:['Two pizzas. Tap the one with more shaded, or Equal.','Deux pizzas. Touche celle qui est le plus coloriée, ou Égales.'],
  round:function(g,s){var a=cop(2,g.L<=4?8:12),b=cop(2,g.L<=4?8:12);if(g.L>=4&&Math.random()<.15){var m=rnd(2,3);b=[a[0]*m,a[1]*m];if(b[1]>12)b=cop(2,12);}while(fracEq(a[0],a[1],b[0],b[1])&&b[1]===a[1])b=cop(2,12);
    s.A=a;s.B=b;var va=a[0]/a[1],vb=b[0]/b[1],L1=a[0]+'/'+a[1],L2=b[0]+'/'+b[1],EQ=X('Equal','Égales');s.ans=Math.abs(va-vb)<1e-9?EQ:va>vb?L1:L2;s.opts=[L1,L2,EQ];
    s.q=X('Which pizza has more shaded: '+L1+' or '+L2+'?','Quelle pizza est la plus coloriée : '+L1+' ou '+L2+' ?');},
  paint:function(g,ctx,s,a){var r=Math.min(a.w/4.4,a.h*.42);[[s.A,a.x+a.w*.28],[s.B,a.x+a.w*.72]].forEach(function(p){var on=falses(p[0][1]);for(var i=0;i<p[0][0];i++)on[i]=true;pizza(ctx,p[1],a.y+a.h/2,r,p[0][1],on);label(ctx,p[0][0]+'/'+p[0][1],p[1],a.y+a.h/2+r+22,28,'#fde68a');});}});
mkBoard({id:'f_equiv',topic:'frac',icon:'🟰',lv:[4,9],name:['Make it equal','Rends-les égales'],desc:['Shade the second bar so it shows the same amount as the first.','Colorie la deuxième barre pour qu’elle montre la même quantité que la première.'],
  round:function(g,s){var f=cop(2,6),k=rnd(2,Math.max(2,Math.floor(12/f[1])));s.f=f;s.d=f[1]*k;s.on=falses(s.d);s.top=falses(f[1]);for(var i=0;i<f[0];i++)s.top[i]=true;
    s.q=X('The top bar shows '+f[0]+'/'+f[1]+'. Shade the same amount on the bottom bar.','La barre du haut montre '+f[0]+'/'+f[1]+'. Colorie la même quantité sur la barre du bas.');s.ans=f[0]+'/'+f[1]+' = '+(f[0]*k)+'/'+s.d;},
  paint:function(g,ctx,s,a){var bw=Math.min(a.w,900),bh=Math.min(100,a.h*.3),x=a.x+(a.w-bw)/2,y1=a.y+a.h*.18,y2=a.y+a.h*.58;s.bx=x;s.bw=bw;s.bh=bh;s.by=y2;
    fbar(ctx,x,y1,bw,bh,s.f[1],s.top,'#60a5fa');var on=s.show?s.on.map(function(_,i){return i<s.f[0]*s.d/s.f[1];}):s.on;fbar(ctx,x,y2,bw,bh,s.d,on,s.show?'#22c55e':'#f472b6');label(ctx,cnt(on)+'/'+s.d,x+bw/2,y2+bh+28,24,'#fff');},
  tap:function(g,s,x,y){var i=fbarHit(s.bx,s.by,s.bw,s.bh,s.d,x,y);if(i>=0)s.on[i]=!s.on[i];},check:function(g,s){var c=cnt(s.on);if(!c)return null;return fracEq(c,s.d,s.f[0],s.f[1]);}});
mkBoard({id:'f_add',topic:'frac',icon:'➕',lv:[4,9],pad:true,name:['Add fractions on the bar','Additionne sur la barre'],desc:['The bar shows two fractions. Write what they add up to.','La barre montre deux fractions. Écris leur somme.'],
  round:function(g,s){var d=rnd(3,12),a=rnd(1,d-2),b=rnd(1,d-a);s.d=d;s.a=a;s.b=b;s.want=[a+b,d];s.q=X('What is '+a+'/'+d+' + '+b+'/'+d+'? Write it.','Combien font '+a+'/'+d+' + '+b+'/'+d+' ? Écris-le.');s.ans=(a+b)+'/'+d+(fs(a+b,d)!==(a+b)+'/'+d?' = '+fs(a+b,d):'');},
  paint:function(g,ctx,s,a2){var p=split(a2,.55),q=p[0],cw=(q.w-20)/s.d,y=q.y+q.h/2-50;for(var i=0;i<s.d;i++){ctx.fillStyle=i<s.a?'#f472b6':i<s.a+s.b?'#60a5fa':'rgba(255,255,255,.9)';ctx.fillRect(q.x+10+i*cw,y,cw,100);ctx.strokeStyle='#1f2937';ctx.lineWidth=3;ctx.strokeRect(q.x+10+i*cw,y,cw,100);}
    label(ctx,s.a+'/'+s.d,q.x+10+cw*s.a/2,y-22,24,'#f9a8d4');label(ctx,s.b+'/'+s.d,q.x+10+cw*(s.a+s.b/2),y+124,24,'#93c5fd');padDraw(g,ctx,s,p[1]);},check:writeCheck});
mkBoard({id:'f_name',topic:'frac',icon:'🏷️',lv:[1,5],name:['Name the fraction','Nomme la fraction'],desc:['Pick the fraction that matches the picture.','Choisis la fraction qui correspond au dessin.'],
  round:function(g,s){var f=fracPick(Math.min(g.L,4));s.f=f;s.on=shadeRand(f[1],f[0]);s.kind=Math.random()<.5?'p':'b';s.ans=f[0]+'/'+f[1];s.opts=optsFrom(s.ans,[f[1]+'/'+f[0],(f[1]-f[0])+'/'+f[1],f[0]+'/'+(f[1]+1)]);s.q=X('What fraction is shaded?','Quelle fraction est coloriée ?');},
  paint:function(g,ctx,s,a){if(s.kind==='p')pizza(ctx,a.x+a.w/2,a.y+a.h/2,Math.min(a.w,a.h)*.44,s.f[1],s.on);else fbar(ctx,a.x+(a.w-Math.min(a.w,800))/2,a.y+a.h/2-55,Math.min(a.w,800),110,s.f[1],s.on,'#a16207');}});

/* ---------- quick questions on any topic, one student at a time ---------- */
var BQUIZ=mkBoard({id:'quiz',topic:'any',icon:'🙋',lv:[1,13],name:['Quick question','Question rapide'],desc:['One question on the topic, four big answers to tap.','Une question sur le thème, quatre grandes réponses à toucher.'],
  round:function(g,s){var t=TOPIC||LESSONS[0],q=t.gen(g.L);s.q=q.q;s.ans=String(q.a);s.steps=q.steps||[];s.opts=shuffle([s.ans].concat((q.opts||[]).slice(0,3)));},
  paint:function(g,ctx,s,a){if(s.show&&s.steps.length){var y=a.y+10;s.steps.forEach(function(st){y+=tw(ctx,st,a.x+a.w/2,y,a.w,Math.min(28,a.h/(s.steps.length*1.6)),'#fde68a')+6;});}
    else{ctx.globalAlpha=.25;label(ctx,(TOPIC||LESSONS[0]).icon,a.x+a.w/2,a.y+a.h/2,Math.min(160,a.h*.7),'#fff',false);ctx.globalAlpha=1;}}});

ALLG=GAMES.concat(BOARD);
/* ---------- arcade page (replaces the old Games hub) ---------- */
function renderArcade(c){
  var L=level(),WD=worldOf(L),shown=GAMES.filter(function(g){return forGrade(g,L);}),
    mine=shown.filter(function(g){return g.th;}),rest=shown.filter(function(g){return !g.th;});
  syncBests(function(){var cc=$('content');if(!G&&cc&&cc.querySelector('.mxr-arcade'))renderArcade(cc);});
  function card(g,i,isNew){
    var nm=gName(g,L);
    return '<button type="button" class="mxr-card" data-i="'+i+'" data-n="'+E((nm+' '+g.name).toLowerCase())+'" aria-label="'+E(nm+'. '+T(g.desc))+'">'
      +'<span class="mxr-art"><img class="mxr-bg" loading="lazy" src="'+IMG_DIR+(g.bgThumb||g.bg)+'" alt=""><img loading="lazy" src="'+IMG_DIR+g.thumb+'" alt="">'+(isNew?'<i class="mxr-new">NEW</i>':'')+'</span>'
      +'<span class="mxr-tx"><b>'+g.icon+' '+E(nm)+'</b><small>'+E(T(g.desc))+'</small><em>🏆 '+E(T('Best'))+': '+best(g.id)+'</em></span></button>';}
  function bcard(d){var i=ALLG.indexOf(d);return '<button type="button" class="mxr-card mxb-card" data-i="'+i+'" data-n="'+E((T(d.name)+' '+d.name).toLowerCase())+'"><span class="mxb-ic">'+d.icon+'</span><span class="mxr-tx"><b>'+E(T(d.name))+'</b><small>'+E(T(d.desc))+'</small><em>'+E(T(LEVELS[d.lv[0]-1][1]))+(d.lv[1]>d.lv[0]?' – '+E(T(LEVELS[d.lv[1]-1][1])):'')+'</em></span></button>';}
  function inLv(r){return LSN.all||(L>=r[0]&&L<=r[1]);}
  var sub=CLS.sub==='present'?'present':'board',classHtml='';
  if(CLS.on){
    classHtml='<div class="mxr-sub" role="tablist"><button type="button" role="tab" data-s="board" aria-selected="'+(sub==='board')+'">🧑‍🏫 '+E(T('Board activities'))+'</button><button type="button" role="tab" data-s="present" aria-selected="'+(sub==='present')+'">🎤 '+E(T('Presentation mode'))+'</button></div>';
    if(sub==='board'){
      classHtml+='<div class="mxr-class"><p>'+E(T('For the smart board: call a student to the board. They do the activity and press Check. Show answer explains it, and Next student makes a new one.'))+'</p>'
        +'<label class="mxl-all"><input type="checkbox" id="mxlAll"'+(LSN.all?' checked':'')+'> '+E(T('Show activities for all grades'))+'</label></div>';
      [['area','📐','Area'],['perim','📏','Perimeter'],['frac','🍕','Fractions']].forEach(function(sec){var list=BOARD.filter(function(d){return d.topic===sec[0]&&inLv(d.lv);});
        if(list.length)classHtml+='<h2 class="mxr-h">'+sec[1]+' '+E(T(sec[2]))+'</h2><div class="mxr-grid mxb-grid">'+list.map(bcard).join('')+'</div>';});
      var tl=LESSONS.filter(function(t){return inLv(t.lv);});
      if(tl.length)classHtml+='<h2 class="mxr-h">🙋 '+E(T('Quick questions by topic'))+'</h2><p class="mxb-note">'+E(T('One question at a time with four big answers. Pick a topic:'))+'</p><div class="mxb-chips">'+tl.map(function(t){return '<button type="button" class="mxb-chip" data-qt="'+LESSONS.indexOf(t)+'">'+t.icon+' '+E(lsnName(t))+'</button>';}).join('')+'</div>';
      classHtml+='<h2 class="mxr-h">✏️ '+E(T('Work it out on the board'))+'</h2><div class="mxr-grid mxr-ex">'+EXERCISES.map(function(x,i){return '<button type="button" class="mxr-card mxr-exc" data-x="'+i+'"><span class="mxr-exi">'+x.icon+'</span><span class="mxr-tx"><b>'+E(T(x.name))+'</b><small>'+E(T(x.desc))+'</small></span></button>';}).join('')+'</div>';
    }else{
      classHtml+='<div class="mxr-class"><div class="mxr-teams"><label><input id="mxaNA" maxlength="16" value="'+E(teamName('A'))+'" aria-label="'+E(T('Team A name'))+'"><b>'+CLS.A+'</b></label>'
        +'<label><input id="mxaNB" maxlength="16" value="'+E(teamName('B'))+'" aria-label="'+E(T('Team B name'))+'"><b>'+CLS.B+'</b></label></div>'
        +'<p class="mxr-turn"><button type="button" class="mxr-link" id="mxaReset">'+E(T('reset scores'))+'</button></p></div><div class="mxp-panel" id="mxpHost"></div>';}
  }
  var NEWIDS={};
  c.innerHTML='<div class="mxr-arcade">'
    +'<div class="mxr-hero mxr-world" style="background-image:linear-gradient(120deg,rgba(18,10,60,.72),rgba(18,10,60,.25)),url('+IMG_DIR+'bg_'+WD[0]+'_w.jpg)"><img class="mxr-wsp" src="'+IMG_DIR+'sp_'+WD[0]+'.png" alt=""><div><span class="mxr-wtag">'+E(T(LEVELS[L-1][1]))+' · '+[0,1,2,3,4,5,6,7].map(function(j){return themeFor(L,j)[1];}).join(' ')+'</span><h1>🎮 '+E(T('Matix Arcade'))+'</h1><p>'+E(T('Real games, real maths. Pick your grade and the games and questions are made for it.'))+' '+GAMES.length+' '+E(T('games'))+', '+BOARD.length+' '+E(T('smart-board activities'))+'.</p></div></div>'
    +'<div class="mxr-modes" role="tablist" aria-label="'+E(T('Where are you playing?'))+'"><button type="button" role="tab" data-m="home" aria-selected="'+(!CLS.on)+'">🏠 '+E(T('At home'))+'</button><button type="button" role="tab" data-m="class" aria-selected="'+CLS.on+'">🏫 '+E(T('In class'))+'</button></div>'
    +'<label class="mxr-lv"><span>'+E(T(CLS.on?'Pick the class':'Difficulty'))+'</span><select id="mxaLv" aria-label="'+E(T('Grade'))+'">'+LEVELS.map(function(l){return '<option value="'+l[0]+'"'+(+l[0]===L?' selected':'')+'>'+E(T(l[1]))+'</option>';}).join('')+'</select></label>'
    +(CLS.on?classHtml:'<div class="mxr-filter"><span>'+shown.length+' '+E(T('games for this grade'))+'</span> <input type="search" id="mxaSearch" class="mxr-search" placeholder="'+E(T('Search games'))+'" aria-label="'+E(T('Search games'))+'"></div>'
      +(!mine.length?'<div class="mxr-grid">'+shown.map(function(g){return card(g,ALLG.indexOf(g),NEWIDS[g.id]);}).join('')+'</div>'
      :'<h2 class="mxr-h">✨ '+E(T('Themed games for your class'))+'</h2><div class="mxr-grid">'+mine.map(function(g){return card(g,ALLG.indexOf(g),NEWIDS[g.id]);}).join('')+'</div>'
       +'<h2 class="mxr-h">🎮 '+E(T('More games for this grade'))+'</h2><div class="mxr-grid">'+rest.map(function(g){return card(g,ALLG.indexOf(g),NEWIDS[g.id]);}).join('')+'</div>'))
    +'</div>';
  $('mxaLv').onchange=function(){ls('mx_arcade_level',this.value);renderArcade(c);};
  if($('mxaSearch'))$('mxaSearch').oninput=function(){var q=this.value.trim().toLowerCase();c.querySelectorAll('.mxr-card[data-i]').forEach(function(b){b.style.display=!q||b.dataset.n.indexOf(q)>=0?'':'none';});};
  c.querySelectorAll('.mxr-modes button').forEach(function(b){b.onclick=function(){CLS.on=b.dataset.m==='class';saveCls();renderArcade(c);};});
  c.querySelectorAll('.mxr-sub button').forEach(function(b){b.onclick=function(){CLS.sub=b.dataset.s;saveCls();renderArcade(c);};});
  if(CLS.on&&sub==='board'){
    $('mxlAll').onchange=function(){LSN.all=this.checked;renderArcade(c);};
    c.querySelectorAll('[data-qt]').forEach(function(b){b.onclick=function(){startGame(BQUIZ,LESSONS[+b.dataset.qt]);};});
    c.querySelectorAll('.mxr-exc').forEach(function(b){b.onclick=function(){startBoard(EXERCISES[+b.dataset.x]);};});
  }
  if(CLS.on&&sub==='present'){
    $('mxaNA').onchange=function(){CLS.nA=this.value.trim()||'Team A';saveCls();};
    $('mxaNB').onchange=function(){CLS.nB=this.value.trim()||'Team B';saveCls();};
    $('mxaReset').onclick=function(){CLS.A=CLS.B=0;CLS.turn='A';saveCls();renderArcade(c);};
    var host=$('mxpHost');presentPanel(host,L,function(){if(!DK.edit||host.isConnected)renderArcade(c);});
  }
  c.querySelectorAll('.mxr-card[data-i]').forEach(function(b){b.onclick=function(){startGame(ALLG[+b.dataset.i]);};});
}
if(W.trAdd)W.trAdd({"Board activities": "Activités au tableau", "For the smart board: call a student to the board. They do the activity and press Check. Show answer explains it, and Next student makes a new one.": "Pour le tableau interactif : appelle un élève au tableau. Il fait l’activité et appuie sur Vérifier. Voir la réponse l’explique, et Élève suivant en crée une nouvelle.", "Show activities for all grades": "Voir les activités de toutes les années", "Area": "Aire", "Perimeter": "Périmètre", "Fractions": "Fractions", "Quick questions by topic": "Questions rapides par thème", "One question at a time with four big answers. Pick a topic:": "Une question à la fois avec quatre grandes réponses. Choisis un thème :", "Work it out on the board": "Résous au tableau", "smart-board activities": "activités au tableau"});
if(W.trAdd)W.trAdd({"Topic games": "Jeux par thème", "Pick a topic and a team game. Every question in the game is about that topic, made for your class.": "Choisis un thème et un jeu d’équipe. Toutes les questions du jeu portent sur ce thème, adaptées à ta classe.", "No topics for this grade yet.": "Pas encore de thème pour cette année.", "Shape Builder": "Constructeur de formes", "Pizza Fractions": "Fractions pizza", "Each team taps two corners on its grid to build a rectangle with the area or perimeter asked. Right first scores. First team to 5 wins.": "Chaque équipe touche deux coins de sa grille pour construire un rectangle avec l’aire ou le périmètre demandé. La première juste marque. La première équipe à 5 gagne.", "Each team taps slices to shade the fraction asked, then presses Check. Higher grades get pizzas cut into more slices, so you need equivalent fractions. First team to 5 wins.": "Chaque équipe touche des parts pour colorier la fraction demandée, puis appuie sur Vérifier. Dans les grandes classes, les pizzas ont plus de parts : il faut des fractions équivalentes. La première équipe à 5 gagne."});
if(W.trAdd)W.trAdd({"Lessons": "Leçons", "Teach": "Enseigner", "Copy to my sets": "Copier dans mes séries", "Show topics for all grades": "Voir les thèmes de toutes les années", "No lessons for this grade yet.": "Pas encore de leçon pour cette année.", "Ready-made lessons for the board. Teach starts with the idea and a worked example, then practice questions with the steps. Practice skips straight to the questions.": "Des leçons toutes prêtes pour le tableau. Enseigner commence par l’idée et un exemple corrigé, puis des exercices avec les étapes. Entraînement passe directement aux exercices."});
/* 1.5.0: French for the class worlds, class team games and Presentation mode */
if(W.trAdd)W.trAdd({"Farm": "Ferme", "Candy": "Bonbons", "Rainbow": "Arc-en-ciel", "Jungle": "Jungle", "Dino": "Dino", "Island": "Île", "Arctic": "Arctique", "Pirate": "Pirates", "Desert": "Désert", "Volcano": "Volcan", "Haunted": "Hanté", "Robot": "Robots", "Themed games for your class": "Jeux à thème pour ta classe", "More games for this grade": "Plus de jeux pour cette année", "games for this grade": "jeux pour cette année", "class games": "jeux de classe", "Class team games": "Jeux d’équipe en classe", "Both teams play at once": "Les deux équipes jouent en même temps", "Team mode": "Mode équipes", "Presentation mode": "Mode présentation", "Tug of War": "Tir à la corde", "Buzzer Battle": "Bataille de buzzers", "Hot Potato Bomb": "Bombe patate chaude", "Team Race": "Course d’équipes", "Both teams answer the same question. Each right answer pulls the rope one step your way. Pull it 5 steps to win! A wrong answer freezes your team for 2 seconds.": "Les deux équipes répondent à la même question. Chaque bonne réponse tire la corde d’un cran vers toi. Tire-la de 5 crans pour gagner ! Une mauvaise réponse gèle ton équipe 2 secondes.", "Hit your buzzer first, then answer within 6 seconds. Get it wrong and the other team can steal. First team to 7 points wins.": "Appuie sur ton buzzer en premier, puis réponds en moins de 6 secondes. Si tu te trompes, l’autre équipe peut voler la question. La première équipe à 7 points gagne.", "The team holding the bomb must answer right to throw it to the other team. Nobody knows when it blows! If it explodes on your side, the other team scores. First to 3.": "L’équipe qui tient la bombe doit bien répondre pour la lancer à l’autre équipe. Personne ne sait quand elle explose ! Si elle explose de ton côté, l’autre équipe marque. Les premiers à 3 gagnent.", "Each team gets its own questions on its side. Every right answer moves your car forward; a wrong one spins you out. First car over the line wins.": "Chaque équipe a ses propres questions de son côté. Chaque bonne réponse fait avancer ta voiture, une mauvaise te fait déraper. La première voiture à passer la ligne gagne.", "Race! Each team answers its own questions": "Course ! Chaque équipe répond à ses propres questions", "BUZZ": "BUZZ", "Steal chance": "À l’autre équipe de voler !", "Wrong!": "Faux !", "Wrong! Keep holding it": "Faux ! Tu la gardes", "pulls!": "tire !", "frozen!": "gelée !", "spin out!": "dérapage !", "too slow!": "trop lent !", "wins!": "gagne !", "Rematch": "Revanche", "Top players": "Meilleurs joueurs", "Make your own exercises, then present them on the board: big question, timer, pen, reveal the answer and the steps, and points for each team.": "Crée tes propres exercices, puis présente-les au tableau : grande question, minuteur, stylo, réponse et étapes à révéler, et des points pour chaque équipe.", "New exercise set": "Nouvelle série d’exercices", "Quick set for this grade": "Série rapide pour cette année", "No exercise sets yet. Make one, or start with a quick set for this grade and edit it.": "Pas encore de série d’exercices. Crées-en une, ou commence avec une série rapide pour cette année et modifie-la.", "Sign in to keep your sets on all your devices.": "Connecte-toi pour garder tes séries sur tous tes appareils.", "Exercise set": "Série d’exercices", "Set title": "Titre de la série", "e.g. Fractions warm-up": "ex. Échauffement fractions", "Question": "Question", "Answer": "Réponse", "e.g. 3/4 + 1/8 = ?": "ex. 3/4 + 1/8 = ?", "Worked steps (one per line, optional)": "Étapes de la solution (une par ligne, facultatif)", "Wrong choices for multiple choice (comma separated, optional)": "Mauvais choix pour le QCM (séparés par des virgules, facultatif)", "Time (seconds, 0 = no timer)": "Temps (secondes, 0 = pas de minuteur)", "Add exercise": "Ajouter un exercice", "Add 5 for this grade": "En ajouter 5 pour cette année", "Add at least one question.": "Ajoute au moins une question.", "Save and present": "Enregistrer et présenter", "Present": "Présenter", "Presentation": "Présentation", "Delete": "Supprimer", "Delete this exercise set?": "Supprimer cette série d’exercices ?", "Cancel": "Annuler", "Remove": "Retirer", "Move up": "Monter", "Move down": "Descendre", "Previous": "Précédent", "Next": "Suivant", "Finish": "Terminer", "Full screen": "Plein écran", "Practice": "Entraînement", "Untitled": "Sans titre", "exercises": "exercices"});
W.renderGames=function(c){renderArcade(c);};
W.addEventListener('mxlang',function(){if(G||BX.on)return;var c=$('content');if(c&&c.querySelector('.mxr-arcade'))renderArcade(c);});
W.renderGamePlay=function(c){renderArcade(c);};
W.mxArcade={start:function(id){var g=ALLG.filter(function(x){return x.id===id;})[0];if(g)startGame(g);},games:ALLG,classGames:BOARD,forGrade:forGrade,makeQ:makeQ,lessons:LESSONS,board:BOARD,startTopic:function(gid,tid){var g=ALLG.filter(function(x){return x.id===gid;})[0],t=LESSONS.filter(function(x){return x.id===tid;})[0];if(g&&t)startGame(g,t);},version:ARCADE_VERSION};
/* Android back button closes a running game */
W.addEventListener('popstate',function(){if(G){G.pushed=false;stopGame();}});
})();
