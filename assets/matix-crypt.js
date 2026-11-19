/* =====================================================================
   Matix data scrambler — "end to end" scrambling of passwords, emails and
   Math Chat messages in Firebase.  The app scrambles on the way out and
   unscrambles on the way in, so the database only ever holds scrambled text.

   It is ONE fixed character-swap table for the whole database
   (b -> z, . -> h, @ -> d ... style).  The scrambled text never contains
   the characters Firebase forbids:  .  $  #  [  ]  /  newline / control chars
   (the swap table's output uses only letters, digits and safe symbols).

   - Characters in SRC swap 1:1 with the same position in DST.
   - The 8 characters that cannot be written as-is (. $ # [ ] / space ~)
     become  ~ + one safe character.
   - Control characters (tab, newline ...) become  ~~ + two hex swaps.
   - Letters outside plain ASCII (Arabic, accents, emoji ...) are shifted
     to other letters inside their own Unicode range (never to a forbidden char).
   - Scrambled values start with  mx2:  (older  mx1:  and old plain values are
     still understood and get upgraded automatically when they are read).
   ===================================================================== */
(function(W){
'use strict';
var PFX='mx2:',PFX1='mx1:',ESC='~';
var SRC='!"%&\'()*+,-0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\^_`abcdefghijklmnopqrstuvwxyz{|}';
var DST='&4;T"^O|v5:VLZwJWodX(,n=H\'m3U9yR%j!euCbK@rP+?phNiY8s)*}q`c>{1lfM-D2SE6gBt7FG0\\z<IaQxA_k';
var E_SRC='.$#[]/ ~';
var E_DST='ETo90\\6"';
var HEX='0123456789abcdef';
/* non-ASCII: rotate inside two big ranges (BMP letters/symbols, and the emoji plane) */
var A1=0xA0,N1=0xD7FF-0xA0+1,K1=17731,A2=0x10000,N2=0x10000,K2=24593;
function shift(cp,back){
  if(cp>=A1&&cp<A1+N1)return A1+((cp-A1+(back?N1-K1:K1))%N1);
  if(cp>=A2&&cp<A2+N2)return A2+((cp-A2+(back?N2-K2:K2))%N2);
  return cp;
}
function enc(s){
  s=String(s==null?'':s);var out='';
  for(var i=0;i<s.length;){
    var cp=s.codePointAt(i),c=String.fromCodePoint(cp);i+=c.length;
    var k=SRC.indexOf(c);
    if(k>=0){out+=DST.charAt(k);continue;}
    k=E_SRC.indexOf(c);
    if(k>=0){out+=ESC+E_DST.charAt(k);continue;}
    if(cp<32||cp===127){
      var h=HEX.charAt((cp>>4)&15)+HEX.charAt(cp&15);
      out+=ESC+ESC+DST.charAt(SRC.indexOf(h.charAt(0)))+DST.charAt(SRC.indexOf(h.charAt(1)));continue;
    }
    out+=String.fromCodePoint(shift(cp,false));
  }
  return PFX+out;
}
function dec(s){
  s=String(s==null?'':s);
  var v2=s.indexOf(PFX)===0;
  if(!v2&&s.indexOf(PFX1)!==0)return s;
  s=s.slice(PFX.length);var out='';
  for(var i=0;i<s.length;){
    var cp=s.codePointAt(i),c=String.fromCodePoint(cp);i+=c.length;
    if(c===ESC){
      var n=s.charAt(i);
      if(n===ESC){
        var a=SRC.charAt(DST.indexOf(s.charAt(i+1))),b=SRC.charAt(DST.indexOf(s.charAt(i+2)));
        out+=String.fromCharCode(HEX.indexOf(a)*16+HEX.indexOf(b));i+=3;continue;
      }
      var k=E_DST.indexOf(n);out+=k>=0?E_SRC.charAt(k):n;i+=1;continue;
    }
    var j=DST.indexOf(c);
    if(j>=0)out+=SRC.charAt(j);
    else out+=(v2&&cp>127)?String.fromCodePoint(shift(cp,true)):c;
  }
  return out;
}
function isEnc(v){return typeof v==='string'&&(v.indexOf(PFX)===0||v.indexOf(PFX1)===0);}
function isCur(v){return typeof v==='string'&&v.indexOf(PFX)===0;}
W.mxEnc=enc;W.mxDec=dec;W.mxIsEnc=isEnc;

/* ---- which database fields get scrambled ---- */
var MEMBER_F=['password','email'],CODE_F=['email'],CHAT_F=['text'],NOTE_F=['body'];
var migrated={};
function recEnc(r,F,cond){
  if(!r||typeof r!=='object')return r;
  if(cond&&!cond(r))return r;
  F.forEach(function(f){if(typeof r[f]==='string')r[f]=enc(r[f]);});return r;
}
function recDec(r,F,upPath,base,cond){
  if(!r||typeof r!=='object')return r;
  if(cond&&!cond(r))return r;
  var up=null;
  F.forEach(function(f){
    var v=r[f];if(typeof v!=='string')return;
    var old=!isCur(v);
    if(isEnc(v))r[f]=dec(v);
    if(old&&v&&upPath&&!migrated[upPath+'#'+f]){(up=up||{})[f]=enc(r[f]);migrated[upPath+'#'+f]=1;}
  });
  if(up){try{fetch(base+upPath+'.json',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(up)})['catch'](function(){});}catch(e){}}
  return r;
}
function scalar(v,dir){return typeof v!=='string'?v:(dir==='enc'?enc(v):dec(v));}
function mapAll(obj,fn){if(obj&&typeof obj==='object')Object.keys(obj).forEach(function(k){fn(obj,k);});return obj;}
function isChatNote(r){return r&&r.type==='chat';}

/* a whole  /chats/<id>/messages  map: unscramble, and upgrade old plain messages in ONE multi-path PATCH */
function chatMap(map,dir,cid,base){
  if(!map||typeof map!=='object')return map;
  var up=null;
  Object.keys(map).forEach(function(k){
    var m=map[k];if(!m||typeof m!=='object'||typeof m.text!=='string')return;
    if(dir==='enc'){m.text=enc(m.text);return;}
    var old=!isCur(m.text);
    if(isEnc(m.text))m.text=dec(m.text);
    if(old&&m.text&&cid&&!migrated['c'+cid+'/'+k]){(up=up||{})[k+'/text']=enc(m.text);migrated['c'+cid+'/'+k]=1;}
  });
  if(up){try{fetch(base+'/chats/'+cid+'/messages.json',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(up)})['catch'](function(){});}catch(e){}}
  return map;
}

