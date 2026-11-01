export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const path = root.querySelector(".co10__line");
  const len = 900;
  tl.set(path, { strokeDasharray: len, strokeDashoffset: len }, ctx.start);
  tl.from(root.querySelector(".co10__card.dim"), { opacity: 0, x: -26, duration: 0.55 }, ctx.start + 0.1);
  tl.to(path, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, ctx.start + 0.6);
  tl.from(root.querySelector(".co10__card.lit"), { opacity: 0, x: 26, duration: 0.55 }, ctx.start + 1.5);
  tl.from(root.querySelector(".co10__arrow"), { opacity: 0, duration: 0.4 }, ctx.start + 1.6);
  tl.from(root.querySelector(".co10__hint"), { opacity: 0, duration: 0.6 }, ctx.start + 2.0);
  const tail = Math.max(2.4, ctx.duration - 0.8);
  tl.to(root.querySelector(".co10__card.dim"), { opacity: 0.5, duration: 0.6 }, ctx.start + tail);
}
