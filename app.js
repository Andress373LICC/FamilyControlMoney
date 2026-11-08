"use strict";
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEY="controlmoney.v2",MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],RM=matchMedia("(prefers-reduced-motion:reduce)").matches;
/* Configuración de Firebase (opcional, solo para iniciar sesión y sincronizar) */
const FB={apiKey:"AIzaSyDBaDolB6_DXQ9Rj2b-TRI8xUNG_NTmdlk",authDomain:"money-management-for-families.firebaseapp.com",projectId:"money-management-for-families",appId:"1:647082487611:web:c4603b8cea74d6a8f0d11e"};
const CATS=[["Vivienda","🏠","n",.35,"#6c5ce7"],["Alimentación","🍎","n",.25,"#00b894"],["Transporte","🚌","n",.15,"#0984e3"],["Salud","💊","n",.1,"#00cec9"],["Deudas","💳","n",.15,"#d63031"],["Ocio","🎉","d",.4,"#fd79a8"],["Compras","🛍️","d",.35,"#e17055"],["Otros","📦","d",.25,"#f0a500"]].map(([n,e,g,w,c])=>({n,e,g,w,c}));
const PAL=["#a29bfe","#55efc4","#fab1a0","#74b9ff"],PN={w:"por semana",q:"por quincena",m:"por mes"},PU={w:"semanas",q:"quincenas",m:"meses"};
const fresh=()=>({accounts:[{id:"a1",name:"Efectivo",cur:"HNL",open:0}],cats:JSON.parse(JSON.stringify(CATS)),budgets:{w:{},q:{},m:{}},bs:{},plan:{w:0,q:0,m:0},period:"q",moves:[],debts:[],goals:[],dx:0,est:"av",ts:0});
const norm=x=>{const d=fresh(),s=Object.assign(fresh(),x);s.budgets=Object.assign(d.budgets,x.budgets);s.plan=Object.assign(d.plan,x.plan);return s};
let S=(()=>{try{const r=localStorage.getItem(KEY);if(r)return norm(JSON.parse(r))}catch(e){}return fresh()})();
let U=null,auth,fs,st,tab="home";
const saveL=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const push=()=>fs.collection("users").doc(U.uid).set({cm2:JSON.stringify(S)},{merge:true}).catch(()=>toast("No se pudo sincronizar. Tus datos siguen guardados aquí.","warn"));
function save(){S.ts=Date.now();saveL();if(U){clearTimeout(st);st=setTimeout(push,600)}}
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
/* fechas locales (sin UTC) */
const p2=n=>String(n).padStart(2,"0"),ds=d=>d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());
const pd=s=>{const[a,b,c]=s.split("-").map(Number);return new Date(a,b-1,c)};
const add=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ds(d)};
const today=()=>ds(new Date()),fd=s=>{const d=pd(s);return d.getDate()+" "+MES[d.getMonth()]};
const mfd=m=>{const t=new Date();t.setMonth(t.getMonth()+m);return t.toLocaleDateString("es-HN",{month:"long",year:"numeric"})};
function per(date,t){const d=pd(date),y=d.getFullYear(),m=d.getMonth();let a,b;
 if(t==="w"){a=add(date,-((d.getDay()+6)%7));b=add(a,7)}
 else if(t==="q"){if(d.getDate()<=15){a=ds(new Date(y,m,1));b=ds(new Date(y,m,16))}else{a=ds(new Date(y,m,16));b=ds(new Date(y,m+1,1))}}
 else{a=ds(new Date(y,m,1));b=ds(new Date(y,m+1,1))}
 return{a,b}}
const inP=(m,p)=>m.date>=p.a&&m.date<p.b,span=p=>Math.round((pd(p.b)-pd(p.a))/864e5);
const daysLeft=p=>Math.max(1,Math.round((pd(p.b)-pd(today()))/864e5)),rng=p=>`${fd(p.a)} al ${fd(add(p.b,-1))}`;
/* dinero en centavos enteros */
const cents=v=>Math.round(parseFloat(v)*100)||0;
const L=(c,cur="HNL")=>(c<0?"−":"")+(cur==="USD"?"US$ ":"L ")+(Math.abs(c)/100).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const live=()=>S.moves.filter(m=>!m.void),sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const cat=n=>S.cats.find(c=>c.n===n)||{e:"📦",c:"#f0a500",g:"d"};
function bal(a){let t=a.open;for(const m of live()){if(m.acc===a.id)t+=m.type==="in"?m.amt:-m.amt;if(m.type==="tr"&&m.to===a.id)t+=m.amt}return t}
const spent=(c,p)=>sum(live().filter(m=>m.type==="out"&&m.cat===c&&m.cur==="HNL"&&inP(m,p)),m=>m.amt);
function env(c,p,dep=8){const lim=S.budgets[S.period][c]||0;if(!lim)return null;
 let carry=0;const st0=S.bs[S.period]?per(S.bs[S.period],S.period).a:p.a;
 if(dep>0&&p.a>st0){const e=env(c,per(add(p.a,-1),S.period),dep-1);carry=e?Math.max(0,e.left):0}
 const sp=spent(c,p);return{lim,carry,sp,left:lim+carry-sp}}
