export default function (tl, root, ctx) {
  tl.from(Array.from(root.querySelectorAll(".atom-stat")), { opacity: 0, x: -20, duration: 0.5, stagger: 0.16 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-stat.lit:last-child .atom-stat__value"), { scale: 0.5, duration: 0.5, ease: "power4.out" }, ctx.start + 0.55);
}
