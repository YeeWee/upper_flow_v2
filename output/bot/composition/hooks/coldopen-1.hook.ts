export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const time = root.querySelector(".co1__time");
  const label = root.querySelector(".co1__label");
  const card = root.querySelector(".co1__card");
  const tag = root.querySelector(".co1__tag");
  tl.from(time, { opacity: 0, y: 26, duration: 0.9, ease: "power3.out" }, ctx.start + 0.15);
  tl.from(label, { opacity: 0, x: -18, duration: 0.6, ease: "power2.out" }, ctx.start + 0.75);
  tl.from(card, { opacity: 0, x: 46, duration: 0.8, ease: "power3.out" }, ctx.start + 1.1);
  tl.from(tag, { opacity: 0, scale: 0.86, duration: 0.45, ease: "back.out(2)" }, ctx.start + 1.85);
  tl.to(time, { opacity: 0.32, duration: 0.9, ease: "power2.out" }, ctx.start + 4.4);
}
