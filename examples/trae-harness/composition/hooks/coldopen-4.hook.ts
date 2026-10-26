export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-quote"), { opacity: 0, x: -36, duration: 0.65, ease: "power3.out" }, ctx.start + 0.08);
  tl.from(Array.from(root.querySelectorAll(".atom-badge")), { opacity: 0, scale: 0.8, duration: 0.4, stagger: 0.1 }, ctx.start + 0.45);
}