function commits(p){const out=[];
 for(const d of S.debts){if(d.bal<=0||live().some(m=>m.debt===d.id&&inP(m,p)))continue;
  const seen=new Set();
  for(const dt of [pd(p.a),pd(add(p.b,-1))]){const last=new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate();
   const due=ds(new Date(dt.getFullYear(),dt.getMonth(),Math.min(d.day,last)));
   if(!seen.has(due)&&due>=p.a&&due<p.b){seen.add(due);out.push({d,due,amt:Math.min(d.pay,d.bal)})}}}
 return out}
function avail(p){const liq=sum(S.accounts.filter(a=>a.cur==="HNL"),bal),res=sum(S.goals,g=>g.saved),cm=commits(p),cs=sum(cm,c=>c.amt);
 return{liq,res,cm,cs,disp:liq-res-cs}}
function calc(p){const t=live().filter(m=>m.cur==="HNL"&&inP(m,p)),sp={},g={n:0,d:0};let inc=0;
 S.cats.forEach(c=>sp[c.n]=0);t.forEach(m=>{if(m.type==="in")inc+=m.amt;else if(m.type==="out")sp[m.cat]=(sp[m.cat]||0)+m.amt});
 S.cats.forEach(c=>g[c.g]+=sp[c.n]);
 const sav=sum(S.goals.flatMap(x=>x.h||[]).filter(h=>h.d>=p.a&&h.d<p.b),h=>h.a);
 return{t,inc,sp,g,sav,out:g.n+g.d}}
/* Alertas, recomendaciones y salud financiera */
function analyze(p){const r=calc(p),base=r.inc||S.plan[S.period],tp=[],pc=x=>base?Math.round(x/base*100):0,dl=daysLeft(p),T=span(p),e=Math.min(T,Math.max(0,Math.round((pd(today())-pd(p.a))/864e5)+1)),a=avail(p);
 for(const c of S.cats){const x=env(c.n,p);if(!x)continue;const q=Math.round(x.sp/(x.lim+x.carry)*100);
  if(x.left<0)tp.push(["bad",`${c.e} ${esc(c.n)}: te pasaste por ${L(-x.left)}. Puedes ajustar el límite o moverle dinero de otro sobre.`]);
  else if(q>=80)tp.push(["warn",`${c.e} ${esc(c.n)}: llevas el ${q}% y faltan ${dl} días. Te quedan ${L(x.left)}.`])}
 if(a.cm.length)tp.push(["warn",`💳 Tienes ${a.cm.length} pago${a.cm.length>1?"s":""} por vencer en este periodo (${L(a.cs)}). Ya está apartado de tu disponible.`]);
 if(!base)tp.push(["warn","Escribe tu ingreso esperado en 🎯 Presupuesto para recibir recomendaciones completas."]);
 if(!r.t.length)tp.push(["warn","Aún no hay movimientos en este periodo. Registra tu primer gasto o ingreso 💪"]);
 else{
  if(r.inc&&r.out>r.inc)tp.push(["bad",`Gastaste ${L(r.out-r.inc)} más de lo que ingresó. Haz una pausa en los deseos unos días y revisa los gastos más grandes.`]);
  const bud=sum(S.cats,c=>S.budgets[S.period][c.n]||0);
  if(bud&&e>=2&&e<T){const proj=r.out/e*T;if(proj>bud)tp.push(["warn",`A este ritmo cerrarás en ${L(proj)} y tu presupuesto es ${L(bud)}. Un tope de ${L(Math.max(0,(bud-r.out)/(T-e)))} por día te mantiene en el plan.`])}
  if(pc(r.g.n)>50)tp.push(["warn",`Tus necesidades son el ${pc(r.g.n)}% del ingreso (ideal 50%). Mira si puedes bajar servicios o comparar precios.`]);
  if(pc(r.g.d)>30)tp.push(["warn",`Tus deseos son el ${pc(r.g.d)}% del ingreso (ideal 30%). Un tope para ocio y compras te ayuda.`]);
  if(base&&pc(r.sav)<20)tp.push(["warn",`Estás ahorrando el ${pc(r.sav)}% (meta 20%). Aparta tu ahorro el mismo día que cobras.`]);
  const pr=calc(per(add(p.a,-1),S.period));if(pr.out>0&&r.out>pr.out*1.2)tp.push(["warn",`Tus gastos subieron ${Math.round(r.out/pr.out*100-100)}% frente al periodo anterior.`]);
  const top=[...S.cats].sort((x,y)=>r.sp[y.n]-r.sp[x.n])[0];if(top&&r.sp[top.n])tp.push(["ok",`Tu mayor gasto es ${top.e} ${esc(top.n)} (${L(r.sp[top.n])}). Si lo bajas un 10% te ahorras ${L(r.sp[top.n]/10)}.`]);
  if(!tp.some(x=>x[0]!=="ok"))tp.unshift(["ok","¡Vas muy bien! Tu periodo está dentro del plan 50/30/20 🎉"])}
 const over=S.cats.filter(c=>{const x=env(c.n,p);return x&&x.left<0}).length;
 let score=100-over*12-(r.inc&&r.out>r.inc?25:0)-Math.max(0,20-pc(r.sav))*1.2;if(!r.t.length)score=0;
 return{r,tp,a,score:Math.max(0,Math.min(100,Math.round(score)))}}
