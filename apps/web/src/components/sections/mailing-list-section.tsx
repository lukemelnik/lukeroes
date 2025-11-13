import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useState } from "react";

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
		<section className="w-full py-16 px-4 md:px-6 bg-muted/30">
			<div className="container mx-auto max-w-2xl">
				<div className="text-center space-y-6">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
						<Mail className="w-8 h-8 text-primary" />
					</div>

					<div className="space-y-2">
						<h2 className="text-3xl font-bold tracking-tight">
							Stay In Touch
						</h2>
						<p className="text-muted-foreground max-w-md mx-auto">
							Join the mailing list to stay up to date with new releases, tour
							announcements, and exclusive content.
						</p>
					</div>

					<form
						onSubmit={handleSubmit}
						className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4"
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

					<p className="text-xs text-muted-foreground">
						We respect your privacy. Unsubscribe at any time.
					</p>
				</div>
			</div>
		</section>
	);
}
