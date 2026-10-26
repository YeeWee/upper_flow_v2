console.log("PATH:", process.env.PATH);
const { execFileSync } = require("child_process");
try {
  const result = execFileSync("ffmpeg", ["-version"], { stdio: "pipe", timeout: 5000 });
  console.log("FFmpeg FOUND:", result.toString().substring(0, 100));
} catch (e) {
  console.log("FFmpeg NOT FOUND:", e.message?.substring(0, 100));
}
