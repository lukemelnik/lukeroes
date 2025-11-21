import { createFileRoute } from "@tanstack/react-router";
import { ContactForm } from "@/components/contact-form";

export const Route = createFileRoute("/(nav)/contact")({
  component: ContactPageComponent,
});

function ContactPageComponent() {
  return (
    <div className="w-full min-h-screen">
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Get in Touch
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Have a question or just want to say hi? Send me a message and I'll
            get back to you within 24 hours.
          </p>
          <ContactForm showProjectField={false} />
        </div>
      </section>
    </div>
  );
}
