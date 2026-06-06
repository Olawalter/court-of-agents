"use client";

import { useState, useEffect, useCallback } from "react";

interface WalletState {
  address: string;
  privateKey: string;
  username: string;
  connected: boolean;
}

const WALLET_STORAGE_KEY = "court-of-agents-wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) {
      try {
        setWallet(JSON.parse(stored));
      } catch {
        localStorage.removeItem(WALLET_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const connect = useCallback((address: string, privateKey: string, username: string) => {
    const state: WalletState = { address, privateKey, username, connected: true };
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
    setWallet(state);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    setWallet(null);
  }, []);

  return {
    wallet,
    loading,
    connected: !!wallet?.connected,
    address: wallet?.address || "",
    privateKey: wallet?.privateKey || "",
    username: wallet?.username || "",
    connect,
    disconnect,
  };
}
