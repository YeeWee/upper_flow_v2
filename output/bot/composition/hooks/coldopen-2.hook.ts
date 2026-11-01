export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const head = root.querySelector(".co2__head");
  const rows = root.querySelectorAll(".co2__row");
  const pr = root.querySelector(".co2__pr");
  tl.from(head, { opacity: 0, y: 18, duration: 0.5, ease: "power2.out" }, ctx.start + 0.1);
  tl.from(rows, { opacity: 0, x: -22, duration: 0.5, stagger: 0.16, ease: "power2.out" }, ctx.start + 0.35);
  tl.from(pr, { opacity: 0, scale: 0.9, duration: 0.45, ease: "back.out(2)" }, ctx.start + 0.95);
  tl.from(root.querySelector(".co2__note"), { opacity: 0, duration: 0.6 }, ctx.start + 1.35);
  tl.to(root.querySelectorAll(".co2__row"), { opacity: 0.55, duration: 0.7 }, ctx.start + 3.7);
  tl.to(pr, { opacity: 1, duration: 0.5 }, ctx.start + 3.7);
}
