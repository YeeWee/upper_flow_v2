export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 30, duration: 0.65 }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-badge")), { opacity: 0, y: 16, duration: 0.45, stagger: 0.12 }, ctx.start + 0.4);
}
