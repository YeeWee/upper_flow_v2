export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const lines = root.querySelectorAll(".co6__line");
  const num = root.querySelector(".co6__num");
  const fill = root.querySelector(".co6__fill");
  tl.from(lines, { opacity: 0, y: 10, duration: 0.32, stagger: 0.09, ease: "none" }, ctx.start + 0.1);
  tl.from(num, { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" }, ctx.start + 0.5);
  tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: Math.max(1.5, ctx.duration - 1.4), ease: "none" }, ctx.start + 1.1);
  const tail = Math.max(3.0, ctx.duration - 0.8);
  tl.to(root.querySelector(".co6__note"), { opacity: 0.6, duration: 0.6 }, ctx.start + tail);
}
