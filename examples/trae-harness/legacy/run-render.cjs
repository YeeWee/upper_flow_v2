process.env.PATH = [
  "C:\\Program Files\\nodejs",
  "d:\\\\动画",
  process.env.PATH
].join(";");

process.argv = [
  process.argv[0],
  "d:\\\\动画\\\\hyperframes\\\\hyperframes-main\\\\packages\\\\cli\\\\dist\\\\cli.js",
  "render",
  "d:\\\\动画\\\\trae-harness-video\\\\hyperframes-project",
  "-o", "d:\\\\动画\\\\trae-harness-video\\\\output-v2.mp4",
  "--fps", "30"
];

require("d:\\\\动画\\\\hyperframes\\\\hyperframes-main\\\\packages\\\\cli\\\\dist\\\\cli.js");
