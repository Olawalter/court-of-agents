"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface WalletInfo {
  address: string;
  private_key: string;
  username: string;
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [keySaved, setKeySaved] = useState(false);
  const router = useRouter();
  const { connect } = useWallet();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/wallet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create wallet");
      }

      setWalletInfo({
        address: data.address,
        private_key: data.private_key,
        username: data.username,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (walletInfo) {
      connect(walletInfo.address, walletInfo.private_key, walletInfo.username);
      router.push("/dashboard");
    }
  }

  // Show wallet info after creation
  if (walletInfo) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl">
              &#10003;
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Wallet Created!</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Your GenLayer wallet is ready. Save your private key below.
            </p>
          </div>

          <Card className="mb-4 border-brand-200 bg-brand-50/30">
            <div className="mb-3">
              <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
                Username
              </label>
              <div className="rounded-lg bg-white border border-neutral-200 px-3 py-2 text-sm text-neutral-900">
                {walletInfo.username}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
                Wallet Address
              </label>
              <div className="rounded-lg bg-white border border-neutral-200 px-3 py-2 font-mono text-sm text-neutral-900 break-all">
                {walletInfo.address}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
                Private Key
              </label>
              <div className="rounded-lg bg-white border border-red-200 px-3 py-2 font-mono text-xs text-neutral-900 break-all select-all">
                {walletInfo.private_key}
              </div>
            </div>
          </Card>

          <Card className="mb-6 border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-700">
              Save your private key now!
            </p>
            <p className="text-xs text-red-600 mt-1">
              This is the ONLY way to access your wallet. It cannot be recovered if lost. You need it to sign all transactions on GenLayer.
            </p>
          </Card>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={keySaved}
              onChange={(e) => setKeySaved(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">
              I have saved my private key securely
            </span>
          </label>

          <Button
            onClick={handleContinue}
            disabled={!keySaved}
            className="w-full"
            size="lg"
          >
            Enter the Court
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <span className="text-sm font-bold text-white">CA</span>
            </div>
            <span className="text-lg font-semibold text-neutral-900">
              Court of Agents
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Create Wallet</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Generate a GenLayer wallet to join the Court of Agents. All interactions go on-chain.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Username"
            type="text"
            placeholder="judge_dredd"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Generating wallet..." : "Generate Wallet"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have a wallet?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            Connect it
          </Link>
        </p>
      </div>
    </main>
  );
}
