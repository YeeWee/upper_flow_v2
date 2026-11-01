export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const stamp = root.querySelector(".co7__stamp");
  tl.from(root.querySelectorAll(".co7__line"), { opacity: 0, duration: 0.5, stagger: 0.06 }, ctx.start + 0.05);
  tl.from(stamp, { opacity: 0, scale: 1.5, rotate: 6, duration: 0.5, ease: "power4.out" }, ctx.start + 0.55);
  tl.to(stamp, { scale: 1, duration: 0.25, ease: "power1.out" }, ctx.start + 1.05);
  tl.to(root.querySelector(".co7__code"), { opacity: 0.4, duration: 0.8 }, ctx.start + 3.4);
}
