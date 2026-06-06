"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { connect } = useWallet();

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate private key by calling the API
      const res = await fetch("/api/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ private_key: privateKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid private key");
      }

      connect(data.address, privateKey.trim(), data.username || data.address.slice(0, 8));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-neutral-900">Connect Wallet</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Enter your GenLayer private key to sign in.
          </p>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <Input
            label="Private Key"
            type="password"
            placeholder="0x..."
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connecting..." : "Connect Wallet"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Don&apos;t have a wallet?{" "}
          <Link href="/register" className="text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
