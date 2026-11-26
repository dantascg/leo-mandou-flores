export function initReveals() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, current) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.setProperty("--reveal-delay", `${Number(el.dataset.delay) || 0}s`);
      el.classList.add("is-visible");
      current.unobserve(el);
    });
  }, { rootMargin: "0px 0px -12%" });
  items.forEach((el) => observer.observe(el));
}
