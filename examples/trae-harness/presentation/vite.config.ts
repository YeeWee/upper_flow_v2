import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    fs: { allow: [".."] },
  },
  build: {
    rollupOptions: {
      input: {
        // 演示主入口
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        // 视觉原子画廊：/atoms.html（dev 与 build 都要有）
        atoms: fileURLToPath(new URL("./atoms.html", import.meta.url)),
      },
    },
  },
});
