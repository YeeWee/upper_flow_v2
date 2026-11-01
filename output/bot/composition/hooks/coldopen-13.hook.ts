export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const lines = root.querySelectorAll(".co13__line");
  const strikes = root.querySelectorAll(".co13__line.no .co13__txt");
  tl.from(lines[0], { opacity: 0, x: -20, duration: 0.45 }, ctx.start + 0.1);
  tl.from(lines[1], { opacity: 0, x: -20, duration: 0.45 }, ctx.start + 0.45);
  tl.from(lines[2], { opacity: 0, y: 22, duration: 0.6, ease: "power3.out" }, ctx.start + 0.85);
  tl.from(root.querySelector(".co13__note"), { opacity: 0, duration: 0.6 }, ctx.start + 1.5);
  tl.fromTo(strikes, { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.18 }, ctx.start + 2.4);
  const tail = Math.max(2.6, ctx.duration - 0.8);
  tl.to(root.querySelector(".co13__line.yes .co13__txt"), { opacity: 0.92, duration: 0.6 }, ctx.start + tail);
}
