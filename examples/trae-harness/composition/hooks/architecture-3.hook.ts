export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 26, duration: 0.55 }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-card")), { opacity: 0, y: 32, duration: 0.5, stagger: 0.2 }, ctx.start + 0.3);
}
