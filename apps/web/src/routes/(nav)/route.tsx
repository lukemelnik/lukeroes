import { createFileRoute, Outlet } from "@tanstack/react-router";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { AudioPlayerProvider } from "@/lib/members/audio-player-context";
import { PersistentPlayer } from "@/components/members/persistent-player";

export const Route = createFileRoute("/(nav)")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AudioPlayerProvider>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <PersistentPlayer />
      </div>
    </AudioPlayerProvider>
  );
}
