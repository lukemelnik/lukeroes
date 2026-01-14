import { createFileRoute, Outlet } from "@tanstack/react-router";
import Footer from "@/components/footer";
import Header from "@/components/header";

export const Route = createFileRoute("/(nav)")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex min-h-dvh flex-col">
			<Header />
			<main className="flex-1">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
