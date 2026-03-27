import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { listPostsFn, getPostBySlugFn } from "@/functions/posts.functions";

interface PostFilters {
  type?: string;
  tag?: string;
  search?: string;
}

export const postsInfiniteQueryOptions = (filters: PostFilters = {}) =>
  infiniteQueryOptions({
    queryKey: ["posts", filters],
    queryFn: ({ pageParam }) =>
      listPostsFn({
        data: {
          limit: 10,
          cursor: pageParam ?? undefined,
          type: filters.type || undefined,
          tag: filters.tag || undefined,
          search: filters.search || undefined,
        },
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

export const postQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: () => getPostBySlugFn({ data: { slug } }),
  });
