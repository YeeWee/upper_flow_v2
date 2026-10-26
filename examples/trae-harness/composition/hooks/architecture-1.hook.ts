export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 32, duration: 0.6 }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-list__item")), { opacity: 0, x: -28, duration: 0.5, stagger: 0.18 }, ctx.start + 0.35);
}
