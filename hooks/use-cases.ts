"use client";

import { useState, useEffect } from "react";
import type { Case } from "@/types/cases";

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch("/api/cases");
        if (!res.ok) throw new Error("Failed to fetch cases");
        const data = await res.json();
        setCases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  return { cases, loading, error };
}