/* Simulador de deudas: interés mensual = saldo × tasa anual ÷ 12 */
function sim(e,x){const d=S.debts.filter(q=>q.bal>0).map(q=>({b:q.bal,r:q.rate/1200,m:q.pay}));if(!d.length)return null;
 const tot=sum(d,q=>q.m)+x;let mo=0,int=0;
 while(d.some(q=>q.b>.5)&&mo<600){mo++;d.forEach(q=>{if(q.b>.5){const i=q.b*q.r;q.b+=i;int+=i}});
  let p=e==="m"?1e15:tot;const a=d.filter(q=>q.b>.5);
  a.forEach(q=>{const k=Math.min(q.m,q.b,p);q.b-=k;p-=k});
  if(e!=="m")a.sort(e==="av"?(u,v)=>v.r-u.r:(u,v)=>u.b-v.b).forEach(q=>{if(p>0&&q.b>0){const k=Math.min(p,q.b);q.b-=k;p-=k}})}
 return{mo,int,bad:mo>=600}}
function nextDue(d){const n=new Date(),mk=(y,m)=>ds(new Date(y,m,Math.min(d.day,new Date(y,m+1,0).getDate())));let x=mk(n.getFullYear(),n.getMonth());if(x<today())x=mk(n.getFullYear(),n.getMonth()+1);return x}
/* Vistas */
const bar=(q,c)=>`<div class="prog"><i style="width:${Math.min(100,Math.max(0,q))}%${c?";background:"+c:""}"></i></div>`;
const stc=q=>q>=100?"var(--bad)":q>=80?"var(--wn)":"";
const card=(h,c="")=>`<section class="card ${c}">${h}</section>`;
const al=a=>a.map(([k,m])=>`<div class="al ${k}">${m}</div>`).join("");
const chips=()=>`<div class="chips">${[["w","Semanal"],["q","Quincenal"],["m","Mensual"]].map(([k,n])=>`<button data-a="per" data-id="${k}" class="${S.period===k?"on":""}">${n}</button>`).join("")}</div>`;
function home(){const p=per(today(),S.period),{r,tp,a,score}=analyze(p),dl=daysLeft(p),f=x=>Math.max(0,x);
 let off=0;const tot=r.out||1,segs=S.cats.filter(c=>r.sp[c.n]).map(c=>{const q=r.sp[c.n]/tot*100,s=`<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${c.c}" stroke-width="6" stroke-dasharray="${q} ${100-q}" stroke-dashoffset="${25-off}"/>`;off+=q;return s}).join("");
 const lg=S.cats.filter(c=>r.sp[c.n]).map(c=>`<div><i style="background:${c.c}"></i>${c.e} ${esc(c.n)} ${L(r.sp[c.n])}</div>`).join("");
 const sc=score>=75?"var(--ok)":score>=45?"var(--wn)":"var(--bad)";
 const share=encodeURIComponent(`💚 *ControlMoney*\n📅 ${rng(p)}\n\n💵 Ingresos: ${L(r.inc)}\n🧾 Gastos: ${L(r.out)}\n🐷 Ahorro: ${L(r.sav)}\n✅ Disponible para gastar: ${L(a.disp)}\n\n${S.cats.filter(c=>r.sp[c.n]).map(c=>`${c.e} ${c.n}: ${L(r.sp[c.n])}`).join("\n")}`);
 return chips()+`<section class="hero"><p>✨ Disponible para gastar</p><h1 data-n="${a.disp}">${L(a.disp)}</h1>
 <p>${rng(p)}, quedan ${dl} día${dl>1?"s":""}${a.disp>0?`. Unos ${L(Math.floor(a.disp/dl))} por día.`:""}</p>
 <div class="bar" role="img" aria-label="Reparto de tu saldo"><i style="flex:${f(a.disp)};background:#fff"></i><i style="flex:${a.res};background:#fd79a8"></i><i style="flex:${a.cs};background:#ffd166"></i></div>
 <ul><li><span>Saldo en cuentas (lempiras)</span><b>${L(a.liq)}</b></li><li><span><span class="dot" style="background:#fd79a8"></span>Reservado en metas</span><b>− ${L(a.res)}</b></li></ul>
 <details><summary><span><span class="dot" style="background:#ffd166"></span>Comprometido en este periodo</span><b>− ${L(a.cs)}</b></summary>
 <ul>${a.cm.length?a.cm.map(c=>`<li><span>${esc(c.d.name)}, vence ${fd(c.due)}</span><b>${L(c.amt)}</b></li>`).join(""):"<li>Nada por vencer en este periodo 🙌</li>"}</ul></details></section>
 <div class="kp">${card(`<div class="k">💵 Ingresos</div><div class="big in" data-n="${r.inc}">${L(r.inc)}</div>`)}${card(`<div class="k">🧾 Gastos</div><div class="big out" data-n="${r.out}">${L(r.out)}</div>`)}${card(`<div class="k">🐷 Ahorro</div><div class="big" data-n="${r.sav}">${L(r.sav)}</div>`)}</div>
 <div class="two">${card(`<h3>Salud financiera</h3><div class="ring"><svg viewBox="0 0 42 42"><circle r="15.9155" cx="21" cy="21" fill="none" stroke="var(--line)" stroke-width="4"/><circle r="15.9155" cx="21" cy="21" fill="none" stroke="${sc}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${score} ${100-score}" stroke-dashoffset="25" style="animation:gr 1.2s both"/></svg><b>${score}</b></div><p class="empty" style="padding:6px">${r.t.length?score>=75?"Excelente control 🔥":score>=45?"Vas bien, puedes mejorar":"Hay que ajustar un poco":"Aún sin datos"}</p>`)}
 ${card(`<h3>¿A dónde se va tu dinero?</h3>${r.out?`<div class="dn"><svg viewBox="0 0 42 42"><circle r="15.9155" cx="21" cy="21" fill="none" stroke="var(--line)" stroke-width="6"/>${segs}</svg><div class="lg">${lg}</div></div>`:`<p class="empty">Registra gastos y verás tu gráfica 📊</p>`}`)}</div>
 <h2>💡 Para tener en cuenta</h2>${al(tp)}
 <h2>Mis cuentas</h2>${S.accounts.map(c=>`<div class="card row"><span>${esc(c.name)} <span class="k">${c.cur}</span></span><b>${L(bal(c),c.cur)}</b></div>`).join("")}
 <a class="btn wa" href="https://wa.me/?text=${share}" target="_blank" rel="noopener">📲 Compartir resumen por WhatsApp</a>`}
