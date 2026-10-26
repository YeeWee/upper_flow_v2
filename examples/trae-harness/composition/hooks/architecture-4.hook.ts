export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, scale: 0.92, duration: 0.6 }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-badge")), { opacity: 0, scale: 0.7, duration: 0.45, stagger: 0.15 }, ctx.start + 0.4);
}
