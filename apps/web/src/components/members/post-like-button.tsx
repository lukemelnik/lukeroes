import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPostLikeInfoFn, togglePostLikeFn } from "@/functions/likes.functions";

interface PostLikeButtonProps {
  postId: number;
  isLoggedIn: boolean;
}

export function PostLikeButton({ postId, isLoggedIn }: PostLikeButtonProps) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["post-likes", postId],
    queryFn: () => getPostLikeInfoFn({ data: { postIds: [postId] } }),
    select: (items) => items[0],
  });

  const toggleMutation = useMutation({
    mutationFn: () => togglePostLikeFn({ data: { postId } }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post-likes", postId] });
      const previous = queryClient.getQueryData<
        Array<{ postId: number; count: number; liked: boolean }>
      >(["post-likes", postId]);

      queryClient.setQueryData(
        ["post-likes", postId],
        (old: Array<{ postId: number; count: number; liked: boolean }> | undefined) => {
          if (!old?.[0]) return old;
          const current = old[0];
          return [
            {
              ...current,
              liked: !current.liked,
              count: current.liked ? current.count - 1 : current.count + 1,
            },
          ];
        },
      );

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["post-likes", postId], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post-likes", postId] });
    },
  });

  const liked = data?.liked ?? false;
  const count = data?.count ?? 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (isLoggedIn) toggleMutation.mutate();
      }}
      disabled={!isLoggedIn || toggleMutation.isPending}
      className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 hover:text-red-500"
      aria-label={liked ? "Unlike post" : "Like post"}
    >
      <Heart
        className={`size-5 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
      />
      {count > 0 && (
        <span className={liked ? "text-red-500" : "text-muted-foreground"}>{count}</span>
      )}
    </button>
  );
}
