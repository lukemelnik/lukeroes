import MailerLite from "@mailerlite/mailerlite-nodejs";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscribeSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export const subscribeToMailingList = createServerFn({ method: "POST" })
	.inputValidator(subscribeSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.MAILERLITE_API_KEY;
		if (!apiKey) {
			throw new Error("Mailing list is not configured");
		}

		const mailerlite = new MailerLite({ api_key: apiKey });

		try {
			await mailerlite.subscribers.createOrUpdate({
				email: data.email,
			});
		} catch (error) {
			console.error("MailerLite subscription error:", error);
			throw new Error("Failed to subscribe. Please try again later.");
		}

		return { success: true };
	});
