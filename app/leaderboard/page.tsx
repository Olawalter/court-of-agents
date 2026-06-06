import { createSupabaseAdmin } from "@/services/supabase/server";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const rankDisplay: Record<string, { label: string; color: string }> = {
  novice_arbiter: { label: "Novice Arbiter", color: "bg-neutral-100 text-neutral-700" },
  trusted_judge: { label: "Trusted Judge", color: "bg-blue-100 text-blue-700" },
  consensus_architect: { label: "Consensus Architect", color: "bg-purple-100 text-purple-700" },
  master_adjudicator: { label: "Master Adjudicator", color: "bg-yellow-100 text-yellow-800" },
  grand_adjudicator: { label: "Grand Adjudicator", color: "bg-amber-100 text-amber-800" },
};

export default async function LeaderboardPage() {
  const supabase = createSupabaseAdmin();

  const { data: leaderboard } = await supabase
    .from("user_reputation")
    .select("*, profiles(username, avatar_url)")
    .order("score", { ascending: false })
    .limit(50);

  const { count: totalCases } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true });

  const { count: resolvedCases } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true })
    .eq("status", "consensus_reached");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Leaderboard</h1>
          <p className="mt-1 text-neutral-600">
            Top adjudicators ranked by score, accuracy, and participation.
          </p>
        </div>

        {/* Court Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <div className="text-sm text-neutral-500">Total Cases</div>
            <div className="text-3xl font-bold text-neutral-900">{totalCases || 0}</div>
          </Card>
          <Card>
            <div className="text-sm text-neutral-500">Resolved</div>
            <div className="text-3xl font-bold text-green-600">{resolvedCases || 0}</div>
          </Card>
          <Card>
            <div className="text-sm text-neutral-500">Active Judges</div>
            <div className="text-3xl font-bold text-brand-600">{leaderboard?.length || 0}</div>
          </Card>
        </div>

        {/* Leaderboard Table */}
        {!leaderboard || leaderboard.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-neutral-500 mb-2">No adjudicators yet.</p>
            <p className="text-sm text-neutral-400">
              Create an account and submit your first decision to appear here.
            </p>
          </Card>
        ) : (
          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-1 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Judge</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Accuracy</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Cases</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const profile = entry.profiles as { username: string; avatar_url: string | null } | null;
                  const rank = rankDisplay[entry.rank] || rankDisplay.novice_arbiter;

                  return (
                    <tr
                      key={entry.user_id}
                      className="border-b border-neutral-100 hover:bg-surface-1 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${index < 3 ? "text-brand-600" : "text-neutral-400"}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                            {profile?.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-sm font-medium text-neutral-900">
                            {profile?.username || "Anonymous"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${rank.color}`}>
                          {rank.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-700">
                        {Math.round(entry.accuracy * 100)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-700">
                        {entry.total_cases}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-700">
                        {entry.streak > 0 ? `${entry.streak}🔥` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
