"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Target, CheckCircle2, Loader2 } from "lucide-react";
import { fetchApplications } from "@/lib/applicationsApi";
import type { ApplicationStage, JobApplication } from "@/components/kanban/board";

const FUNNEL_STAGES: { id: ApplicationStage; label: string }[] = [
  { id: "APPLIED", label: "Applied" },
  { id: "SCREENING", label: "Screening" },
  { id: "TECHNICAL", label: "Technical" },
  { id: "OFFER", label: "Offer" },
];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function getVelocityData(applications: JobApplication[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: monthKey(d), month: d.toLocaleString("en-US", { month: "short" }), applications: 0 };
  });
  const byKey = new Map(months.map((m) => [m.key, m]));

  for (const app of applications) {
    if (!app.dateApplied) continue;
    const bucket = byKey.get(monthKey(new Date(app.dateApplied)));
    if (bucket) bucket.applications += 1;
  }

  return months.map(({ month, applications }) => ({ month, applications }));
}

function getConversionData(applications: JobApplication[]) {
  return FUNNEL_STAGES.map(({ id, label }) => ({
    stage: label,
    count: applications.filter((app) => app.stage === id).length,
  }));
}

function countInMonth(applications: JobApplication[], key: string) {
  return applications.filter((app) => app.dateApplied && monthKey(new Date(app.dateApplied)) === key).length;
}

export function AnalyticsDashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchApplications()
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Unable to load analytics");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = applications.length;
    // No stage-history log exists — "interviewed" is approximated as
    // applications currently sitting at or past the Screening stage.
    const interviewedCount = applications.filter(
      (app) => app.stage === "SCREENING" || app.stage === "TECHNICAL" || app.stage === "OFFER"
    ).length;
    const offerCount = applications.filter((app) => app.stage === "OFFER").length;

    const now = new Date();
    const thisMonthCount = countInMonth(applications, monthKey(now));
    const lastMonthCount = countInMonth(applications, monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
    const momChange = lastMonthCount === 0
      ? (thisMonthCount > 0 ? 100 : 0)
      : ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;

    return {
      total,
      interviewedCount,
      interviewRate: total ? (interviewedCount / total) * 100 : 0,
      offerCount,
      offerConversion: total ? (offerCount / total) * 100 : 0,
      momChange,
    };
  }, [applications]);

  const velocityData = useMemo(() => getVelocityData(applications), [applications]);
  const conversionData = useMemo(() => getConversionData(applications), [applications]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading analytics...
      </div>
    );
  }

  if (loadError) {
    return <div className="flex flex-1 items-center justify-center p-4 text-sm text-destructive">{loadError}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Applications</CardTitle>
            <Target className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.total}</div>
            <p
              className={`text-xs flex items-center gap-1 mt-1 ${
                stats.momChange >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {stats.momChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.momChange >= 0 ? "+" : ""}
              {stats.momChange.toFixed(0)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Interview Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.interviewRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.interviewedCount} out of {stats.total} applications
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Offer Conversion</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.offerConversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.offerCount} active offer{stats.offerCount === 1 ? "" : "s"} received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-card-foreground">Application Submission Velocity</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                  itemStyle={{ color: "var(--card-foreground)" }}
                />
                <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-card-foreground">Stage Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conversionData}>
                <XAxis dataKey="stage" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                  itemStyle={{ color: "var(--card-foreground)" }}
                />
                <Area type="monotone" dataKey="count" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