function moves(){const l=[...S.moves].sort((x,y)=>y.date.localeCompare(x.date)).slice(0,150);
 if(!l.length)return`<h2>🧾 Movimientos</h2><p class="empty">Todavía no hay movimientos.<br>Toca + y registra el primero 🚀</p>`;
 const an=id=>(S.accounts.find(a=>a.id===id)||{name:"?"}).name;
 return`<h2>🧾 Movimientos</h2><div class="card">${l.map(m=>`<div class="mv${m.void?" v":""}"><span class="em">${m.type==="tr"?"🔁":m.type==="in"?"💵":cat(m.cat).e}</span><div><b>${m.type==="tr"?"Transferencia":m.type==="in"?"Ingreso":esc(m.cat)}</b><small>${fd(m.date)}, ${esc(an(m.acc))}${m.type==="tr"?" → "+esc(an(m.to)):""}${m.note?", "+esc(m.note):""}</small></div><b class="${m.type==="in"?"in":m.type==="out"?"out":""}">${m.type==="in"?"+":m.type==="out"?"−":""}${L(m.amt,m.cur)}</b>${m.void?"":`<button class="mini ghost" data-a="anular" data-id="${m.id}" aria-label="Anular">✕</button>`}</div>`).join("")}</div>`}
function bud(){const p=per(today(),S.period),I=S.plan[S.period],B=g=>sum(S.cats.filter(c=>c.g===g),c=>S.budgets[S.period][c.n]||0);
 const gs=[["n","Necesidades",.5],["d","Deseos",.3]].map(([g,n,i])=>{const t=B(g);return`<div style="margin:12px 0"><div class="row"><b>${n}</b><span class="k">${L(t)} (${I?Math.round(t/I*100):0}%, ideal ${i*100}%)</span></div>${bar(I?t/(I*i)*100:0,"var(--p)")}</div>`}).join("")+`<div class="row"><b>🐷 Ahorro sugerido</b><span class="k">${L(Math.round(I*.2))} (20%)</span></div>`;
 return chips()+`<h2>🎯 Plan ${PN[S.period]}</h2>${card(`<div class="row"><div><div class="k">Ingreso esperado</div><div class="big">${L(I)}</div></div><button data-a="plan">Cambiar</button></div><button class="btn full" data-a="repartir">✨ Repartir 50/30/20</button>${gs}`)}
 <p class="k">${rng(p)}. El sobrante pasa al siguiente periodo de la misma categoría.</p>`+S.cats.map(c=>{const e=env(c.n,p),sp=spent(c.n,p);
  if(!e)return`<div class="card row"><div><b>${c.e} ${esc(c.n)}</b><div class="k">Gastado: ${L(sp)}</div></div><button class="mini" data-a="lim" data-id="${esc(c.n)}">Poner límite</button></div>`;
  const q=Math.round(e.sp/(e.lim+e.carry)*100);
  return`<div class="card"><div class="row"><b>${c.e} ${esc(c.n)}</b><button class="mini" data-a="lim" data-id="${esc(c.n)}">Límite ${L(e.lim)}</button></div>${bar(q,stc(q))}
  <div class="row"><span class="k">Gastado ${L(e.sp)}${e.carry?`, arrastre ${L(e.carry)}`:""}</span><b class="${e.left<0?"out":"in"}">Disponible ${L(e.left)}</b></div></div>`}).join("")}
