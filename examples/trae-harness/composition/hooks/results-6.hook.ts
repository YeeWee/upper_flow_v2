export default function (tl, root, ctx) {
  tl.from(Array.from(root.querySelectorAll(".atom-stat")), { opacity: 0, y: 30, duration: 0.55, stagger: 0.2 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-badge"), { opacity: 0, y: 12, duration: 0.4 }, ctx.start + 0.55);
}
