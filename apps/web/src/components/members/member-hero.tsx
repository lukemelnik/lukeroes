import { useRouter } from "@tanstack/react-router";
import { useMembership } from "@/lib/members/membership-context";
import { authClient } from "@/lib/auth-client";
import { MEMBERSHIP_TIER } from "@/lib/members/types";

export function MemberHero() {
  const router = useRouter();
  const { isLoggedIn } = useMembership();

  function handleJoin() {
    if (!isLoggedIn) {
      router.navigate({
        to: "/login",
        search: { redirect: "/members" },
      });
      return;
    }
    authClient.subscription.upgrade({ plan: "member" });
  }

  return (
    <div className="mb-12 sm:mb-16">
      <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">The Inner Circle</h2>
      <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
        Voice memos from the sidewalk at midnight. Demos before anyone else hears them. Writing
        about the creative process, the mistakes, and what happens between releases. This is the
        unfiltered version.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleJoin}
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        >
          Join for ${MEMBERSHIP_TIER.price}/month
        </button>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
          {MEMBERSHIP_TIER.features.map((feature) => (
            <li key={feature} className="flex items-center gap-1.5">
              <span className="text-primary">&middot;</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
