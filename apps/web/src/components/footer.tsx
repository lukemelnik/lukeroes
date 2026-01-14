import { Link } from "@tanstack/react-router";
import { siteConfig } from "@/lib/site-config";

export default function Footer() {
	const currentYear = new Date().getFullYear();

	const links = [
		{ to: "/", label: "Home" },
		{ to: "/music", label: "Music" },
		{ to: "/videos", label: "Videos" },
		{ to: "/tour", label: "Tour" },
		{ to: "/work-with-me", label: "Production" },
	];

	return (
		<footer className="w-full border-t bg-background">
			<div className="container mx-auto px-4 py-12 md:px-6">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{/* Brand */}
					<div className="space-y-4">
						<Link to="/" className="font-bold text-2xl tracking-tight">
							LUKE ROES
						</Link>
						<p className="max-w-xs text-muted-foreground text-sm">
							Artist, Producer, Mixer
						</p>
					</div>

					{/* Quick Links */}
					<div className="space-y-2">
						<h3 className="font-semibold">Quick Links</h3>
						<nav className="flex gap-4">
							{links.map(({ to, label }) => (
								<Link
									key={to}
									to={to}
									className="text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									{label}
								</Link>
							))}
						</nav>
					</div>

					{/* Social */}
					<div className="space-y-2">
						<h3 className="font-semibold">Follow</h3>
						<div className="flex gap-4">
							{siteConfig.socials
								.filter((social) => social.href)
								.map(({ key, href, icon: Icon, label }) => (
									<a
										key={key}
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										className="text-muted-foreground transition-colors hover:text-foreground"
										aria-label={label}
									>
										<Icon size={20} />
									</a>
								))}
						</div>
					</div>
				</div>

				<div className="mt-12 border-t pt-8 text-center text-muted-foreground text-sm">
					<p>&copy; {currentYear} Luke Roes. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}
