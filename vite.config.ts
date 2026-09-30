import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // '::' escucha en IPv4 y en IPv6, así funcionan 127.0.0.1 y localhost.
    host: "::",
    port: 5173,
  },
});
