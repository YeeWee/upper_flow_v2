export default function (tl, root, ctx) {
  tl.from(Array.from(root.querySelectorAll(".atom-list__item")), { opacity: 0, x: -30, duration: 0.45, stagger: 0.16 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-rule"), { scaleX: 0, transformOrigin: "left center", duration: 0.5 }, ctx.start + 0.75);
  tl.from(root.querySelector(".atom-footer"), { opacity: 0, duration: 0.4 }, ctx.start + 0.95);
}
