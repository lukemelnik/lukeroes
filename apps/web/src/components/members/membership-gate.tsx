import { Lock } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useMembership } from "@/lib/members/membership-context";
import { authClient } from "@/lib/auth-client";
import { MEMBERSHIP_TIER } from "@/lib/members/types";

interface MembershipGateProps {
  variant: "inline" | "block";
}

export function MembershipGate({ variant }: MembershipGateProps) {
  const router = useRouter();
  const { isLoggedIn } = useMembership();

  function handleJoin() {
    if (!isLoggedIn) {
      const currentPath = window.location.pathname;
      router.navigate({
        to: "/login",
        search: { redirect: currentPath },
      });
      return;
    }
    authClient.subscription.upgrade({ plan: "member" });
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
        <Lock className="size-3.5" />
        <span>Members only</span>
        <span className="text-border">&middot;</span>
        <button
          type="button"
          onClick={handleJoin}
          className="text-primary transition-colors hover:text-primary/80"
        >
          Join for ${MEMBERSHIP_TIER.price}/mo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-5 py-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-4" />
        </div>
        <div>
          <p className="font-medium text-sm">This post is for members</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Join for ${MEMBERSHIP_TIER.price}/month to read the full piece and get access to all
            writing, audio, and notes.
          </p>
          <button
            type="button"
            onClick={handleJoin}
            className="mt-3 inline-flex items-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
          >
            Become a member
          </button>
        </div>
      </div>
    </div>
  );
}
