import gsap from "gsap";

// ─────────────────────────────────────────────────────────────
// CURSOR CUSTOMIZADO — petal-cursor.js
//
// Para trocar o cursor por um PNG ou .cur:
// 1. Vá em Layout.astro e substitua o <svg> dentro de #petal-cursor
//    por: <img src="/cursor/cursor.png" alt="" />
// 2. Em global.css, em body.has-petal-cursor:
//    - Descomente: cursor: url('/cursor/cursor.cur'), auto;
//    - Comente: cursor: none;
// 3. Se fizer isso, você pode manter as pétalas de rastro (spawnTrailPetal)
//    ou removê-las apagando o bloco dentro do mousemove abaixo
// ─────────────────────────────────────────────────────────────

export function initPetalCursor() {
  // Não ativa em telas de toque (mobile) — não há mouse de verdade
  const isTouch = window.matchMedia("(hover: none)").matches;
  if (isTouch) return;

  const cursor = document.getElementById("petal-cursor");
  if (!cursor) return;

  document.body.classList.add("has-petal-cursor");
  cursor.style.opacity = "1";

  const quickX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
  const quickY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });
  const quickRotate = gsap.quickTo(cursor, "rotate", { duration: 0.5, ease: "power2.out" });

  let lastX = 0;
  let lastY = 0;
  // Distância mínima percorrida antes de spawnar próxima pétala
  const SPAWN_DIST = 28;
  let distAccum = 0;

  window.addEventListener("mousemove", (e) => {
    quickX(e.clientX);
    quickY(e.clientY);

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.hypot(dx, dy);

    // Rotaciona o cursor na direção do movimento
    if (dist > 2) {
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      quickRotate(angle + 45);
    }

    // ─────────────────────────────────────────────────────
    // RASTRO DE PÉTALAS
    // Acumula distância percorrida; spawna uma pétala a cada
    // SPAWN_DIST px — evita buracos (mouse rápido) e excesso
    // (mouse lento). Interpola posição para rastro uniforme.
    // ─────────────────────────────────────────────────────
    distAccum += dist;

    if (distAccum >= SPAWN_DIST) {
      // Quantas pétalas emitir (sem exagero)
      const count = Math.floor(distAccum / SPAWN_DIST);
      for (let i = 0; i < count; i++) {
        const frac = (i + 1) / count;
        spawnTrailPetal(lastX + dx * frac, lastY + dy * frac);
      }
      distAccum = distAccum % SPAWN_DIST;
    }

    lastX = e.clientX;
    lastY = e.clientY;
  });

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
  });

  // Esconde sobre inputs/textarea para não atrapalhar a digitação
  document.addEventListener("mouseover", (e) => {
    const target = /** @type {Element} */ (e.target);
    const interactive = target.closest("textarea, input, button, a");
    cursor.classList.toggle("petal-cursor--active", !!interactive);
  });

  // ─────────────────────────────────────────────────────────
  // PÉTALA DE RASTRO
  // Cada pétala tem tamanho, rotação e deriva lateral únicos,
  // simulando pétalas caindo com um leve toque de vento.
  // Para trocar por outra forma: edite border-radius e background.
  // ─────────────────────────────────────────────────────────
  function spawnTrailPetal(x, y) {
    const petal = document.createElement("div");
    petal.className = "petal-trail";

    // Tamanho variado (5px a 9px)
    const size = 5 + Math.random() * 4;
    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;
    petal.style.left = `${x}px`;
    petal.style.top = `${y}px`;

    // Rotação inicial aleatória
    const startRot = Math.random() * 360;
    petal.style.transform = `translate(-50%, -50%) rotate(${startRot}deg)`;

    document.body.appendChild(petal);

    // Deriva lateral leve (vento) + queda natural
    const driftX = (Math.random() - 0.5) * 30;
    const fallY = 20 + Math.random() * 18;
    const endRot = startRot + (Math.random() - 0.5) * 180;
    const duration = 0.9 + Math.random() * 0.5;

    gsap.to(petal, {
      x: driftX,
      y: fallY,
      opacity: 0,
      scale: 0.2 + Math.random() * 0.3,
      rotate: endRot,
      duration,
      ease: "power1.out",
      onComplete: () => petal.remove(),
    });
  }
}
