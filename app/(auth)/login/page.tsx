"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [privateKey, setPrivateKey] = useState("");
  const [username, setUsername] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [derivedAddress, setDerivedAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { importWallet } = useWallet();

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate private key and derive address
      const res = await fetch("/api/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ private_key: privateKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid private key");

      // Import wallet — checks IndexedDB + Supabase for existing profile
      const result = await importWallet(privateKey.trim(), data.address);

      if (result.isNewProfile && !result.username) {
        // No profile found anywhere — ask for username
        setDerivedAddress(data.address);
        setNeedsUsername(true);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import wallet");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetUsername(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    try {
      await importWallet(privateKey.trim(), derivedAddress, username);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  // ─── Username prompt (for new imports without existing profile) ───
  if (needsUsername) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">Set Username</h1>
            <p className="mt-1 text-sm text-neutral-600">
              No profile found for this wallet. Choose a username.
            </p>
            <p className="mt-2 text-xs text-neutral-400 font-mono">
              {derivedAddress}
            </p>
          </div>

          <form onSubmit={handleSetUsername} className="space-y-4">
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
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </form>
        </div>
      </main>
    );
  }

  // ─── Import form ───
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
          <h1 className="text-2xl font-bold text-neutral-900">Import Wallet</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Enter your private key to restore your wallet. Your username will be recovered automatically.
          </p>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
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
            {loading ? "Importing..." : "Import Wallet"}
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
