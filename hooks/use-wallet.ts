"use client";

import { useState, useEffect, useCallback } from "react";

// GenLayer StudioNet chain params for wallet_addEthereumChain
const STUDIONET_CHAIN_ID_HEX = `0x${(61999).toString(16)}`; // 0xf22f
const STUDIONET_CHAIN_PARAMS = {
  chainId: STUDIONET_CHAIN_ID_HEX,
  chainName: "GenLayer StudioNet",
  rpcUrls: [process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api"],
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  blockExplorerUrls: ["https://studio.genlayer.com"],
};

export function useWallet() {
  const [address, setAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        if (typeof window === "undefined" || !window.ethereum) {
          setLoading(false);
          return;
        }
        // eth_accounts returns already-approved accounts without a popup
        const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts?.length > 0) {
          setAddress(accounts[0]);
          setConnected(true);
        }
      } catch {
        // wallet not available or locked
      } finally {
        setLoading(false);
      }
    }
    restore();

    const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
    if (!eth) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress("");
        setConnected(false);
      } else {
        setAddress(accounts[0]);
        setConnected(true);
      }
    };
    eth.on?.("accountsChanged", handleAccountsChanged);
    return () => eth.removeListener?.("accountsChanged", handleAccountsChanged);
  }, []);

  /**
   * Connect MetaMask / Rabby.
   * Adds StudioNet to the wallet (no-op if already added), switches to it,
   * then requests the user's accounts.
   */
  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      throw new Error(
        "No wallet detected. Please install MetaMask or Rabby and refresh."
      );
    }

    // Add StudioNet — wallets silently skip this if the chain is already known
    try {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [STUDIONET_CHAIN_PARAMS],
      });
    } catch {
      // Already added or user dismissed — continue
    }

    // Switch to StudioNet
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
      });
    } catch {
      // Some wallets reject this when already on the chain — continue
    }

    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
    if (!accounts?.length) {
      throw new Error("No accounts returned. Please unlock your wallet and try again.");
    }
    setAddress(accounts[0]);
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    setAddress("");
    setConnected(false);
  }, []);

  return {
    connected,
    address,
    loading,
    connect,
    disconnect,
    // Legacy shims — kept so existing call-sites don't crash during the
    // transition; they are empty strings since we no longer hold private keys.
    privateKey: "" as string,
    username: "" as string,
  };
}
