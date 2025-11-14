import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import contentCollections from "@content-collections/vite";

export default defineConfig({
	plugins: [
		contentCollections(),
		tsconfigPaths(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});
