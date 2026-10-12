import{t as e}from"./gsap.CvDoa17S.js";var t=60,n=document.getElementById(`bouquet-btn`),r=document.getElementById(`bouquet-flowers`),i=document.getElementById(`bouquet-count`),a=document.getElementById(`bouquet-hint`),o=0;function s(){let e=document.createElement(`div`);return e.className=`bouquet__flower`,e.innerHTML=`
      <svg viewBox="0 0 40 40" width="22" height="22" aria-hidden="true">
        <g transform="translate(20,20)">
          <ellipse cx="0" cy="-9" rx="5" ry="9" transform="rotate(0)" />
          <ellipse cx="0" cy="-9" rx="5" ry="9" transform="rotate(72)" />
          <ellipse cx="0" cy="-9" rx="5" ry="9" transform="rotate(144)" />
          <ellipse cx="0" cy="-9" rx="5" ry="9" transform="rotate(216)" />
          <ellipse cx="0" cy="-9" rx="5" ry="9" transform="rotate(288)" />
          <circle r="4" fill="var(--roxo-soft)" />
        </g>
      </svg>
    `,e}function c(e,t,n){let r=(-85+(n<=1?.5:t/(n-1))*170)*Math.PI/180,i=22+Math.floor(t/10)*8,a=Math.min(i+Math.random()*6,47),o=50+a*Math.sin(r),s=52+a*Math.abs(Math.cos(r))*.75,c=(Math.random()-.5)*5,l=(Math.random()-.5)*4,u=(Math.random()-.5)*40;e.style.setProperty(`--x`,`${Math.max(5,Math.min(95,o+c))}%`),e.style.setProperty(`--rise`,`${Math.max(48,Math.min(94,s+l))}%`),e.style.setProperty(`--rot`,`${u}deg`)}function l(n=!0){if(o>=t){e.fromTo(r,{scale:1},{scale:1.04,duration:.14,yoyo:!0,repeat:1});return}let i=s();r.appendChild(i),c(i,o,t),o++,n?e.fromTo(i,{opacity:0,scale:0,y:16},{opacity:1,scale:1,y:0,duration:.45,ease:`back.out(1.8)`}):e.set(i,{opacity:1,scale:1,y:0})}async function u(){try{let e=await(await fetch(`/api/bouquet`)).json(),n=Number(e.count)??0;i&&(i.textContent=n.toLocaleString(`pt-BR`));let r=Math.min(n,t);for(let e=0;e<r;e++)l(!1)}catch{i&&(i.textContent=`0`)}}async function d(){a&&e.to(a,{opacity:0,duration:.3}),l(!0);try{let t=await(await fetch(`/api/bouquet`,{method:`POST`})).json(),n=Number(t.count)||0;i&&(i.textContent=n.toLocaleString(`pt-BR`),e.fromTo(i,{scale:1.3,color:`var(--cream)`},{scale:1,color:`var(--rosa)`,duration:.5,ease:`power2.out`}))}catch{}}u(),n?.addEventListener(`click`,d),window.addEventListener(`flor-enviada`,d);