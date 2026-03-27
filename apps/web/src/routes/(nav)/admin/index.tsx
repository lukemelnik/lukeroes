import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Users, CreditCard, FileText, MessageSquare } from "lucide-react";
import {
  getDashboardMetricsFn,
  getSignupChartDataFn,
  getPaidMemberChartDataFn,
} from "@/functions/admin-dashboard.functions";
import { getAdminStatusFn } from "@/functions/admin.functions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/admin/")({
  component: AdminDashboardPage,
  beforeLoad: async () => {
    await getAdminStatusFn();
  },
  head: () => ({
    ...seoHead({ title: "Admin — Dashboard", path: "/admin" }),
  }),
});

const DAY_OPTIONS = [30, 60, 90] as const;

function AdminDashboardPage() {
  const [signupDays, setSignupDays] = useState<number>(30);
  const [memberDays, setMemberDays] = useState<number>(30);

  const { data: metrics } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: () => getDashboardMetricsFn(),
  });

  const { data: signupData } = useQuery({
    queryKey: ["admin-signup-chart", signupDays],
    queryFn: () => getSignupChartDataFn({ data: { days: signupDays } }),
  });

  const { data: memberData } = useQuery({
    queryKey: ["admin-member-chart", memberDays],
    queryFn: () => getPaidMemberChartDataFn({ data: { days: memberDays } }),
  });

  const metricCards = [
    { label: "Total Users", value: metrics?.totalUsers ?? 0, icon: Users },
    { label: "Paid Members", value: metrics?.paidMembers ?? 0, icon: CreditCard },
    { label: "Published Posts", value: metrics?.totalPublishedPosts ?? 0, icon: FileText },
    { label: "Unseen Comments", value: metrics?.unseenComments ?? 0, icon: MessageSquare },
  ];

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
        <h1 className="mb-8 font-heading text-3xl">Dashboard</h1>

        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-border/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Icon className="size-4" />
                {label}
              </div>
              <p className="mt-1 font-heading text-2xl">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <ChartSection title="User Signups" days={signupDays} onDaysChange={setSignupDays}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={signupData ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  allowDecimals={false}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>

          <ChartSection title="Active Paid Members" days={memberDays} onDaysChange={setMemberDays}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={memberData ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  allowDecimals={false}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        </div>
      </div>
    </div>
  );
}

function ChartSection({
  title,
  days,
  onDaysChange,
  children,
}: {
  title: string;
  days: number;
  onDaysChange: (d: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg">{title}</h2>
        <div className="flex gap-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDaysChange(d)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
