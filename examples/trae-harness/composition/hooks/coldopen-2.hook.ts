export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"), { opacity: 0, y: 30, duration: 0.6, ease: "power4.out" }, ctx.start + 0.05);
  tl.from(Array.from(root.querySelectorAll(".atom-card")), { opacity: 0, y: 34, duration: 0.55, stagger: 0.16, ease: "power3.out" }, ctx.start + 0.25);
}
