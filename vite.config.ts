import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import pkg from "./package.json" with { type: "json" }

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
	server: {
		host: "localhost",
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
		},
	},
})
