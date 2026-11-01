export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const q = root.querySelector(".co4__q");
  const btn = root.querySelector(".co4__btn");
  const hint = root.querySelector(".co4__hint");
  tl.from(q, { opacity: 0, y: 34, duration: 0.8, ease: "power3.out" }, ctx.start + 0.12);
  tl.from(btn, { opacity: 0, y: 24, duration: 0.6, ease: "power2.out" }, ctx.start + 0.7);
  tl.from(root.querySelector(".co4__cursor"), { opacity: 0, scale: 0.6, duration: 0.4, ease: "back.out(2)" }, ctx.start + 1.0);
  tl.from(hint, { opacity: 0, duration: 0.6 }, ctx.start + 1.35);
  tl.to(q, { opacity: 0.86, duration: 0.6 }, ctx.start + 3.6);
}
