import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";

// Resource-based protection for /dashboard, /analytics, /settings — one
// server-side check here instead of path-matching in middleware.ts (which
// Clerk is deprecating createRouteMatcher in favor of). Same pattern
// src/app/extension/connect/page.tsx already uses on its own.
//
// The sidebar shell lives here now too (moved out of the root layout) —
// it's app chrome for the signed-in dashboard experience, not something
// the landing page or sign-in/sign-up should be wrapped in.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-card">
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
