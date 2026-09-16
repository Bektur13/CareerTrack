import { clerkMiddleware } from "@clerk/nextjs/server";

// No path-matching/protect() here anymore — route protection is
// resource-based now (see src/app/(protected)/layout.tsx and
// src/app/extension/connect/page.tsx). This middleware's only job is
// making Clerk's auth context available to every request; auth() still
// works in API routes and Server Components without it doing anything else.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
