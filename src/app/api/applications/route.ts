import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/dbUser";
import { findOrCreateCompanyByName } from "@/lib/companies";

export const runtime = "nodejs";

// Same-origin route handlers for the dashboard. The Express /applications
// routes still exist for the browser extension (which uses API-key auth);
// the web app can't reach them cross-origin because Clerk dev instances
// don't authenticate cross-origin cookie requests.

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await resolveDbUser(clerkId);

  const applications = await prisma.jobApplication.findMany({
    where: { userId: dbUser.id },
    orderBy: { dateApplied: "desc" },
    take: 100,
    include: { company: true },
  });

  return NextResponse.json({ data: applications });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await resolveDbUser(clerkId);

  const body = await req.json().catch(() => null);
  const role = typeof body?.role === "string" ? body.role.trim() : "";
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";

  if (!role) return NextResponse.json({ error: "role is required" }, { status: 400 });
  if (!companyName) return NextResponse.json({ error: "companyName is required" }, { status: 400 });

  const company = await findOrCreateCompanyByName(companyName);

  const application = await prisma.jobApplication.create({
    data: {
      role,
      companyId: company.id,
      userId: dbUser.id,
      location: body.location || null,
      salaryRange: body.salaryRange || null,
      description: body.description || null,
      sourceUrl: body.sourceUrl || null,
      source: body.source || null,
    },
    include: { company: true },
  });

  return NextResponse.json(application, { status: 201 });
}
