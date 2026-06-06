"use client";

import { useState, useEffect } from "react";
import type { UserReputation } from "@/types/reputation";
import { useAuth } from "./use-auth";

export function useReputation() {
  const { user } = useAuth();
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setReputation(null);
      setLoading(false);
      return;
    }

    async function fetchReputation() {
      try {
        const res = await fetch("/api/reputation");
        if (!res.ok) throw new Error("Failed to fetch reputation");
        const data = await res.json();
        setReputation(data);
      } catch {
        setReputation(null);
      } finally {
        setLoading(false);
      }
    }
    fetchReputation();
  }, [user]);

  return { reputation, loading };
}
