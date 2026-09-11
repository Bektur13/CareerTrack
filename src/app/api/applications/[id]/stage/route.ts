import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/dbUser";
import type { ApplicationStage } from "@/components/kanban/board";

export const runtime = "nodejs";

const STAGE_VALUES: ApplicationStage[] = ["APPLIED", "SCREENING", "TECHNICAL", "OFFER", "REJECTED"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const stage = body?.stage as ApplicationStage | undefined;

  if (!stage || !STAGE_VALUES.includes(stage)) {
    return NextResponse.json(
      { error: `stage must be one of: ${STAGE_VALUES.join(", ")}` },
      { status: 400 }
    );
  }

  const dbUser = await resolveDbUser(clerkId);

  // Scope the update to the caller's own row — a non-matching id 404s
  // instead of touching someone else's application.
  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const application = await prisma.jobApplication.update({
    where: { id },
    data: { stage },
    include: { company: true },
  });

  return NextResponse.json(application);
}
