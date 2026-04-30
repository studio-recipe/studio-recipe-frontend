import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 1. [핵심] /studio-recipe 로 시작하는 요청 처리
      "/studio-recipe": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },

      // 2. 파이썬(Flask) 추천 서버 연결
      "/api/recommend": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/stats": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/health": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/reset-history": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },

      // 3. 나머지 API 처리
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});