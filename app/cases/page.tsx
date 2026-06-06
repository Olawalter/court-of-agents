import Link from "next/link";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { Header } from "@/components/layout/header";
import { AnimatedCaseCard } from "@/features/cases/components/animated-case-card";

export default async function CasesPage() {
  const supabase = createSupabaseAdmin();
  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

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

        {!cases || cases.length === 0 ? (
          <p className="text-neutral-500">No cases found.</p>
        ) : (
          <div className="grid gap-4">
            {cases.map((c, index) => (
              <AnimatedCaseCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                category={c.category}
                status={c.status}
                difficulty={c.difficulty}
                created_at={c.created_at}
                index={index}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
