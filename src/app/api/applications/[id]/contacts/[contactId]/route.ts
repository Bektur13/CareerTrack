import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/dbUser";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ contactId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const dbUser = await resolveDbUser(clerkId);

  // Scoped by contactId + userId directly — a contact is owned by the user
  // regardless of which application's URL it was reached through.
  const { count } = await prisma.contact.deleteMany({
    where: { id: contactId, userId: dbUser.id },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
