export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const rows = root.querySelectorAll(".co9__row");
  tl.from(root.querySelector(".co9__head"), { opacity: 0, y: 18, duration: 0.55 }, ctx.start + 0.08);
  tl.from(rows, { opacity: 0, y: 18, duration: 0.45, stagger: 0.18, ease: "power2.out" }, ctx.start + 0.35);
  tl.fromTo(root.querySelector(".co9__row.lit"), { x: -6 }, { x: 0, duration: 0.35, ease: "power2.out" }, ctx.start + 0.95);
  tl.from(root.querySelector(".co9__note"), { opacity: 0, duration: 0.6 }, ctx.start + 1.6);
  tl.to(rows[1], { opacity: 0.45, duration: 0.7 }, ctx.start + 3.6);
  tl.to(rows[2], { opacity: 0.45, duration: 0.7 }, ctx.start + 3.6);
}
