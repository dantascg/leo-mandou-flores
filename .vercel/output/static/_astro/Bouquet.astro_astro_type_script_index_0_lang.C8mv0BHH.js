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
    `,e}function c(e,t,n){let r=((n<=1?.5:t/(n-1))-.5)*90,i=58+Math.floor(t/8)*10+Math.random()*7,a=(Math.random()-.5)*8,o=(Math.random()-.5)*30;e.style.setProperty(`--x`,`${50+r+a}%`),e.style.setProperty(`--rise`,`${Math.min(i,96)}%`),e.style.setProperty(`--rot`,`${o}deg`)}function l(n=!0){if(o>=t){e.fromTo(r,{scale:1},{scale:1.04,duration:.14,yoyo:!0,repeat:1});return}let i=s();r.appendChild(i),c(i,o,t),o++,n?e.fromTo(i,{opacity:0,scale:0,y:16},{opacity:1,scale:1,y:0,duration:.45,ease:`back.out(1.8)`}):e.set(i,{opacity:1,scale:1,y:0})}async function u(){try{let e=await(await fetch(`/api/bouquet`)).json(),n=Number(e.count)??0;i&&(i.textContent=n.toLocaleString(`pt-BR`));let r=Math.min(n,t);for(let e=0;e<r;e++)l(!1)}catch{i&&(i.textContent=`0`)}}async function d(){a&&e.to(a,{opacity:0,duration:.3}),l(!0);try{let t=await(await fetch(`/api/bouquet`,{method:`POST`})).json(),n=Number(t.count)||0;i&&(i.textContent=n.toLocaleString(`pt-BR`),e.fromTo(i,{scale:1.3,color:`var(--cream)`},{scale:1,color:`var(--rosa)`,duration:.5,ease:`power2.out`}))}catch{}}u(),n?.addEventListener(`click`,d),window.addEventListener(`flor-enviada`,d);