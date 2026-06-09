"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";

export function Header() {
  const { connected, address, username, disconnect, deleteWalletFromDevice, loading } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function handleDisconnect() {
    await disconnect();
    setShowMenu(false);
    router.push("/");
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteWalletFromDevice();
    setShowMenu(false);
    setConfirmDelete(false);
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
          <Link href="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
            Dashboard
          </Link>
          <Link href="/cases" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
            Cases
          </Link>
          <Link href="/leaderboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
            Leaderboard
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />
          ) : connected ? (
            <div className="relative">
              <button
                onClick={() => { setShowMenu(!showMenu); setConfirmDelete(false); }}
                className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 hover:bg-surface-3 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
                  {username ? username.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-neutral-700 leading-tight">
                    {username || "Unknown"}
                  </div>
                  <div className="text-xs text-neutral-400 font-mono leading-tight">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                </div>
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white py-2 shadow-lg z-50">
                  <Link
                    href="/profile"
                    onClick={() => setShowMenu(false)}
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-surface-1"
                  >
                    Profile
                  </Link>
                  <hr className="my-1 border-neutral-100" />
                  <button
                    onClick={handleDisconnect}
                    className="block w-full px-4 py-2 text-left text-sm text-neutral-600 hover:bg-surface-1"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={handleDelete}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      confirmDelete
                        ? "text-red-700 bg-red-50 font-medium"
                        : "text-red-500 hover:bg-red-50"
                    }`}
                  >
                    {confirmDelete
                      ? "Confirm: Delete wallet from device"
                      : "Delete wallet from device"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-md bg-brand-600 px-3.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Connect Wallet
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
