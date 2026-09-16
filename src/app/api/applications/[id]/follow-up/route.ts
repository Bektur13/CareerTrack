import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/dbUser";

export const runtime = "nodejs";

// Marks "you addressed the follow-up nag for this application" — called
// whether the user actually sent an email or chose "Not now". One field
// covers both deliberately: the stale-applications banner only needs to
// know "don't re-nag for a while", not distinguish why.
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dbUser = await resolveDbUser(clerkId);

  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const application = await prisma.jobApplication.update({
    where: { id },
    data: { lastFollowedUpAt: new Date() },
    include: { company: true, contacts: true },
  });

  return NextResponse.json(application);
}
