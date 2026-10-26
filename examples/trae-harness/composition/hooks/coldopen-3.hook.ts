export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, scale: 0.86, duration: 0.7, ease: "power4.out" }, ctx.start + 0.08);
  tl.from(Array.from(root.querySelectorAll(".atom-badge")), { opacity: 0, y: 18, duration: 0.45, stagger: 0.12 }, ctx.start + 0.4);
}
