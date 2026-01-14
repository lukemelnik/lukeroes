import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "https://api.songkeeper.io/api/openapi.json",
	output: {
		path: "src/generated/songkeeper",
	},
	plugins: [
		"@hey-api/typescript",
		"@hey-api/sdk",
		{
			name: "@tanstack/react-query",
			queryOptions: true,
			mutationOptions: false,
		},
	],
});