function debt(){const D=S.debts,act=D.filter(q=>q.bal>0),tot=sum(act,q=>q.bal),mins=sum(act,q=>q.pay),ints=sum(act,q=>q.bal*q.rate/1200);
 const A=sim("av",S.dx),B=sim("bn",S.dx),M=sim("m",0),cur=S.est==="av"?A:B,sv=M&&cur&&!M.bad&&!cur.bad?M.int-cur.int:0;
 const col=(t,k,r)=>`<div class="sb${S.est===k?" on":""}"><b>${t}</b>${!r?"<br>—":r.bad?"<br>No se liquida":`<br>⏱️ ${r.mo} meses<br>💸 ${L(Math.round(r.int))} de interés<br>📅 ${mfd(r.mo)}`}</div>`;
 const ord=[...act].sort(S.est==="av"?(a,b)=>b.rate-a.rate||a.bal-b.bal:(a,b)=>a.bal-b.bal||b.rate-a.rate).concat(D.filter(q=>q.bal<=0));
 return`<div class="row"><h2>💳 Deudas</h2><button class="btn mini" data-a="addDebt">Nueva deuda</button></div>
 ${act.length?card(`<div class="kp" style="margin:0"><div><div class="k">Debes en total</div><div class="big">${L(tot)}</div></div><div><div class="k">Cuotas al mes</div><div class="big">${L(mins)}</div></div><div><div class="k">Intereses al mes</div><div class="big out">${L(Math.round(ints))}</div></div></div>
 <div class="row" style="margin-top:12px"><div><div class="k">💰 Extra mensual para deudas</div><b>${L(S.dx)}</b></div><button class="mini" data-a="dx">Cambiar</button></div>
 <div class="acts"><button class="mini ${S.est==="av"?"btn":""}" data-a="est" data-id="av">🏔️ Avalancha</button><button class="mini ${S.est==="bn"?"btn":""}" data-a="est" data-id="bn">⛄ Bola de nieve</button></div>
 <p class="k">Avalancha: primero la tasa más alta, pagas menos intereses. Bola de nieve: primero el saldo más pequeño, cierras deudas más rápido.</p>`)+card(`<h3>⚖️ Comparación</h3><div class="sbs" style="margin-top:10px">${col("🏔️ Avalancha","av",A)}${col("⛄ Bola de nieve","bn",B)}${col("Solo cuotas","",M)}</div>${sv>100?`<div class="al ok">Con ${S.est==="av"?"avalancha":"bola de nieve"} y tu extra ahorras ${L(Math.round(sv))} en intereses frente a pagar solo las cuotas.</div>`:""}`):`<p class="empty">Sin deudas registradas 🎉<br>Agrega una para ver cuánto pagas de intereses y cuándo terminas.</p>`}
 ${ord.map((q,k)=>{const pc=q.orig?Math.max(0,Math.min(100,(1-q.bal/q.orig)*100)):0,live=q.bal>0;
  return card(`<div class="row"><b>${live?(k===0&&act.length>1?"🎯 ":""):"✅ "}${esc(q.name)}</b><b class="big">${L(q.bal)}</b></div>${bar(pc)}
  <div class="k">${live?`Cuota ${L(q.pay)} el día ${q.day}, interés ${q.rate}% anual (~${L(Math.round(q.bal*q.rate/1200))} al mes). Próximo pago: ${fd(nextDue(q))}.${k===0&&act.length>1?" Esta recibe el dinero extra.":""}`:"¡Deuda liquidada! 🎉"}</div>
  <div class="acts">${live?`<button class="btn mini" data-a="payDebt" data-id="${q.id}">Registrar pago</button>`:""}<button class="mini ghost dng" data-a="delDebt" data-id="${q.id}">Eliminar</button></div>`)}).join("")}`}
function goal(){const w=Math.round(S.plan[S.period]*.2);
 return`<div class="row"><h2>🐷 Ahorros y metas</h2><button class="btn mini" data-a="addGoal">Nueva meta</button></div><p class="k">El dinero de las metas sigue en tu cuenta, pero se aparta de tu disponible.</p>`+(S.goals.length?S.goals.map(g=>{const q=Math.min(100,Math.round(g.saved/g.target*100));
  return card(`<div class="row"><b>🎯 ${esc(g.name)}</b><b>${q}%</b></div>${bar(q)}<div class="k">${L(g.saved)} de ${L(g.target)}${g.saved<g.target?`, faltan ${L(g.target-g.saved)}. ${w?`Con ${L(w)} ${PN[S.period]} (20% de tu ingreso) llegas en ~${Math.ceil((g.target-g.saved)/w)} ${PU[S.period]}.`:"Escribe tu ingreso esperado en Presupuesto para estimar el tiempo."}`:". ¡Meta lograda! 🎉"}</div>
  <div class="acts"><button class="btn mini" data-a="goalIn" data-id="${g.id}">Aportar</button><button class="mini" data-a="goalOut" data-id="${g.id}">Retirar</button><button class="mini ghost dng" data-a="delGoal" data-id="${g.id}">Eliminar</button></div>`)}).join(""):`<p class="empty">Crea tu primera meta, por ejemplo un fondo de emergencia 🛟</p>`)}
function more(){return`<div class="row"><h2>🏦 Cuentas</h2><button class="btn mini" data-a="addAcc">Nueva cuenta</button></div>`+S.accounts.map(a=>`<div class="card row"><span>${esc(a.name)} <span class="k">${a.cur}</span></span><b>${L(bal(a),a.cur)}</b></div>`).join("")+
 `<div class="row"><h2>🏷️ Categorías</h2><button class="mini" data-a="addCat">Agregar</button></div><div class="card">${S.cats.map(c=>`${c.e} ${esc(c.n)}`).join(", ")}</div>
 <h2>☁️ Nube</h2>${card(U?`<p style="margin-top:0">Sesión: <b>${esc(U.email||"Google")}</b><br><span class="k">Tus datos se sincronizan entre tus dispositivos.</span></p><button class="ghost" data-a="logout">Cerrar sesión</button>`:`<p class="k" style="margin-top:0">Opcional. Inicia sesión para guardar tus datos en la nube y usarlos en tu teléfono y computadora. Si no, quedan solo en este dispositivo.</p><div class="acts"><button class="btn" data-a="login" data-id="">Iniciar sesión</button><button data-a="login" data-id="1">Crear cuenta</button><button data-a="google">Google</button></div>`)}
 <h2>💾 Tus datos</h2>${card(`<div class="acts" style="margin-top:0"><button class="btn" data-a="exp">Copiar respaldo</button><button data-a="imp">Restaurar respaldo</button><button class="ghost dng" data-a="reset">Borrar todo</button></div>`)}`}
