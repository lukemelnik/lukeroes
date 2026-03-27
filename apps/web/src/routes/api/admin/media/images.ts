import { createFileRoute } from "@tanstack/react-router";
import { handleImageUploadRequest } from "@/server/image-upload.server";

export const Route = createFileRoute("/api/admin/media/images")({
  server: {
    handlers: {
      POST: ({ request }) => {
        return handleImageUploadRequest(request);
      },
    },
  },
});
