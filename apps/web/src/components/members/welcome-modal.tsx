import { useState } from "react";
import { X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [optIn, setOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const session = authClient.useSession();

  async function handleConfirm() {
    setSubmitting(true);
    try {
      if (optIn && session.data?.user?.email) {
        // Subscribe to general mailing list via server action
        const { subscribeToMailingList } = await import("@/functions/subscribe-to-mailing-list");
        await subscribeToMailingList({
          data: { email: session.data.user.email },
        });
      }
    } catch {
      // Non-blocking — don't fail the welcome flow
    }
    setSubmitting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <h2 className="mb-2 font-heading text-2xl">Welcome aboard</h2>
        <p className="mb-6 text-muted-foreground text-sm">
          You're in. Thanks for joining — you now have full access to all writing, audio, photos,
          and notes.
        </p>

        <label className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 size-4 rounded border-border"
          />
          <span className="text-sm">Send me email updates when new content is posted</span>
        </label>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Setting up..." : "Let's go"}
        </button>
      </div>
    </div>
  );
}