const V={home,moves,bud,debt,goal,more};
const TABS=[["home","🏠","Inicio"],["moves","🧾","Movs"],["bud","🎯","Plan"],["debt","💳","Deudas"],["goal","🐷","Metas"],["more","⚙️","Más"]];
$("#nav").innerHTML=TABS.map(([k,e,n])=>`<button data-a="tab" data-id="${k}"><span>${e}</span>${n}</button>`).join("");
function render(anim){const a=$("#app");a.innerHTML=V[tab]();a.className=anim?"go":"";
 if(anim)[...a.children].forEach((e,i)=>e.style.setProperty("--i",i));
 document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.id===tab?"page":"false"));
 if(anim&&!RM)document.querySelectorAll("[data-n]").forEach(el=>{const to=+el.dataset.n,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/800);el.textContent=L(Math.round(to*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(f)})(t0)})}
function toast(m,k="ok"){const e=document.createElement("div");e.className="ts "+k;e.textContent=m;$("#toast").append(e);setTimeout(()=>e.remove(),3600)}
function boom(){if(RM)return;for(let i=0;i<26;i++){const e=document.createElement("span");e.className="cf";e.textContent=["🎉","✨","💚","🪙","💜"][i%5];e.style.cssText=`left:${Math.random()*100}vw;animation-delay:${Math.random()*.6}s`;document.body.append(e);setTimeout(()=>e.remove(),3200)}}
function form(title,fs,ok,lab="Guardar"){const d=$("#dlg");
 d.innerHTML=`<form id="f"><h3>${title}</h3>${fs.map(f=>`<label>${f.l}${f.t==="select"?`<select name="${f.k}">${f.o.map(o=>`<option value="${esc(o[0])}"${o[0]===f.v?" selected":""}>${esc(o[1])}</option>`).join("")}</select>`:f.t==="area"?`<textarea name="${f.k}">${esc(f.v??"")}</textarea>`:`<input name="${f.k}" type="${f.t||"text"}" value="${esc(f.v??"")}" ${f.t==="number"?'step="0.01" min="0" inputmode="decimal"':""} ${f.r===false?"":"required"}>`}</label>`).join("")}<div class="row"><button type="button" class="ghost" id="x">Cancelar</button><button class="btn">${lab}</button></div></form>`;
 d.showModal();$("#x").onclick=()=>d.close();
 $("#f").onsubmit=e=>{e.preventDefault();const r=ok(Object.fromEntries(new FormData(e.target)));if(r){toast(r,"warn");return}d.close();save();render()}}
const accO=l=>l.map(a=>[a.id,`${a.name} (${a.cur})`]);
/* Nube opcional (Firebase) */
const loadScr=u=>new Promise((r,j)=>{const s=document.createElement("script");s.src=u;s.onload=r;s.onerror=j;document.head.append(s)});
async function fb(){if(auth)return;const b="https://www.gstatic.com/firebasejs/10.12.2/firebase-";await loadScr(b+"app-compat.js");await Promise.all([loadScr(b+"auth-compat.js"),loadScr(b+"firestore-compat.js")]);firebase.initializeApp(FB);auth=firebase.auth();fs=firebase.firestore();auth.onAuthStateChanged(onUser)}
function onUser(u){U=u;if(!u){render();return}
 try{localStorage.setItem("cm-cloud","1")}catch(e){}
 fs.collection("users").doc(u.uid).get().then(d=>{const c=d.exists&&d.data().cm2;
  if(c){const x=norm(JSON.parse(c));if(x.ts>S.ts){S=x;saveL();toast("Datos de la nube cargados ☁️")}else push()}else push();render()}).catch(()=>{toast("No se pudo leer la nube.","warn");render()})}
