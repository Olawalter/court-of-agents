"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";

export function Header() {
  const { connected, address, username, disconnect, loading } = useWallet();
  const router = useRouter();

  function handleDisconnect() {
    disconnect();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-sm font-bold text-white">CA</span>
          </div>
          <span className="text-lg font-semibold text-neutral-900">
            Court of Agents
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/cases"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cases
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Leaderboard
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />
          ) : connected ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {username}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </Link>
              <button
                onClick={handleDisconnect}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Connect Wallet
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
