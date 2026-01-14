import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface ContactEmailProps {
	name: string;
	email: string;
	message: string;
	project?: string;
}

export function ContactEmail({
	name,
	email,
	message,
	project,
}: ContactEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>New contact form submission from {name}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>New Contact Form Submission</Heading>
					<Hr style={hr} />

					<Section>
						<Text style={label}>Name</Text>
						<Text style={value}>{name}</Text>
					</Section>

					<Section>
						<Text style={label}>Email</Text>
						<Text style={value}>{email}</Text>
					</Section>

					{project && (
						<Section>
							<Text style={label}>Project Type</Text>
							<Text style={value}>{project}</Text>
						</Section>
					)}

					<Section>
						<Text style={label}>Message</Text>
						<Text style={value}>{message}</Text>
					</Section>

					<Hr style={hr} />
					<Text style={footer}>Sent from the contact form at lukeroes.com</Text>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	borderRadius: "5px",
};

const h1 = {
	color: "#1f2937",
	fontSize: "24px",
	fontWeight: "600",
	lineHeight: "40px",
	margin: "0 0 20px",
	padding: "0 48px",
};

const hr = {
	borderColor: "#e5e7eb",
	margin: "20px 0",
};

const label = {
	color: "#6b7280",
	fontSize: "12px",
	fontWeight: "600",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
	margin: "0 0 4px",
	padding: "0 48px",
};

const value = {
	color: "#1f2937",
	fontSize: "16px",
	lineHeight: "24px",
	margin: "0 0 16px",
	padding: "0 48px",
	whiteSpace: "pre-wrap" as const,
};

const footer = {
	color: "#9ca3af",
	fontSize: "12px",
	lineHeight: "16px",
	margin: "0",
	padding: "0 48px",
};
