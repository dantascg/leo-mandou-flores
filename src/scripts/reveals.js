import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initReveals() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const items = gsap.utils.toArray(".reveal");
  items.forEach((el, i) => {
    if (reduceMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      delay: (Number(el.dataset.delay) || 0),
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });

  // Linha vertical do hero que cresce ao rolar
  const heroLine = document.querySelector("[data-hero-line]");
  if (heroLine && !reduceMotion) {
    gsap.fromTo(
      heroLine,
      { scaleY: 0 },
      {
        scaleY: 1,
        transformOrigin: "top",
        ease: "none",
        scrollTrigger: {
          trigger: heroLine,
          start: "top 90%",
          end: "bottom 40%",
          scrub: true,
        },
      }
    );
  }

  // Track rows: waveform "dança" sutil ao entrar
  gsap.utils.toArray(".track-row").forEach((row) => {
    const bars = row.querySelectorAll(".wave-bar");
    if (!bars.length || reduceMotion) return;
    gsap.from(bars, {
      scaleY: 0.2,
      transformOrigin: "bottom",
      duration: 0.5,
      stagger: 0.02,
      ease: "power2.out",
      scrollTrigger: {
        trigger: row,
        start: "top 90%",
      },
    });
  });
}
