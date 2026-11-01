export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const halves = root.querySelectorAll(".co12__half");
  const seam = root.querySelector(".co12__seam");
  tl.from(halves[0], { opacity: 0, x: -70, duration: 0.75, ease: "power3.out" }, ctx.start + 0.1);
  tl.from(halves[1], { opacity: 0, x: 70, duration: 0.75, ease: "power3.out" }, ctx.start + 0.1);
  tl.from(seam, { opacity: 0, scaleY: 0.4, duration: 0.5, ease: "power2.out" }, ctx.start + 0.6);
  tl.from(root.querySelector(".co12__seam span"), { opacity: 0, scale: 0.8, duration: 0.4, ease: "back.out(2)" }, ctx.start + 0.85);
  tl.from(root.querySelector(".co12__foot"), { opacity: 0, duration: 0.5 }, ctx.start + 1.2);
  tl.to(seam, { opacity: 0.7, duration: 0.6 }, ctx.start + 4.2);
}
