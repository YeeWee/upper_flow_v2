export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {
  tl.from(root.querySelector(".scaf__kick"), { opacity: 0, duration: 0.4 }, ctx.start + 0.05);
  tl.from(root.querySelector(".scaf__title"), { opacity: 0, y: 22, duration: 0.6, ease: "power3.out" }, ctx.start + 0.1);
  tl.from(root.querySelector(".scaf__rule"), { scaleX: 0, transformOrigin: "left center", duration: 0.5 }, ctx.start + 0.5);
  tl.from(root.querySelector(".scaf__note"), { opacity: 0, duration: 0.45 }, ctx.start + 0.8);
}
