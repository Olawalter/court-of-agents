import Link from "next/link";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseAdmin();

  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: totalCases } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true });

  const { count: pendingCases } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: resolvedCases } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true })
    .eq("status", "consensus_reached");

  const stats = [
    { label: "Total Cases", value: totalCases || 0 },
    { label: "Pending", value: pendingCases || 0 },
    { label: "Resolved", value: resolvedCases || 0 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-neutral-600">
          Welcome to the Court of Agents. Select a case to begin adjudication.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-sm text-neutral-500">{s.label}</div>
            <div className="text-3xl font-bold text-neutral-900">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Recent Cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recent Cases
          </h2>
          <Link
            href="/cases"
            className="text-sm text-brand-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-3">
          {cases?.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`}>
              <Card hover className="flex items-center justify-between py-4">
                <div>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription className="mt-0.5">
                    {c.category.replace(/_/g, " ")} · Difficulty {c.difficulty}/5
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    c.status === "pending"
                      ? "default"
                      : c.status === "consensus_reached"
                        ? "success"
                        : "info"
                  }
                >
                  {c.status.replace(/_/g, " ")}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
