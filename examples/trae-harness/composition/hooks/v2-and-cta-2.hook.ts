export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 30, duration: 0.6 }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-list__item")), { opacity: 0, y: 20, duration: 0.45, stagger: 0.16 }, ctx.start + 0.35);
  tl.from(root.querySelector(".atom-badge"), { opacity: 0, scale: 0.8, duration: 0.4 }, ctx.start + 0.8);
}
