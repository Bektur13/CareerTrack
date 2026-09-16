import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// Resource-based protection for /dashboard, /analytics, /settings — one
// server-side check here instead of path-matching in middleware.ts (which
// Clerk is deprecating createRouteMatcher in favor of). Same pattern
// src/app/extension/connect/page.tsx already uses on its own.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <>{children}</>;
}
