export default function (tl, root, ctx) {
  tl.from(Array.from(root.querySelectorAll(".atom-stat")), { opacity: 0, y: 26, duration: 0.5, stagger: 0.14 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-stat.lit .atom-stat__value"), { scale: 0.7, duration: 0.4 }, ctx.start + 0.4);
}
