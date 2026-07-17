"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Wallet creation is no longer done in-app — users bring their own
// MetaMask / Rabby wallet. Redirect straight to the connect page.
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
