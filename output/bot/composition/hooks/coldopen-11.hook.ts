export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const items = root.querySelectorAll(".co11__item");
  tl.from(root.querySelector(".co11__mark"), { opacity: 0, x: -24, duration: 0.6 }, ctx.start + 0.1);
  tl.from(items, { opacity: 0, x: 22, duration: 0.45, stagger: 0.15, ease: "power2.out" }, ctx.start + 0.4);
  tl.to(items, { opacity: 0.82, duration: 0.6 }, ctx.start + 4.4);
}
