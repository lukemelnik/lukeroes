import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import appCss from "../index.css?url";

export interface RouterAppContext {
	queryClient: QueryClient;
}

function NotFound() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
			<h1 className="mb-2 font-bold text-6xl">404</h1>
			<p className="mb-6 text-muted-foreground text-lg">
				This page doesn't exist.
			</p>
			<Link to="/">
				<Button variant="outline">Back to home</Button>
			</Link>
		</div>
	);
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	notFoundComponent: NotFound,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Luke Roes — Artist, Producer, Mixer" },
			{
				name: "description",
				content:
					"Official website of Luke Roes — music, videos, tour dates, production services, and writing.",
			},
			{
				property: "og:title",
				content: "Luke Roes — Artist, Producer, Mixer",
			},
			{
				property: "og:description",
				content:
					"Official website of Luke Roes — music, videos, tour dates, production services, and writing.",
			},
			{ property: "og:image", content: "https://lukeroes.com/og-image.jpg" },
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: "Luke Roes" },
			{ name: "twitter:card", content: "summary_large_image" },
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/x-icon",
				href: "/favicon.ico",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				href: "/android-chrome-192x192.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "512x512",
				href: "/android-chrome-512x512.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
		],
	}),

	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Toaster richColors />
				<ReactQueryDevtools buttonPosition="bottom-right" />
				<TanStackRouterDevtools position="bottom-left" />
				<Scripts />
			</body>
		</html>
	);
}
