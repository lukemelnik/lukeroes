import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		contentCollections(),
		tsconfigPaths(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		nitroV2Plugin({ preset: "node-server", compatibilityDate: "2025-11-05" }),
	],
});
