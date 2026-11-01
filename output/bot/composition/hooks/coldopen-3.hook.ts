export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const sides = root.querySelectorAll(".co3__side");
  const steps = root.querySelectorAll(".co3__step");
  const neq = root.querySelector(".co3__neq");
  tl.from(sides[0], { opacity: 0, x: -50, duration: 0.7, ease: "power3.out" }, ctx.start + 0.12);
  tl.from(sides[1], { opacity: 0, x: 50, duration: 0.7, ease: "power3.out" }, ctx.start + 0.3);
  tl.from(root.querySelectorAll(".co3__vline"), { scaleY: 0, transformOrigin: "top center", duration: 0.5, ease: "power2.inOut" }, ctx.start + 0.7);
  tl.from(neq, { opacity: 0, scale: 0.7, duration: 0.5, ease: "back.out(2)" }, ctx.start + 0.95);
  tl.from(steps, { opacity: 0, y: 16, duration: 0.45, stagger: 0.12, ease: "power2.out" }, ctx.start + 1.2);
  const tail = Math.max(2.2, ctx.duration - 0.8);
  tl.to(root.querySelector(".co3__chat"), { opacity: 0.45, duration: 0.6 }, ctx.start + tail);
}
