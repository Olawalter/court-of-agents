"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "coa_wallet_address";
const STUDIONET_CHAIN_ID_HEX = `0x${(61999).toString(16)}`; // 0xf22f

const STUDIONET_CHAIN_PARAMS = {
  chainId: STUDIONET_CHAIN_ID_HEX,
  chainName: "GenLayer StudioNet",
  rpcUrls: [
    process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api",
  ],
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  blockExplorerUrls: ["https://studio.genlayer.com"],
};

/** Ensure the injected wallet knows about StudioNet and is on it. */
async function ensureStudioNet(eth: any) {
  // Add chain first (silently ignored if already added)
  try {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [STUDIONET_CHAIN_PARAMS],
    });
  } catch { /* already added or wallet declined the call */ }

  // Switch to StudioNet
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
    });
  } catch { /* already on chain, or wallet handles it silently */ }
}

export function useWallet() {
  const [address, setAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const eth = (window as any).ethereum;

        // 1. Restore persisted address instantly so the UI doesn't flicker.
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setAddress(saved);
          setConnected(true);
        }

        if (!eth) {
          setLoading(false);
          return;
        }

        // 2. Verify with the wallet (silent — no popup).
        const accounts: string[] = await eth.request({ method: "eth_accounts" });
        if (accounts?.length > 0) {
          const addr = accounts[0];
          setAddress(addr);
          setConnected(true);
          localStorage.setItem(STORAGE_KEY, addr);
          // Silently ensure StudioNet is configured whenever we detect a live wallet.
          void ensureStudioNet(eth);
        } else if (saved) {
          // Wallet locked or site permission revoked — clear stale cache.
          localStorage.removeItem(STORAGE_KEY);
          setAddress("");
          setConnected(false);
        }
      } catch {
        // wallet unavailable
      } finally {
        setLoading(false);
      }
    }

    restore();

    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        setAddress("");
        setConnected(false);
      } else {
        localStorage.setItem(STORAGE_KEY, accounts[0]);
        setAddress(accounts[0]);
        setConnected(true);
      }
    };

    const handleChainChanged = () => {
      // Re-check accounts when the user switches chains in their wallet.
      eth.request({ method: "eth_accounts" }).then(handleAccountsChanged).catch(() => {});
    };

    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  /**
   * Connect MetaMask / Rabby.
   * Always adds StudioNet and switches to it before requesting accounts.
   */
  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      throw new Error(
        "No wallet detected. Please install MetaMask or Rabby and refresh."
      );
    }

    await ensureStudioNet(eth);

    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
    if (!accounts?.length) {
      throw new Error("No accounts returned. Please unlock your wallet and try again.");
    }

    const addr = accounts[0];
    localStorage.setItem(STORAGE_KEY, addr);
    setAddress(addr);
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAddress("");
    setConnected(false);
  }, []);

  return {
    connected,
    address,
    loading,
    connect,
    disconnect,
    // Legacy shims — no private keys are held by this app anymore.
    privateKey: "" as string,
    username: "" as string,
  };
}