const cerr=x=>toast(x&&x.code==="auth/unauthorized-domain"?"Agrega este dominio en Firebase > Authentication > Authorized domains.":"No se pudo entrar. Revisa tus datos y tu internet.","bad");
const acts={
tab:id=>{tab=id;render(1);scrollTo(0,0)},
per:id=>{S.period=id;save();render(1)},
theme(){const d=document.documentElement,n=(d.dataset.theme||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))==="dark"?"light":"dark";d.dataset.theme=n;try{localStorage.setItem("cm-theme",n)}catch(e){}$("#tb").textContent=n==="dark"?"☀️":"🌙"},
add(){const A=S.accounts;if(!A.length)return toast("Primero crea una cuenta en Más.","warn");
 form("Nuevo movimiento",[{k:"amt",l:"Monto",t:"number"},{k:"type",l:"Tipo",t:"select",o:[["out","Gasto"],["in","Ingreso"],["tr","Transferencia"]]},{k:"acc",l:"Cuenta",t:"select",o:accO(A)},{k:"cat",l:"Categoría",t:"select",o:S.cats.map(c=>[c.n,`${c.e} ${c.n}`]),v:"Otros"},{k:"to",l:"Cuenta destino",t:"select",o:accO(A)},{k:"date",l:"Fecha",t:"date",v:today()},{k:"note",l:"Nota (opcional)",r:false}],o=>{
  const amt=cents(o.amt);if(amt<=0)return"Escribe un monto mayor que cero.";
  const a=A.find(x=>x.id===o.acc),m={id:uid(),type:o.type,amt,cur:a.cur,acc:a.id,date:o.date,note:o.note||""};
  if(o.type==="out")m.cat=o.cat;
  if(o.type==="tr"){const b=A.find(x=>x.id===o.to);if(!b||b.id===a.id)return"Elige una cuenta destino distinta.";if(b.cur!==a.cur)return"Por ahora las transferencias deben ser entre cuentas de la misma moneda.";m.to=b.id}
  S.moves.push(m);
  if(o.type==="out"&&a.cur==="HNL"&&inP(m,per(today(),S.period))){const e=env(o.cat,per(today(),S.period)),q=e?Math.round(e.sp/(e.lim+e.carry)*100):0;setTimeout(()=>q>=100?toast(`🚨 Te pasaste en ${o.cat}`,"bad"):q>=80?toast(`⚠️ Llevas ${q}% en ${o.cat}`,"warn"):toast("Gasto guardado ✅"),50)}
  else setTimeout(()=>toast(o.type==="in"?"Ingreso guardado 💵":"Movimiento guardado ✅"),50)});
 const f=$("#f").elements,sy=()=>{const t=f.type.value;f.cat.parentElement.hidden=t!=="out";f.to.parentElement.hidden=t!=="tr"};f.type.onchange=sy;sy();f.amt.focus()},
anular(id){const m=S.moves.find(x=>x.id===id);form("¿Anular este movimiento? Queda tachado en el historial y deja de contar en tus saldos.",[],()=>{m.void=true;if(m.debt){const d=S.debts.find(x=>x.id===m.debt);if(d)d.bal+=m.cap||0}},"Anular")},
plan(){form("Ingreso esperado "+PN[S.period],[{k:"v",l:"Monto",t:"number",v:S.plan[S.period]?(S.plan[S.period]/100).toFixed(2):""}],o=>{S.plan[S.period]=cents(o.v);if(!Object.keys(S.budgets[S.period]).length&&S.plan[S.period])acts.repartir(1)})},
repartir(q){const I=S.plan[S.period];if(!I)return toast("Primero escribe tu ingreso esperado.","warn");
 const sh={n:.5,d:.3};S.cats.forEach(c=>{const gw=sum(S.cats.filter(x=>x.g===c.g),x=>x.w||.2);S.budgets[S.period][c.n]=Math.round(I*sh[c.g]*(c.w||.2)/gw)});
 S.bs[S.period]=S.bs[S.period]||today();save();render();toast(`Plan 50/30/20 aplicado ✨ Aparta ${L(Math.round(I*.2))} para tus metas`)},
lim(c){const cur=S.budgets[S.period][c];form("Límite para "+esc(c),[{k:"v",l:"Monto por periodo (0 para quitar)",t:"number",v:cur?(cur/100).toFixed(2):""}],o=>{const v=cents(o.v);if(v>0){S.budgets[S.period][c]=v;S.bs[S.period]=S.bs[S.period]||today()}else delete S.budgets[S.period][c]})},
addDebt(){form("Nueva deuda",[{k:"name",l:"Nombre del préstamo"},{k:"bal",l:"Saldo pendiente (L)",t:"number"},{k:"rate",l:"Interés anual (%)",t:"number",v:"0"},{k:"pay",l:"Cuota mensual (L)",t:"number"},{k:"day",l:"Día del mes en que vence",t:"number",v:"1"}],o=>{
  const bal=cents(o.bal),pay=cents(o.pay),day=Math.min(31,Math.max(1,parseInt(o.day)||1));if(bal<=0||pay<=0)return"Escribe el saldo y la cuota.";
  S.debts.push({id:uid(),name:o.name.trim(),bal,orig:bal,rate:parseFloat(o.rate)||0,pay,day})})},
payDebt(id){const d=S.debts.find(x=>x.id===id),A=S.accounts.filter(a=>a.cur==="HNL");if(!A.length)return toast("Necesitas una cuenta en lempiras.","warn");
 form("Pago de "+esc(d.name),[{k:"amt",l:"Monto pagado",t:"number",v:(Math.min(d.pay,d.bal)/100).toFixed(2)},{k:"acc",l:"Pagar desde",t:"select",o:A.map(a=>[a.id,a.name])},{k:"date",l:"Fecha",t:"date",v:today()}],o=>{
  const amt=cents(o.amt);if(amt<=0)return"Escribe un monto mayor que cero.";
  const int=Math.min(amt,Math.round(d.bal*d.rate/1200)),cap=Math.min(amt-int,d.bal);d.bal-=cap;
  S.moves.push({id:uid(),type:"out",amt,cur:"HNL",acc:o.acc,cat:"Deudas",date:o.date,debt:d.id,cap,int,note:`${d.name}: capital ${L(cap)}, interés ${L(int)}`});
  if(d.bal<=0){boom();setTimeout(()=>toast("🎉 ¡Deuda liquidada!"),50)}})},
