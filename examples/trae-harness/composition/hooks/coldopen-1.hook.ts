export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-kicker"), { opacity: 0, y: -12, duration: 0.4 }, ctx.start + 0.05);
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 44, duration: 0.75, ease: "power4.out" }, ctx.start + 0.12);
  tl.from(root.querySelector(".atom-rule"), { scaleX: 0, transformOrigin: "left center", duration: 0.55, ease: "power3.inOut" }, ctx.start + 0.5);
  tl.from(root.querySelector(".atom-footer"), { opacity: 0, duration: 0.4 }, ctx.start + 0.7);
}
