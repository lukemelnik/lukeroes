import { render } from "@react-email/components";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ContactEmail } from "@/emails/contact-email";
import { transporter } from "@/lib/email";
import { shouldBlockSubmission } from "@/lib/spam-detection";

const contactSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	message: z.string().min(1, "Message is required"),
	project: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const sendContact = createServerFn({ method: "POST" })
	.inputValidator(contactSchema)
	.handler(async ({ data }) => {
		const { name, email, message, project } = data;

		if (shouldBlockSubmission(name)) {
			return { success: true };
		}

		const emailHtml = await render(
			ContactEmail({ name, email, message, project }),
		);

		await transporter.sendMail({
			from: process.env.SMTP_USERNAME,
			to: process.env.REPLY_TO_EMAIL,
			replyTo: email,
			subject: `Contact Form: ${name}${project ? ` - ${project}` : ""}`,
			html: emailHtml,
		});

		return { success: true };
	});
