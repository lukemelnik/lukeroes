import { Link, linkOptions } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "./ui/button";

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const links = linkOptions([
		{ to: "/music", label: "Music" },
		{ to: "/videos", label: "Videos" },
		{ to: "/tour", label: "Tour" },
		{ to: "/work-with-me", label: "Work With Me" },
		{ to: "/writing", label: "Writing" },
	]);

	const socialLinks = siteConfig.socials.filter(({ href }) => !!href);

	return (
		<header
			className={`sticky top-0 z-50 w-full transition-colors duration-300 ${isScrolled ? "bg-background" : "bg-transparent"}`}
		>
			{/* Desktop Header */}
			<div className="hidden items-center justify-between px-6 py-4 md:flex">
				{/* Left - Navigation Links */}
				<nav className="flex gap-2 font-heading font-medium text-lg">
					{links.map(({ to, label }, index) => (
						<>
							<Link
								key={to}
								to={to}
								className="mt-2 inline-block text-xl uppercase transition-colors hover:text-foreground/80"
								activeProps={{
									className: "text-foreground",
								}}
							>
								{({ isActive }) => (
									<span
										className="squiggly-underline"
										data-status={isActive ? "active" : undefined}
									>
										{label}
									</span>
								)}
							</Link>
							{index < links.length - 1 && (
								<span className="mt-2 text-primary text-xl">•</span>
							)}
						</>
					))}
				</nav>

				{/* Center - Artist Name */}
				<div className="-translate-x-1/2 absolute left-1/2">
					<Link to="/" className="font-bold text-4xl tracking-tight">
						<h1 className="mt-3 mb-0 p-0">{siteConfig.name.toUpperCase()}</h1>
					</Link>
				</div>

				{/* Right - Social Icons */}
				<div className="flex items-center">
					{socialLinks.map(({ href, icon: Icon, label }) => (
						<Button
							key={label}
							variant="link"
							asChild
							className="text-foreground hover:text-primary"
						>
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={label}
								className="text-foreground"
							>
								<Icon className="size-5" />
							</a>
						</Button>
					))}
				</div>
			</div>

			{/* Mobile Header */}
			<div className="flex items-center justify-between px-4 py-3 md:hidden">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					aria-label="Toggle menu"
					aria-expanded={mobileMenuOpen}
				>
					<span className="relative inline-flex size-8 items-center justify-center">
						{/* Menu icon (closed state) */}
						<Menu
							className={`absolute size-8 transition-all duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none ${
								mobileMenuOpen
									? "-rotate-90 scale-75 opacity-0"
									: "rotate-0 scale-100 opacity-100"
							}`}
						/>
						{/* Close icon (open state) */}
						<X
							className={`absolute size-8 transition-all duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none ${
								mobileMenuOpen
									? "rotate-0 scale-100 opacity-100"
									: "rotate-90 scale-75 opacity-0"
							}`}
						/>
					</span>
				</Button>
				<Link to="/" className="font-bold font-mono text-3xl tracking-tight">
					<h1
						className={`mt-2.5 transition-all duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none ${
							mobileMenuOpen
								? "-translate-y-1 pointer-events-none opacity-0"
								: "translate-y-0 opacity-100"
						}`}
					>
						{siteConfig.name.toUpperCase()}
					</h1>
				</Link>
				<div className="w-10" /> {/* Spacer for centering */}
			</div>

			{/* Mobile Dropdown Menu */}
			{mobileMenuOpen && (
				<div className="flex min-h-[calc(100vh-60px)] flex-col items-center border-t bg-background pt-10 text-center md:hidden">
					<nav className="flex flex-col items-center px-4 py-2">
						{links.map(({ to, label }) => (
							<Link
								key={to}
								to={to}
								className="inline-block py-3 font-heading font-medium text-2xl transition-colors hover:text-foreground/80"
								activeProps={{
									className: "text-foreground",
								}}
								onClick={() => setMobileMenuOpen(false)}
							>
								{({ isActive }) => (
									<span
										className="squiggly-underline"
										data-status={isActive ? "active" : undefined}
									>
										{label}
									</span>
								)}
							</Link>
						))}
					</nav>
				</div>
			)}
		</header>
	);
}
