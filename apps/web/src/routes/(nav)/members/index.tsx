import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { MembershipProvider } from "@/lib/members/membership-context";
import { getMembershipStatusFn } from "@/functions/membership.functions";
import { postsInfiniteQueryOptions } from "@/hooks/use-posts";
import { FeedFilters } from "@/components/members/feed-filters";
import { PostFeed } from "@/components/members/post-feed";
import { MemberHero } from "@/components/members/member-hero";
import { WelcomeModal } from "@/components/members/welcome-modal";
import { SearchBar } from "@/components/members/search-bar";
import { seoHead } from "@/lib/seo";

const searchSchema = z.object({
  type: z.enum(["audio", "writing", "note", "photo"]).optional(),
  tag: z.string().optional(),
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/(nav)/members/")({
  component: MembersPage,
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const membership = await getMembershipStatusFn();
    return { membership };
  },
  head: () => ({
    ...seoHead({
      title: "Members",
      description:
        "Exclusive content from Luke Roes — voice memos, early demos, writing, and behind-the-scenes notes.",
      path: "/members",
    }),
  }),
});

function MembersPage() {
  const { type: urlType, tag: urlTag, session_id } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { membership } = Route.useRouteContext();
  const [filter, setFilter] = useState<string | undefined>(urlType);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | undefined>(urlTag);
  const [showWelcome, setShowWelcome] = useState(!!session_id);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryOptions = postsInfiniteQueryOptions({
    type: filter,
    tag: activeTag,
    search: debouncedSearch || undefined,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(queryOptions);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  function handleTagClick(tag: string) {
    if (activeTag === tag) {
      setActiveTag(undefined);
      navigate({ search: (prev) => ({ ...prev, tag: undefined }) });
    } else {
      setActiveTag(tag);
      navigate({ search: (prev) => ({ ...prev, tag }) });
    }
  }

  function clearTag() {
    setActiveTag(undefined);
    navigate({ search: (prev) => ({ ...prev, tag: undefined }) });
  }

  return (
    <MembershipProvider isMember={membership.isMember} isLoggedIn={membership.isLoggedIn}>
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-10 sm:px-6 sm:pt-16">
        {/* Hero — only for non-members */}
        {!membership.isMember && <MemberHero />}

        {/* Search */}
        <div className="mb-4">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Filters + count + admin new post */}
        <div className="mb-4 flex items-center justify-between">
          <FeedFilters activeFilter={filter} onFilterChange={setFilter} />
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              {allPosts.length} {allPosts.length === 1 ? "post" : "posts"}
            </span>
            {membership.isAdmin && (
              <Link
                to="/admin/posts/new"
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="size-3.5" />
                New post
              </Link>
            )}
          </div>
        </div>

        {/* Active tag indicator */}
        {activeTag && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Filtered by tag:</span>
            <button
              type="button"
              onClick={clearTag}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary text-sm transition-colors hover:bg-primary/20"
            >
              {activeTag}
              <span className="ml-1">&times;</span>
            </button>
          </div>
        )}

        {/* Separator */}
        <div className="mb-8 border-t border-border/50 sm:mb-10" />

        {/* Feed */}
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading...</div>
        ) : (
          <PostFeed posts={allPosts} onTagClick={handleTagClick} />
        )}

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-10">
          {isFetchingNextPage && (
            <div className="py-4 text-center text-muted-foreground text-sm">Loading more...</div>
          )}
        </div>
      </div>

      {showWelcome && (
        <WelcomeModal
          onClose={() => {
            setShowWelcome(false);
            navigate({
              search: (prev) => ({
                ...prev,
                session_id: undefined,
              }),
            });
          }}
        />
      )}
    </MembershipProvider>
  );
}