/* dir = 'enc' (going to Firebase) or 'dec' (coming back). isPost: data is ONE new child of `path`. */
W.mxCryptXform=function(base,path,data,dir,isPost){
  try{
    if(data==null)return data;
    var clean=String(path).split('?')[0].replace(/^\/+|\/+$/g,''),p=clean.split('/'),root=p[0];
    if(isPost)p.push('_new');
    if(dir==='enc')data=JSON.parse(JSON.stringify(data));
    var E=dir==='enc';
    function R(r,F,up,cond){return E?recEnc(r,F,cond):recDec(r,F,up,base,cond);}
    if(root==='members'){
      if(p.length===1)return mapAll(data,function(o,k){R(o[k],MEMBER_F,'/members/'+encodeURIComponent(k));});
      if(p.length===2)return R(data,MEMBER_F,'/members/'+p[1]);
      if(p.length===3&&MEMBER_F.indexOf(p[2])>=0)return scalar(data,dir);
    }else if(root==='authCodes'){
      if(p.length===1)return mapAll(data,function(o,k){R(o[k],CODE_F,null);});
      if(p.length===2)return R(data,CODE_F,null);
      if(p.length===3&&CODE_F.indexOf(p[2])>=0)return scalar(data,dir);
    }else if(root==='deletion_backups'){
      if(p.length===1)return mapAll(data,function(o,k){if(o[k]&&typeof o[k]==='object')R(o[k].member,MEMBER_F,null);});
      if(p.length===2){if(data&&typeof data==='object')R(data.member,MEMBER_F,null);return data;}
      if(p.length===3&&p[2]==='member')return R(data,MEMBER_F,null);
    }else if(root==='chats'){
      /* Math Chat: only the message text is scrambled (typing / read markers are just numbers) */
      if(p.length===1)return mapAll(data,function(o,k){if(o[k]&&typeof o[k]==='object')chatMap(o[k].messages,dir,k,base);});
      if(p.length===2){if(data&&typeof data==='object')chatMap(data.messages,dir,p[1],base);return data;}
      if(p[2]==='messages'){
        if(p.length===3)return chatMap(data,dir,p[1],base);
        if(p.length===4)return R(data,CHAT_F,null);
        if(p.length===5&&p[4]==='text')return scalar(data,dir);
      }
    }else if(root==='notifications'){
      /* chat notifications carry a preview of the message */
      if(p.length===2)return mapAll(data,function(o,k){R(o[k],NOTE_F,null,isChatNote);});
      if(p.length===3)return R(data,NOTE_F,null,isChatNote);
    }
  }catch(e){}
  return data;
};
})(window);
