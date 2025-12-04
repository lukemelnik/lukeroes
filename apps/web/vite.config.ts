import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import contentCollections from "@content-collections/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";

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
