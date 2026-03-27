import { ArrowUp, MessageCircle, Reply, Shield, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  createCommentFn,
  deleteCommentFn,
  listCommentsFn,
  toggleCommentVoteFn,
} from "@/functions/comments.functions";

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string | null;
}

interface CommentReply {
  id: number;
  postId: number;
  userId: string | null;
  parentCommentId: number | null;
  text: string;
  isDeleted: boolean;
  createdAt: string;
  user: CommentUser | null;
  voteCount: number;
  hasCurrentUserVoted: boolean;
}

interface CommentThread extends CommentReply {
  replies: CommentReply[];
}

interface CommentsSectionProps {
  postId: number;
  postVisibility: "public" | "members";
  isLoggedIn: boolean;
  isMember: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
}

export function CommentsSection({
  postId,
  postVisibility,
  isLoggedIn,
  isMember,
  currentUserId,
  isAdmin,
}: CommentsSectionProps) {
  const locked = postVisibility === "members" && !isMember;

  if (locked) {
    return (
      <div className="mt-12 border-t border-border/50 pt-8">
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
          <MessageCircle className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="mb-1 font-medium">Members-only comments</p>
          <p className="text-muted-foreground text-sm">Become a member to join the conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-border/50 pt-8">
      <h3 className="mb-6 flex items-center gap-2 font-heading text-lg">
        <MessageCircle className="size-5" />
        Comments
      </h3>

      {isLoggedIn ? (
        <CommentComposer postId={postId} />
      ) : (
        <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/login" className="text-primary hover:text-primary/80">
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        </div>
      )}

      <CommentList
        postId={postId}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function CommentComposer({
  postId,
  parentCommentId,
  onDone,
}: {
  postId: number;
  parentCommentId?: number;
  onDone?: () => void;
}) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createCommentFn({
        data: {
          postId,
          text,
          parentCommentId,
        },
      }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      onDone?.();
    },
  });

  return (
    <div className="mb-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."}
        rows={parentCommentId ? 2 : 3}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <div className="mt-2 flex justify-end">
        {parentCommentId && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="mr-2 rounded-md px-3 py-1.5 text-muted-foreground text-sm hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!text.trim() || mutation.isPending}
          className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? "Posting..." : parentCommentId ? "Reply" : "Comment"}
        </button>
      </div>
      {mutation.isError && (
        <p className="mt-1 text-red-500 text-xs">
          {mutation.error instanceof Error ? mutation.error.message : "Failed to post comment."}
        </p>
      )}
    </div>
  );
}

function CommentList({
  postId,
  isLoggedIn,
  currentUserId,
  isAdmin,
}: {
  postId: number;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
}) {
  const { data: threads, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => listCommentsFn({ data: { postId } }),
  });

  if (isLoading) {
    return <p className="py-4 text-center text-muted-foreground text-sm">Loading comments...</p>;
  }

  if (!threads || threads.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground text-sm">
        No comments yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {(threads as CommentThread[]).map((thread) => (
        <CommentItem
          key={thread.id}
          comment={thread}
          postId={postId}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  isLoggedIn,
  currentUserId,
  isAdmin,
  isReply,
}: {
  comment: CommentThread | CommentReply;
  postId: number;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
  isReply?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const queryClient = useQueryClient();
  const isAdminComment = comment.user?.role === "admin";
  const canDelete = isAdmin || (currentUserId !== null && currentUserId === comment.userId);

  const voteMutation = useMutation({
    mutationFn: () => toggleCommentVoteFn({ data: { commentId: comment.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCommentFn({ data: { commentId: comment.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  return (
    <div className={isReply ? "ml-8 border-l border-border/50 pl-4" : ""}>
      <div
        className={`rounded-lg p-3 ${isAdminComment && !comment.isDeleted ? "bg-primary/5 ring-1 ring-primary/10" : ""}`}
      >
        <div className="mb-1 flex items-center gap-2">
          {comment.user?.image ? (
            <img
              src={comment.user.image}
              alt={comment.user.name ?? ""}
              className="size-6 rounded-full"
            />
          ) : (
            <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
              {(comment.user?.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          <span className="font-medium text-sm">
            {comment.isDeleted ? "Deleted" : (comment.user?.name ?? "Anonymous")}
          </span>
          {isAdminComment && !comment.isDeleted && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Shield className="size-2.5" />
              Admin
            </span>
          )}
          <span className="text-muted-foreground text-xs">
            <RelativeTime date={comment.createdAt} />
          </span>
        </div>

        <p className={`text-sm ${comment.isDeleted ? "italic text-muted-foreground" : ""}`}>
          {comment.text}
        </p>

        {!comment.isDeleted && (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isLoggedIn) voteMutation.mutate();
              }}
              disabled={!isLoggedIn || voteMutation.isPending}
              className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
                comment.hasCurrentUserVoted
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUp className="size-3.5" />
              {comment.voteCount > 0 && <span>{comment.voteCount}</span>}
            </button>

            {isLoggedIn && !isReply && (
              <button
                type="button"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
              >
                <Reply className="size-3.5" />
                Reply
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {showReplyForm && (
        <div className="ml-8 mt-2">
          <CommentComposer
            postId={postId}
            parentCommentId={comment.id}
            onDone={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {"replies" in comment && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RelativeTime({ date }: { date: string }) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return <span>just now</span>;
  if (diffSeconds < 3600) return <span>{Math.floor(diffSeconds / 60)}m ago</span>;
  if (diffSeconds < 86400) return <span>{Math.floor(diffSeconds / 3600)}h ago</span>;
  if (diffSeconds < 604800) return <span>{Math.floor(diffSeconds / 86400)}d ago</span>;

  return (
    <time dateTime={date}>
      {new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}
    </time>
  );
}
