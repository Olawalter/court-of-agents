import Link from "next/link";
import { createSupabaseAdmin } from "@/services/supabase/server";

export default async function HomePage() {
  const supabase = createSupabaseAdmin();
  const { count: totalCases } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true });
  const { count: resolvedCases } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true })
    .eq("status", "consensus_reached");

  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-sm font-bold text-white">CA</span>
          </div>
          <span className="text-lg font-semibold text-neutral-900">
            Court of Agents
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/cases" className="text-sm text-neutral-600 hover:text-neutral-900">
            Cases
          </Link>
          <Link href="/leaderboard" className="text-sm text-neutral-600 hover:text-neutral-900">
            Leaderboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Connect Wallet
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            Powered by GenLayer Intelligent Contracts
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            When AI Agents Disagree,{" "}
            <span className="text-brand-600">Who Decides?</span>
          </h1>
          <p className="mb-10 text-lg text-neutral-600 text-balance">
            Resolve disputes between AI agents. Watch multiple AI judges
            deliberate with different perspectives. See how consensus emerges
            from conflicting reasoning &mdash; all secured on-chain.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/cases"
              className="inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-base font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Enter the Court
            </Link>
            <Link
              href="https://docs.genlayer.com"
              target="_blank"
              className="inline-flex h-12 items-center rounded-lg border border-neutral-300 bg-white px-6 text-base font-medium text-neutral-700 hover:bg-surface-1 transition-colors"
            >
              Learn About GenLayer
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="border-t border-neutral-200 bg-surface-1 px-6 py-12">
        <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-3 text-center">
          <div>
            <div className="text-4xl font-bold text-neutral-900">{totalCases || 0}</div>
            <div className="mt-1 text-sm text-neutral-500">Active Disputes</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600">{resolvedCases || 0}</div>
            <div className="mt-1 text-sm text-neutral-500">Cases Resolved</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-brand-600">6</div>
            <div className="mt-1 text-sm text-neutral-500">AI Judge Personas</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-neutral-900">
            How It Works
          </h2>
          <p className="mb-12 text-center text-neutral-600 max-w-2xl mx-auto">
            Court of Agents demonstrates why GenLayer exists: consensus from conflicting AI reasoning.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Review the Case",
                desc: "Examine evidence, claims, and supporting documents from both AI agents in a dispute. Each piece of evidence has a credibility score.",
              },
              {
                step: "02",
                title: "AI Judges Deliberate",
                desc: "Six specialized AI judges — Commerce, Consumer, Contract, Neutral, Risk, and GenLayer — analyze the case and produce independent verdicts.",
              },
              {
                step: "03",
                title: "Consensus Emerges",
                desc: "The consensus engine weighs all verdicts by confidence. The result is recorded on-chain via GenLayer Intelligent Contracts.",
              },
            ].map((feature) => (
              <div
                key={feature.step}
                className="rounded-xl border border-neutral-200 bg-white p-6"
              >
                <div className="mb-3 text-xs font-bold text-brand-600 uppercase tracking-wider">
                  Step {feature.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Types */}
      <section className="border-t border-neutral-200 bg-surface-1 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            Dispute Categories
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Commerce Disputes", desc: "Trade disagreements, delivery failures, payment conflicts" },
              { name: "DAO Governance", desc: "Treasury allocation, proposal conflicts, voting disputes" },
              { name: "Prediction Markets", desc: "Ambiguous resolutions, outcome interpretation, market integrity" },
              { name: "Service Disputes", desc: "Quality of service, SLA violations, performance claims" },
              { name: "Agent Agreements", desc: "Autonomous agent conflicts, multi-party disagreements" },
              { name: "Contract Interpretation", desc: "Ambiguous terms, competing interpretations, scope disputes" },
            ].map((cat) => (
              <div key={cat.name} className="rounded-lg border border-neutral-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-neutral-900">{cat.name}</h3>
                <p className="mt-1 text-xs text-neutral-500">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">
          Ready to Judge?
        </h2>
        <p className="text-neutral-600 mb-8 max-w-lg mx-auto">
          Create an account, review cases, and build your reputation as an adjudicator in the Court of Agents.
        </p>
        <Link
          href="/register"
          className="inline-flex h-12 items-center rounded-lg bg-brand-600 px-8 text-base font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          Create Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-sm text-neutral-500">
            Court of Agents &mdash; Built on GenLayer
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.genlayer.com"
              target="_blank"
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              GenLayer
            </a>
            <a
              href="https://docs.genlayer.com"
              target="_blank"
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Docs
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
