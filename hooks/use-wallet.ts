"use client";

import { useState, useEffect, useCallback } from "react";
import {
  saveWallet,
  getWallet,
  deleteWallet,
  setActiveSession,
  getActiveSession,
  clearActiveSession,
  encryptPrivateKey,
  decryptPrivateKey,
  type StoredWallet,
} from "@/lib/wallet-store";

interface WalletState {
  address: string;
  privateKey: string;
  username: string;
  connected: boolean;
}

// Default passphrase — in production, prompt user for a PIN/password
const DEVICE_PASSPHRASE = "court-of-agents-device-key";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(true);

  // On app load: check for active session, restore wallet from IndexedDB + Supabase
  useEffect(() => {
    async function restore() {
      try {
        const activeAddress = await getActiveSession();
        if (!activeAddress) {
          setLoading(false);
          return;
        }

        // Load encrypted wallet from IndexedDB
        const stored = await getWallet(activeAddress);
        if (!stored) {
          await clearActiveSession();
          setLoading(false);
          return;
        }

        // Decrypt private key
        const privateKey = await decryptPrivateKey(
          stored.encryptedPrivateKey,
          stored.iv,
          stored.salt,
          DEVICE_PASSPHRASE
        );

        let username = stored.username;

        // Sync username from Supabase (source of truth for display name)
        try {
          const res = await fetch(
            `/api/wallet-profiles?address=${encodeURIComponent(activeAddress)}`
          );
          const data = await res.json();
          if (data.profile?.username) {
            username = data.profile.username;
            // Update local cache if Supabase has a different username
            if (username !== stored.username) {
              await saveWallet({ ...stored, username });
            }
          }
        } catch {
          // Offline — use local username
        }

        setWallet({
          address: stored.address,
          privateKey,
          username,
          connected: true,
        });
      } catch {
        await clearActiveSession();
      } finally {
        setLoading(false);
      }
    }

    restore();
  }, []);

  /**
   * Create a new wallet — called during registration.
   * Encrypts private key and stores in IndexedDB.
   * Creates profile in Supabase.
   */
  const createWallet = useCallback(
    async (address: string, privateKey: string, username: string) => {
      const normalizedAddress = address.toLowerCase();

      // Encrypt private key for IndexedDB storage
      const { encrypted, iv, salt } = await encryptPrivateKey(
        privateKey,
        DEVICE_PASSPHRASE
      );

      // Save to IndexedDB
      await saveWallet({
        address: normalizedAddress,
        encryptedPrivateKey: encrypted,
        iv,
        salt,
        username,
        createdAt: new Date().toISOString(),
      });

      // Set active session
      await setActiveSession(normalizedAddress);

      // Create Supabase profile
      try {
        await fetch("/api/wallet-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: normalizedAddress, username }),
        });
      } catch {
        // Non-blocking — profile will be created on next sync
      }

      setWallet({
        address: normalizedAddress,
        privateKey,
        username,
        connected: true,
      });
    },
    []
  );

  /**
   * Import an existing wallet via private key.
   * Checks Supabase for existing profile, prompts for username if not found.
   * Returns { address, username, isNewProfile } for the UI to handle.
   */
  const importWallet = useCallback(
    async (
      privateKey: string,
      address: string,
      fallbackUsername?: string
    ): Promise<{ address: string; username: string; isNewProfile: boolean }> => {
      const normalizedAddress = address.toLowerCase();

      // Check Supabase for existing profile
      let username = "";
      let isNewProfile = true;

      try {
        const res = await fetch(
          `/api/wallet-profiles?address=${encodeURIComponent(normalizedAddress)}`
        );
        const data = await res.json();
        if (data.profile?.username) {
          username = data.profile.username;
          isNewProfile = false;
        }
      } catch {
        // Offline
      }

      // Also check local IndexedDB
      if (!username) {
        const localWallet = await getWallet(normalizedAddress);
        if (localWallet?.username) {
          username = localWallet.username;
          isNewProfile = false;
        }
      }

      // Use fallback username if provided and no profile found
      if (!username && fallbackUsername) {
        username = fallbackUsername;
      }

      // Encrypt and save locally
      const { encrypted, iv, salt } = await encryptPrivateKey(
        privateKey,
        DEVICE_PASSPHRASE
      );

      await saveWallet({
        address: normalizedAddress,
        encryptedPrivateKey: encrypted,
        iv,
        salt,
        username,
        createdAt: new Date().toISOString(),
      });

      await setActiveSession(normalizedAddress);

      // Create/update Supabase profile if we have a username
      if (username) {
        try {
          await fetch("/api/wallet-profiles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: normalizedAddress, username }),
          });
        } catch {}
      }

      setWallet({
        address: normalizedAddress,
        privateKey,
        username,
        connected: true,
      });

      return { address: normalizedAddress, username, isNewProfile };
    },
    []
  );

  /**
   * Update username (syncs to both IndexedDB and Supabase)
   */
  const updateUsername = useCallback(
    async (newUsername: string) => {
      if (!wallet) return;

      const stored = await getWallet(wallet.address);
      if (stored) {
        await saveWallet({ ...stored, username: newUsername });
      }

      try {
        await fetch("/api/wallet-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: wallet.address, username: newUsername }),
        });
      } catch {}

      setWallet((prev) => (prev ? { ...prev, username: newUsername } : null));
    },
    [wallet]
  );

  /**
   * Disconnect — clears active session only.
   * Does NOT delete IndexedDB wallet data.
   */
  const disconnect = useCallback(async () => {
    await clearActiveSession();
    setWallet(null);
  }, []);

  /**
   * Delete wallet from device — destructive action.
   * Removes encrypted private key from IndexedDB.
   * Does NOT delete Supabase profile.
   */
  const deleteWalletFromDevice = useCallback(async () => {
    if (!wallet) return;
    await deleteWallet(wallet.address);
    await clearActiveSession();
    setWallet(null);
  }, [wallet]);

  /**
   * Get the decrypted private key for export.
   * Should only be called after explicit user confirmation.
   */
  const exportPrivateKey = useCallback(async (): Promise<string | null> => {
    if (!wallet) return null;
    const stored = await getWallet(wallet.address);
    if (!stored) return null;
    try {
      return await decryptPrivateKey(
        stored.encryptedPrivateKey,
        stored.iv,
        stored.salt,
        DEVICE_PASSPHRASE
      );
    } catch {
      return null;
    }
  }, [wallet]);

  return {
    wallet,
    loading,
    connected: !!wallet?.connected,
    address: wallet?.address || "",
    privateKey: wallet?.privateKey || "",
    username: wallet?.username || "",
    createWallet,
    importWallet,
    updateUsername,
    disconnect,
    deleteWalletFromDevice,
    exportPrivateKey,
  };
}
