import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/dbUser";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dbUser = await resolveDbUser(clerkId);

  // deleteMany scoped by id + userId in one query — a non-owned or
  // nonexistent id just 404s instead of leaking whether the row exists.
  const { count } = await prisma.jobApplication.deleteMany({
    where: { id, userId: dbUser.id },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
