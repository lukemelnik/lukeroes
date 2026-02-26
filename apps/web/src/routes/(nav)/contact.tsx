import { createFileRoute } from "@tanstack/react-router";
import { ContactForm } from "@/components/contact-form";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/contact")({
	component: ContactPageComponent,
	head: () => ({
		...seoHead({
			title: "Contact",
			description:
				"Get in touch with Luke Roes. Send a message for bookings, collaborations, or general inquiries.",
			path: "/contact",
		}),
	}),
});

function ContactPageComponent() {
	return (
		<div className="min-h-screen w-full">
			<section className="px-4 py-16 md:px-6">
				<div className="container mx-auto max-w-xl">
					<h1 className="mb-4 text-center font-bold text-4xl md:text-5xl">
						Get in Touch
					</h1>
					<p className="mb-8 text-center text-muted-foreground">
						Have a question or just want to say hi? Send me a message and I'll
						get back to you within 24 hours.
					</p>
					<ContactForm showProjectField={false} />
				</div>
			</section>
		</div>
	);
}
