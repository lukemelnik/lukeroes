import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
	host: process.env.SMTP_SERVER,
	port: 587,
	secure: false,
	auth: {
		user: process.env.SMTP_USERNAME,
		pass: process.env.SMTP_TOKEN,
	},
});
