const MAX_PETALS = 12;
const SPAWN_DIST = 60;

export function initPetalCursor() {
  if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;

  const petals = Array.from({ length: MAX_PETALS }, () => {
    const element = document.createElement("div");
    element.className = "petal-trail";
    element.hidden = true;
    document.body.appendChild(element);
    return element;
  });

  let lastX = null;
  let lastY = null;
  let distance = 0;
  let nextPetal = 0;

  window.addEventListener("mousemove", (event) => {
    if (lastX === null || lastY === null) {
      lastX = event.clientX;
      lastY = event.clientY;
      return;
    }

    distance += Math.hypot(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
    if (distance < SPAWN_DIST) return;
    distance %= SPAWN_DIST;

    const petal = petals[nextPetal];
    nextPetal = (nextPetal + 1) % MAX_PETALS;
    petal.hidden = false;
    petal.style.setProperty("--drift", `${(Math.random() - 0.5) * 30}px`);
    petal.style.left = `${event.clientX}px`;
    petal.style.top = `${event.clientY}px`;
    petal.style.animation = "none";
    void petal.offsetWidth;
    petal.style.animation = "petal-fall 0.7s ease-out forwards";
    window.setTimeout(() => { petal.hidden = true; }, 700);
  });
}
