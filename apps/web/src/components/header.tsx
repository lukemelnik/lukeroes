import { Link, linkOptions } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
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
    { to: "/contact", label: "Contact" },
  ]);

  const socialLinks = siteConfig.socials.filter(
    ({ href, icon }) => href && icon,
  );

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${isScrolled ? "bg-background" : "bg-transparent"}`}
    >
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4">
        {/* Left - Navigation Links */}
        <nav className="flex gap-2 text-lg font-heading font-medium ">
          {links.map(({ to, label }, index) => (
            <>
              <Link
                key={to}
                to={to}
                className="text-xl transition-colors mt-2 uppercase hover:text-foreground/80 inline-block"
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
                <span className="text-primary mt-2 text-xl">•</span>
              )}
            </>
          ))}
        </nav>

        {/* Center - Artist Name */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="text-4xl font-bold tracking-tight">
            <h1 className="mb-0 mt-3 p-0">{siteConfig.name.toUpperCase()}</h1>
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
      <div className="flex md:hidden items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="relative inline-flex items-center justify-center size-8">
            {/* Menu icon (closed state) */}
            <Menu
              className={`absolute size-8 transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                mobileMenuOpen
                  ? "opacity-0 -rotate-90 scale-75"
                  : "opacity-100 rotate-0 scale-100"
              }`}
            />
            {/* Close icon (open state) */}
            <X
              className={`absolute size-8 transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                mobileMenuOpen
                  ? "opacity-100 rotate-0 scale-100"
                  : "opacity-0 rotate-90 scale-75"
              }`}
            />
          </span>
        </Button>
        <Link to="/" className="text-3xl font-mono font-bold tracking-tight">
          <h1
            className={`mt-2.5 transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
              mobileMenuOpen
                ? "opacity-0 -translate-y-1 pointer-events-none"
                : "opacity-100 translate-y-0"
            }`}
          >
            {siteConfig.name.toUpperCase()}
          </h1>
        </Link>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t text-center bg-background min-h-[calc(100vh-60px)] flex flex-col items-center pt-10">
          <nav className="flex flex-col items-center px-4 py-2">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="py-3 text-2xl font-heading font-medium transition-colors hover:text-foreground/80 inline-block"
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
          <div className="px-4 py-4">
            <div className="flex items-center justify-center">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <Button key={label} variant="ghost" asChild>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon className="size-6" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
