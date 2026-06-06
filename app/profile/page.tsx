"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";

const rankDisplay: Record<string, { label: string; color: string; description: string }> = {
  novice_arbiter: { label: "Novice Arbiter", color: "bg-neutral-100 text-neutral-700", description: "Just getting started. Make your first decisions to rank up." },
  trusted_judge: { label: "Trusted Judge", color: "bg-blue-100 text-blue-700", description: "You've proven your judgment. Keep building your track record." },
  consensus_architect: { label: "Consensus Architect", color: "bg-purple-100 text-purple-700", description: "Your decisions consistently align with consensus. Well done." },
  master_adjudicator: { label: "Master Adjudicator", color: "bg-yellow-100 text-yellow-800", description: "Elite status. Your judgment is trusted by the court." },
  grand_adjudicator: { label: "Grand Adjudicator", color: "bg-amber-100 text-amber-800", description: "The highest honor. You are a pillar of the Court of Agents." },
};

interface Reputation {
  username: string;
  rank: string;
  score: number;
  total_cases: number;
  correct_decisions: number;
  accuracy: number;
  streak: number;
  best_streak: number;
}

export default function ProfilePage() {
  const { connected, address, username, exportPrivateKey, loading: walletLoading } = useWallet();
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [exportedKey, setExportedKey] = useState("");
  const [exportConfirmed, setExportConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (walletLoading) return;
    if (!connected) {
      router.push("/login");
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_reputation",
            params: { user_address: address },
          }),
        });
        const data = await res.json();
        if (data.result) {
          try { setReputation(JSON.parse(data.result)); } catch {}
        }
      } catch {}
      setLoading(false);
    }

    loadProfile();
  }, [connected, address, walletLoading]);

  async function handleExportKey() {
    if (!exportConfirmed) return;
    const key = await exportPrivateKey();
    if (key) setExportedKey(key);
  }

  async function handleCopyKey() {
    await navigator.clipboard.writeText(exportedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (walletLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center"><Loading size="lg" /></div>
      </div>
    );
  }

  if (!connected) return null;

  const rank = rankDisplay[reputation?.rank || "novice_arbiter"];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* Profile Header */}
        <div className="mb-8 flex items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
            {username ? username.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{username || "Unknown"}</h1>
            <p className="mt-1 text-xs text-neutral-400 font-mono">{address}</p>
            <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${rank.color}`}>
              {rank.label}
            </span>
          </div>
        </div>

        {/* Rank Description */}
        <Card className="mb-8 bg-brand-50/30 border-brand-200">
          <p className="text-sm text-neutral-700">{rank.description}</p>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <div className="text-xs text-neutral-500 uppercase">Score</div>
            <div className="text-2xl font-bold text-neutral-900">{reputation?.score || 0}</div>
          </Card>
          <Card>
            <div className="text-xs text-neutral-500 uppercase">Cases</div>
            <div className="text-2xl font-bold text-neutral-900">{reputation?.total_cases || 0}</div>
          </Card>
          <Card>
            <div className="text-xs text-neutral-500 uppercase">Accuracy</div>
            <div className="text-2xl font-bold text-green-600">
              {reputation ? Math.round(reputation.accuracy * 100) : 0}%
            </div>
          </Card>
          <Card>
            <div className="text-xs text-neutral-500 uppercase">Best Streak</div>
            <div className="text-2xl font-bold text-brand-600">{reputation?.best_streak || 0}</div>
          </Card>
        </div>

        {/* Wallet Details */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Wallet</h2>
          <Card>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-neutral-500 uppercase">Network</div>
                <div className="text-sm font-medium text-neutral-900">GenLayer StudioNet (Chain ID: 61999)</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase">Address</div>
                <div className="text-sm font-mono text-neutral-700 break-all">{address}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase">Status</div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-700">Connected</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Export Private Key */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Security</h2>
          <Card>
            {exportedKey ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 font-mono text-xs text-neutral-900 break-all select-all">
                  {exportedKey}
                </div>
                <Button variant="secondary" size="sm" onClick={handleCopyKey} className="w-full">
                  {copied ? "Copied!" : "Copy Private Key"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setExportedKey(""); setShowExport(false); setExportConfirmed(false); }} className="w-full">
                  Hide
                </Button>
              </div>
            ) : showExport ? (
              <div className="space-y-3">
                <Card className="border-red-200 bg-red-50">
                  <p className="text-sm font-semibold text-red-700">Warning</p>
                  <p className="text-xs text-red-600 mt-1">
                    Anyone with this private key can control this wallet and all its assets. Never share it.
                  </p>
                </Card>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportConfirmed}
                    onChange={(e) => setExportConfirmed(e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">
                    I understand that anyone with this private key can control this wallet
                  </span>
                </label>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleExportKey}
                  disabled={!exportConfirmed}
                  className="w-full"
                >
                  Reveal Private Key
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowExport(true)}>
                Export Private Key
              </Button>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
