export default function (tl, root, ctx) {
  tl.from(Array.from(root.querySelectorAll(".atom-stat")), { opacity: 0, x: -24, duration: 0.5, stagger: 0.18 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-stat.lit .atom-stat__value"), { scale: 0.5, duration: 0.55, ease: "power4.out" }, ctx.start + 0.42);
  tl.from(root.querySelector(".atom-badge"), { opacity: 0, duration: 0.4 }, ctx.start + 0.7);
}