delDebt(id){form("¿Eliminar esta deuda? Los pagos ya registrados se conservan.",[],()=>{S.debts=S.debts.filter(x=>x.id!==id)},"Eliminar")},
dx(){form("Extra mensual para deudas",[{k:"v",l:"Monto (L)",t:"number",v:S.dx?(S.dx/100).toFixed(2):"0"}],o=>{S.dx=cents(o.v)})},
est:id=>{S.est=id;save();render()},
addGoal(){form("Nueva meta",[{k:"name",l:"Nombre"},{k:"target",l:"Monto objetivo (L)",t:"number"},{k:"saved",l:"Ya reservado (L)",t:"number",v:"0"}],o=>{const t=cents(o.target);if(t<=0)return"Escribe el monto objetivo.";S.goals.push({id:uid(),name:o.name.trim(),target:t,saved:cents(o.saved),h:[]})})},
goalIn(id){const g=S.goals.find(x=>x.id===id);form("Aportar a "+esc(g.name),[{k:"v",l:"Monto (L)",t:"number"}],o=>{const v=cents(o.v);if(v<=0)return"Escribe un monto.";const w=g.saved<g.target;g.saved+=v;(g.h=g.h||[]).push({d:today(),a:v});if(w&&g.saved>=g.target){boom();setTimeout(()=>toast("🎉 ¡Meta lograda!"),50)}})},
goalOut(id){const g=S.goals.find(x=>x.id===id);form("Retirar de "+esc(g.name),[{k:"v",l:"Monto (L)",t:"number"}],o=>{const v=Math.min(g.saved,cents(o.v));g.saved-=v;(g.h=g.h||[]).push({d:today(),a:-v})})},
delGoal(id){form("¿Eliminar esta meta? Su dinero vuelve a tu disponible.",[],()=>{S.goals=S.goals.filter(x=>x.id!==id)},"Eliminar")},
addAcc(){form("Nueva cuenta",[{k:"name",l:"Nombre (efectivo, banco, billetera)"},{k:"cur",l:"Moneda",t:"select",o:[["HNL","Lempiras (HNL)"],["USD","Dólares (USD)"]]},{k:"open",l:"Saldo inicial",t:"number",v:"0"}],o=>{S.accounts.push({id:uid(),name:o.name.trim(),cur:o.cur,open:cents(o.open)})})},
addCat(){form("Nueva categoría",[{k:"n",l:"Nombre"},{k:"e",l:"Emoji",v:"🏷️"},{k:"g",l:"Tipo",t:"select",o:[["n","Necesidad"],["d","Deseo"]]}],o=>{const n=o.n.trim();if(!n||S.cats.some(c=>c.n===n))return"Ese nombre ya existe o está vacío.";S.cats.push({n,e:o.e||"🏷️",g:o.g,w:.2,c:PAL[S.cats.length%PAL.length]})})},
login(m){form(m?"Crear cuenta":"Iniciar sesión",[{k:"e",l:"Correo",t:"email"},{k:"p",l:"Contraseña (mínimo 6 caracteres)",t:"password"}],o=>{fb().then(()=>m?auth.createUserWithEmailAndPassword(o.e,o.p):auth.signInWithEmailAndPassword(o.e,o.p)).then(()=>toast("Sesión iniciada ☁️")).catch(cerr)},m?"Crear cuenta":"Entrar")},
google(){fb().then(()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())).catch(cerr)},
logout(){form("¿Cerrar sesión? Tus datos siguen guardados en este dispositivo.",[],()=>{auth.signOut();try{localStorage.removeItem("cm-cloud")}catch(e){}},"Cerrar sesión")},
exp(){form("Respaldo de tus datos",[{k:"j",l:"Copia este texto y guárdalo",t:"area",v:JSON.stringify(S)}],()=>{try{navigator.clipboard.writeText(JSON.stringify(S));toast("Respaldo copiado 📋")}catch(e){}},"Copiar")},
imp(){form("Restaurar respaldo",[{k:"j",l:"Pega aquí tu respaldo",t:"area"}],o=>{try{const x=JSON.parse(o.j);if(!Array.isArray(x.accounts)||!Array.isArray(x.moves))return"Ese texto no es un respaldo de ControlMoney.";S=norm(x)}catch(e){return"No se pudo leer el respaldo."}},"Restaurar")},
reset(){form("¿Borrar todos tus datos de este dispositivo? No se puede deshacer.",[],()=>{S=fresh()},"Borrar todo")}
};
document.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(b&&acts[b.dataset.a])acts[b.dataset.a](b.dataset.id);
 const r=e.target.closest(".btn");if(r&&!RM){const q=r.getBoundingClientRect(),s=document.createElement("span"),z=Math.max(q.width,q.height);s.className="rip";s.style.cssText=`width:${z}px;height:${z}px;left:${e.clientX-q.left-z/2}px;top:${e.clientY-q.top-z/2}px`;r.append(s);setTimeout(()=>s.remove(),600)}});
(()=>{let t;try{t=localStorage.getItem("cm-theme")}catch(e){}if(t)document.documentElement.dataset.theme=t;$("#tb").textContent=(t||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))==="dark"?"☀️":"🌙"})();
render(1);
try{if(localStorage.getItem("cm-cloud"))fb().catch(()=>{})}catch(e){}
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
