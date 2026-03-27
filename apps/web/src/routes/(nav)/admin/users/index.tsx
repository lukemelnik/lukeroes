import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, ShieldOff, Ban, UserCheck, Eye, KeyRound, Gift } from "lucide-react";
import { toast } from "sonner";
import { getAdminStatusFn } from "@/functions/admin.functions";
import {
  listAdminUsersFn,
  changeUserRoleFn,
  banUserFn,
  unbanUserFn,
  impersonateUserFn,
  revokeAllSessionsFn,
  giftMembershipFn,
} from "@/functions/admin-users.functions";
import { authClient } from "@/lib/auth-client";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { seoHead } from "@/lib/seo";
import type { AdminUserRow } from "@/server/admin-users.server";

export const Route = createFileRoute("/(nav)/admin/users/")({
  component: AdminUsersPage,
  beforeLoad: async () => {
    await getAdminStatusFn();
  },
  head: () => ({
    ...seoHead({ title: "Admin — Users", path: "/admin/users" }),
  }),
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAdminUsersFn(),
  });

  const [banTarget, setBanTarget] = useState<AdminUserRow | null>(null);
  const [banReason, setBanReason] = useState("");

  const changeRoleMutation = useMutation({
    mutationFn: (args: { userId: string; role: "user" | "admin" }) =>
      changeUserRoleFn({ data: args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const banMutation = useMutation({
    mutationFn: (args: { userId: string; reason: string }) => banUserFn({ data: args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setBanTarget(null);
      setBanReason("");
      toast.success("User banned");
    },
    onError: () => toast.error("Failed to ban user"),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => unbanUserFn({ data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User unbanned");
    },
    onError: () => toast.error("Failed to unban user"),
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      await impersonateUserFn({ data: { userId } });
      await authClient.admin.impersonateUser({ userId });
    },
    onSuccess: () => {
      toast.success("Impersonating user — reload to see their view");
    },
    onError: () => toast.error("Failed to impersonate"),
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: (userId: string) => revokeAllSessionsFn({ data: { userId } }),
    onSuccess: () => toast.success("All sessions revoked"),
    onError: () => toast.error("Failed to revoke sessions"),
  });

  const giftMutation = useMutation({
    mutationFn: (args: { userId: string; userEmail: string }) => giftMembershipFn({ data: args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Gift membership applied");
    },
    onError: () => toast.error("Failed to gift membership"),
  });

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
        <h1 className="mb-8 font-heading text-3xl">Users</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground">No users yet.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u: AdminUserRow) => (
              <div
                key={u.id}
                className={`rounded-lg border border-border/50 p-4 ${u.banned ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{u.name}</p>
                      {u.role === "admin" && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary text-xs">
                          admin
                        </span>
                      )}
                      {u.banned && (
                        <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-destructive text-xs">
                          banned
                        </span>
                      )}
                      {u.subscriptionStatus && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            u.subscriptionStatus === "active"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.subscriptionStatus}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-muted-foreground text-xs">{u.email}</p>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      Joined{" "}
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {u.banned && u.banReason && (
                      <p className="mt-1 text-destructive text-xs">Reason: {u.banReason}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <ActionButton
                      icon={u.role === "admin" ? ShieldOff : Shield}
                      title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                      onClick={() =>
                        changeRoleMutation.mutate({
                          userId: u.id,
                          role: u.role === "admin" ? "user" : "admin",
                        })
                      }
                    />
                    {u.banned ? (
                      <ActionButton
                        icon={UserCheck}
                        title="Unban"
                        onClick={() => unbanMutation.mutate(u.id)}
                      />
                    ) : (
                      <ActionButton
                        icon={Ban}
                        title="Ban"
                        onClick={() => {
                          setBanTarget(u);
                          setBanReason("");
                        }}
                      />
                    )}
                    <ActionButton
                      icon={Eye}
                      title="Impersonate"
                      onClick={() => {
                        if (confirm("Impersonate this user?")) {
                          impersonateMutation.mutate(u.id);
                        }
                      }}
                    />
                    <ActionButton
                      icon={KeyRound}
                      title="Revoke sessions"
                      onClick={() => {
                        if (confirm("Revoke all sessions for this user?")) {
                          revokeSessionsMutation.mutate(u.id);
                        }
                      }}
                    />
                    {u.subscriptionStatus !== "active" && (
                      <ActionButton
                        icon={Gift}
                        title="Gift membership"
                        onClick={() => {
                          if (confirm(`Gift membership to ${u.email}?`)) {
                            giftMutation.mutate({ userId: u.id, userEmail: u.email });
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {banTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <h2 className="mb-4 font-heading text-lg">Ban {banTarget.name}</h2>
              <label className="block text-sm">
                Reason
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-transparent p-2 text-sm"
                  rows={3}
                  placeholder="Reason for ban..."
                />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBanTarget(null)}
                  className="rounded-md px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!banReason.trim() || banMutation.isPending}
                  onClick={() =>
                    banMutation.mutate({ userId: banTarget.id, reason: banReason.trim() })
                  }
                  className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground text-sm disabled:opacity-50"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  title,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-4" />
    </button>
  );
}
