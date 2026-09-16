import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/dbUser";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: applicationId } = await params;
  const dbUser = await resolveDbUser(clerkId);

  // Verify the application belongs to this user before attaching anything to it.
  const application = await prisma.jobApplication.findFirst({
    where: { id: applicationId, userId: dbUser.id },
    select: { id: true, companyId: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const contact = await prisma.contact.create({
    data: {
      name,
      title: body.title || null,
      email: body.email || null,
      userId: dbUser.id,
      companyId: application.companyId,
      applications: { connect: { id: applicationId } },
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
