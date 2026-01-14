import { Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MailingListSection() {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		// TODO: Implement mailing list subscription
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setEmail("");
		setIsSubmitting(false);
	};

	return (
		<section className="w-full bg-muted/30 px-4 py-16 md:px-6">
			<div className="container mx-auto max-w-2xl">
				<div className="space-y-6 text-center">
					<div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Mail className="h-8 w-8 text-primary" />
					</div>

					<div className="space-y-2">
						<h2 className="font-bold text-3xl tracking-tight">Stay In Touch</h2>
						<p className="mx-auto max-w-md text-muted-foreground">
							Join the mailing list to stay up to date with new releases, tour
							announcements, and exclusive content.
						</p>
					</div>

					<form
						onSubmit={handleSubmit}
						className="mx-auto flex max-w-md flex-col gap-3 pt-4 sm:flex-row"
					>
						<Input
							type="email"
							placeholder="Enter your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="flex-1"
						/>
						<Button type="submit" disabled={isSubmitting} className="sm:w-auto">
							{isSubmitting ? "Subscribing..." : "Subscribe"}
						</Button>
					</form>

					<p className="text-muted-foreground text-xs">
						We respect your privacy. Unsubscribe at any time.
					</p>
				</div>
			</div>
		</section>
	);
}
