import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Briefcase, LayoutDashboard, Puzzle, Bell, Users, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Visual pipeline board",
    description: "Drag applications between Applied, Screening, Technical, Offer, and Rejected as things move.",
  },
  {
    icon: Puzzle,
    title: "One-click import",
    description: "A browser extension parses job postings from Greenhouse, LinkedIn, and Handshake straight into your board.",
  },
  {
    icon: Bell,
    title: "Follow-up reminders",
    description: "Get nudged when an application has gone quiet too long — with a ready-to-edit follow-up email.",
  },
  {
    icon: Users,
    title: "Contacts & notes",
    description: "Keep recruiter and hiring-manager contacts, plus interview notes, attached to each application.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "See your submission velocity, interview rate, and offer conversion at a glance.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="size-4" />
          </div>
          <span className="text-sm font-semibold">CareerTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/sign-up" />}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center sm:px-10">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Your job search, actually organized.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground sm:text-lg">
          Track every application from Applied to Offer, get reminded to follow up before it goes
          cold, and clip postings straight off LinkedIn and Greenhouse.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/sign-up" />}>
            Get Started — it&apos;s free
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        </div>

        <div className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-5">
              <feature.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-card-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
