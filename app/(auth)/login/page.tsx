"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { connect, connected } = useWallet();

  if (connected) {
    router.push("/dashboard");
    return null;
  }

  async function handleConnect() {
    setError("");
    setLoading(true);
    try {
      await connect();
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
            Use MetaMask or Rabby to sign transactions on GenLayer StudioNet.
            No private key is stored by this app.
          </p>
        </div>

        <Button className="w-full" size="lg" onClick={handleConnect} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Connecting...
            </span>
          ) : (
            "Connect MetaMask / Rabby"
          )}
        </Button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-neutral-500">
          Your wallet signs every transaction directly.
          GenLayer StudioNet will be added to your wallet automatically.
        </p>
      </div>
    </main>
  );
}
