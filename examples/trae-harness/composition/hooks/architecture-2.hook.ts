export default function (tl, root, ctx) {
  tl.from(Array.from(root.querySelectorAll(".atom-stat")), { opacity: 0, y: 30, duration: 0.55, stagger: 0.18 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-rule"), { scaleX: 0, transformOrigin: "left center", duration: 0.5 }, ctx.start + 0.4);
}
