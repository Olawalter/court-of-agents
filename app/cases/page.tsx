import Link from "next/link";
import { getGenLayerClient, CONTRACT_ADDRESSES } from "@/services/genlayer/client";
import { Header } from "@/components/layout/header";
import { AnimatedCaseCard } from "@/features/cases/components/animated-case-card";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  let cases: any[] = [];

  try {
    const { client } = getGenLayerClient();
    const addr = CONTRACT_ADDRESSES.adjudicator;
    const rawIds = await client.readContract({
      address: addr,
      functionName: "list_case_ids",
      args: [0, 50],
    });
    if (rawIds) {
      const ids: string[] = JSON.parse(rawIds as string);
      const rawCases = await Promise.all(
        ids.map((cid) =>
          client.readContract({ address: addr, functionName: "get_case", args: [cid] })
        )
      );
      cases = rawCases
        .filter(Boolean)
        .map((r) => JSON.parse(r as string))
        .map((c) => ({
          ...c,
          id: c.case_id,
          created_at: c.created_at
            ? new Date(c.created_at * 1000).toISOString()
            : null,
        }))
        .reverse(); // newest first
    }
  } catch {
    // StudioNet unreachable — show empty list
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Cases</h1>
            <p className="mt-1 text-neutral-600">
              Browse active disputes awaiting adjudication.
            </p>
          </div>
          <Link
            href="/cases/create"
            className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            + Create Case
          </Link>
        </div>

        {cases.length === 0 ? (
          <p className="text-neutral-500">No cases found.</p>
        ) : (
          <ul className="grid gap-4 list-none p-0 m-0" aria-label="Cases">
            {cases.map((c, index) => (
              <li key={c.id}>
                <AnimatedCaseCard
                  id={c.id}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  status={c.status}
                  difficulty={c.difficulty}
                  created_at={c.created_at}
                  index={index}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
