export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  tl.from(root.querySelector(".co5__row"), { opacity: 0, y: 24, duration: 0.6, ease: "power2.out" }, ctx.start + 0.1);
  tl.from(root.querySelector(".co5__input"), { opacity: 0, y: 26, duration: 0.6, ease: "power3.out" }, ctx.start + 0.55);
  tl.from(root.querySelector(".co5__text"), { opacity: 0, duration: 0.5 }, ctx.start + 0.95);
  tl.from(root.querySelector(".co5__send"), { opacity: 0, x: -12, duration: 0.45 }, ctx.start + 1.25);
  tl.to(root.querySelector(".co5__send"), { opacity: 0.5, duration: 0.5 }, ctx.start + 2.6);
}
