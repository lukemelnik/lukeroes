import TourSection from "@/components/sections/tour-section";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(nav)/tour")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <TourSection showPastDates={false} />
    </div>
  );
}
