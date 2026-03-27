import { createFileRoute } from "@tanstack/react-router";
import { MediaLibraryManager } from "@/components/admin/media-library-manager";
import { getAdminStatusFn } from "@/functions/admin.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/admin/media/")({
  component: AdminMediaPage,
  beforeLoad: async () => {
    await getAdminStatusFn();
  },
  head: () => ({
    ...seoHead({ title: "Admin — Media", path: "/admin/media" }),
  }),
});

function AdminMediaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <MediaLibraryManager />
    </div>
  );
}
