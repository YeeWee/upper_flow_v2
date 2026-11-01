export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  tl.from(root.querySelector(".co8__num"), { opacity: 0, x: -30, duration: 0.7, ease: "power3.out" }, ctx.start + 0.1);
  tl.from(root.querySelector(".co8__sub"), { opacity: 0, duration: 0.5 }, ctx.start + 0.5);
  tl.from(root.querySelector(".co8__card"), { opacity: 0, y: 28, duration: 0.7, ease: "power3.out" }, ctx.start + 0.45);
  tl.from(root.querySelector(".co8__quote"), { opacity: 0, y: 18, duration: 0.6 }, ctx.start + 0.9);
  tl.from(root.querySelector(".co8__cite"), { opacity: 0, duration: 0.6 }, ctx.start + 1.5);
  tl.to(root.querySelector(".co8__card"), { opacity: 0.9, duration: 0.6 }, ctx.start + 3.9);
}
