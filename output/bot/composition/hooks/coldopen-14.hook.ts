export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const nodes = root.querySelectorAll(".co14__node");
  const arrows = root.querySelectorAll(".co14__arrow");
  tl.from(root.querySelector(".co14__frame"), { opacity: 0, duration: 0.5 }, ctx.start + 0.05);
  tl.from(nodes, { opacity: 0, y: 16, duration: 0.4, stagger: 0.16, ease: "power2.out" }, ctx.start + 0.25);
  tl.from(arrows, { opacity: 0, scaleX: 0.3, transformOrigin: "left center", duration: 0.3, stagger: 0.16 }, ctx.start + 0.45);
  tl.from(root.querySelector(".co14__stamp"), { opacity: 0, scale: 1.6, rotate: 4, duration: 0.45, ease: "power4.out" }, ctx.start + 0.9);
  tl.to(root.querySelector(".co14__stamp"), { scale: 1, duration: 0.2 }, ctx.start + 1.35);
  tl.from(root.querySelector(".co14__foot"), { opacity: 0, duration: 0.5 }, ctx.start + 1.5);
}
