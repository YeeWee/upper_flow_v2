export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 24, duration: 0.55 }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-list__item")), { opacity: 0, x: -24, duration: 0.45, stagger: 0.12 }, ctx.start + 0.3);
}
