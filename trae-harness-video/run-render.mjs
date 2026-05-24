process.env.PATH = [
  "C:\\Program Files\\nodejs",
  "d:\\\\动画",
  process.env.PATH
].join(";");

const { execFileSync } = await import("child_process");
const originalExec = execFileSync;

// Monkey-patch to log all execFileSync calls
const patchedExec = function(...args) {
  if (args[0] === "ffmpeg") {
    console.log("[PATCH] execFileSync called for ffmpeg! Will try to run...");
    try {
      const result = originalExec.apply(this, args);
      console.log("[PATCH] ffmpeg execFileSync SUCCEEDED");
      return result;
    } catch (e) {
      console.log("[PATCH] ffmpeg execFileSync FAILED:", e.message?.substring(0, 200));
      throw e;
    }
  }
  return originalExec.apply(this, args);
};

// Replace in child_process module
const childProcess = await import("child_process");
childProcess.execFileSync = patchedExec;

process.argv = [
  process.argv[0],
  "d:\\\\动画\\\\hyperframes\\\\hyperframes-main\\\\packages\\\\cli\\\\dist\\\\cli.js",
  "render",
  "d:\\\\动画\\\\trae-harness-video\\\\hyperframes-project",
  "-o", "d:\\\\动画\\\\trae-harness-video\\\\output-v2.mp4",
  "--fps", "30"
];

await import("file:///d:/动画/hyperframes/hyperframes-main/packages/cli/dist/cli.js");
