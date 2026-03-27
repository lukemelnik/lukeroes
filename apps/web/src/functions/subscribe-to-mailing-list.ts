import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addSubscriber } from "@/server/services/email.service";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const subscribeToMailingList = createServerFn({ method: "POST" })
  .inputValidator(subscribeSchema)
  .handler(async ({ data }) => {
    try {
      await addSubscriber(data.email);
    } catch (error) {
      console.error("MailerLite subscription error:", error);
      throw new Error("Failed to subscribe. Please try again later.", { cause: error });
    }

    return { success: true };
  });
