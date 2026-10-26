export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 28, duration: 0.55 }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-list__item")), { opacity: 0, x: -22, duration: 0.45, stagger: 0.14 }, ctx.start + 0.3);
  tl.from(Array.from(root.querySelectorAll(".atom-badge")), { opacity: 0, y: 12, duration: 0.4, stagger: 0.1 }, ctx.start + 0.75);
}
