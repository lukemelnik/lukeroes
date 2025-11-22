import { sendContact } from "@/functions/send-contact";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface ContactFormProps {
  showProjectField?: boolean;
}

const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
  project: z.string().optional(),
});

type ContactFormInput = z.infer<typeof ContactFormSchema>;

const defaultValues: ContactFormInput = {
  name: "",
  email: "",
  message: "",
  project: "",
};

export function ContactForm({ showProjectField = true }: ContactFormProps) {
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await sendContact({
          data: {
            name: value.name,
            email: value.email,
            message: value.message,
            project: showProjectField ? value.project : undefined,
          },
        });
        toast.success(
          "Thanks for your message! I'll get back to you within 24 hours.",
        );
        form.reset();
      } catch (error) {
        toast.error("Failed to send message. Please try again.");
      }
    },
    validators: {
      onSubmit: ContactFormSchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="Your name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="your@email.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      {showProjectField && (
        <form.Field name="project">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Project Type</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="e.g. Mixing, Production, Consulting"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      )}

      <form.Field name="message">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Message</Label>
            <Textarea
              id={field.name}
              name={field.name}
              rows={4}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-sm text-red-500">
                {error?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>

      <form.Subscribe>
        {(state) => (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!state.canSubmit || state.isSubmitting}
          >
            {state.isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
