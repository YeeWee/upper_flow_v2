export default function (tl, root, ctx) {
  tl.from(Array.from(root.querySelectorAll(".atom-stat")), { opacity: 0, y: 34, duration: 0.55, stagger: 0.2 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-stat.lit .atom-stat__value"), { scale: 0.4, duration: 0.6, ease: "back.out(1.6)" }, ctx.start + 0.45);
  tl.from(root.querySelector(".atom-badge"), { opacity: 0, y: 14, duration: 0.4 }, ctx.start + 0.75);
}
