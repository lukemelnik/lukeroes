import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  getAccountDataFn,
  updateAccountNameFn,
  deleteAccountFn,
} from "@/functions/account.functions";
import { NotificationsList } from "@/components/members/notifications-list";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/account")({
  component: AccountPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data?.user) {
      throw new Error("Unauthorized");
    }
  },
  head: () => ({
    ...seoHead({ title: "Account", path: "/account" }),
  }),
});

function AccountPage() {
  const { data: account, isLoading } = useQuery({
    queryKey: ["account"],
    queryFn: () => getAccountDataFn(),
  });

  if (isLoading || !account) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <h1 className="mb-8 font-heading text-3xl">Account</h1>

      <div className="space-y-10">
        <ProfileSection account={account} />
        <SubscriptionSection account={account} />
        <NotificationsSection />
        <DangerZone />
      </div>
    </div>
  );
}

interface AccountData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  createdAt: string;
  hasPassword: boolean;
  providers: string[];
  subscriptionStatus: string | null;
  isMember: boolean;
  isAdmin: boolean;
}

function ProfileSection({ account }: { account: AccountData }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(account.name);
  const [editingName, setEditingName] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const updateNameMutation = useMutation({
    mutationFn: (n: string) => updateAccountNameFn({ data: { name: n } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      setEditingName(false);
      toast.success("Name updated");
    },
    onError: () => toast.error("Failed to update name"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (args: { currentPassword: string; newPassword: string }) =>
      authClient.changePassword(args),
    onSuccess: () => {
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    },
    onError: () => toast.error("Failed to change password"),
  });

  const initials = account.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl">Profile</h2>
      <div className="rounded-lg border border-border/50 p-6">
        <div className="flex items-center gap-4">
          {account.image ? (
            <img
              src={account.image}
              alt={account.name}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 font-heading font-medium text-lg text-primary">
              {initials}
            </div>
          )}
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateNameMutation.mutate(name)}
                  disabled={!name.trim() || updateNameMutation.isPending}
                  className="rounded bg-primary px-2 py-1 text-primary-foreground text-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setName(account.name);
                  }}
                  className="text-muted-foreground text-xs hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium">{account.name}</p>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-primary text-xs hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="mt-0.5 text-muted-foreground text-sm">{account.email}</p>
          </div>
        </div>

        {account.hasPassword && (
          <div className="mt-4 border-t border-border/50 pt-4">
            {showPasswordForm ? (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => changePasswordMutation.mutate({ currentPassword, newPassword })}
                    disabled={
                      !currentPassword || newPassword.length < 8 || changePasswordMutation.isPending
                    }
                    className="rounded bg-primary px-3 py-1.5 text-primary-foreground text-sm disabled:opacity-50"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                    }}
                    className="text-muted-foreground text-sm hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="text-primary text-sm hover:underline"
              >
                Change password
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SubscriptionSection({ account }: { account: AccountData }) {
  const status = account.subscriptionStatus;

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl">Subscription</h2>
      <div className="rounded-lg border border-border/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">
              Status:{" "}
              <span className={status === "active" ? "text-primary" : "text-muted-foreground"}>
                {status ?? "None"}
              </span>
            </p>
            {account.isAdmin && (
              <p className="mt-1 text-muted-foreground text-xs">
                As an admin, you have full member access.
              </p>
            )}
          </div>
          {status === "active" ? (
            <button
              type="button"
              onClick={() => authClient.subscription.cancel({ returnUrl: "/account" })}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Manage subscription
            </button>
          ) : (
            <Link
              to="/members"
              className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm hover:bg-primary/90"
            >
              {status === "canceled" ? "Resubscribe" : "Become a member"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function NotificationsSection() {
  return (
    <section>
      <h2 className="mb-4 font-heading text-xl">Notifications</h2>
      <div className="rounded-lg border border-border/50 p-6">
        <NotificationsList />
      </div>
    </section>
  );
}

function DangerZone() {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccountFn({ data: { confirmation } }),
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => toast.error("Failed to delete account"),
  });

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl text-destructive">Danger Zone</h2>
      <div className="rounded-lg border border-destructive/30 p-6">
        {showDelete ? (
          <div className="space-y-3">
            <p className="text-sm">
              This action is permanent. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={confirmation !== "DELETE" || deleteMutation.isPending}
                className="rounded bg-destructive px-3 py-1.5 text-destructive-foreground text-sm disabled:opacity-50"
              >
                Delete My Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmation("");
                }}
                className="text-muted-foreground text-sm hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-destructive text-sm hover:underline"
          >
            Delete account
          </button>
        )}
      </div>
    </section>
  );
}
