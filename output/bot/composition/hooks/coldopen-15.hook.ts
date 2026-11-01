export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  const avatars = root.querySelectorAll(".co15__a");
  const rows = root.querySelectorAll(".co15__r");
  tl.from(avatars, { opacity: 0, y: 22, duration: 0.5, stagger: 0.13, ease: "power2.out" }, ctx.start + 0.1);
  tl.from(root.querySelector(".co15__sheet"), { opacity: 0, x: 34, duration: 0.65, ease: "power3.out" }, ctx.start + 0.5);
  tl.from(rows, { opacity: 0, x: 14, duration: 0.4, stagger: 0.16 }, ctx.start + 0.95);
  tl.from(root.querySelector(".co15__note"), { opacity: 0, duration: 0.5 }, ctx.start + 1.7);
  tl.to(root.querySelector(".co15__sheet"), { opacity: 0.94, duration: 0.6 }, ctx.start + 4.2);
}
