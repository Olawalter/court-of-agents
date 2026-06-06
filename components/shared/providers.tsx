"use client";

import { type ReactNode } from "react";
import { ErrorBoundary } from "./error-boundary";

export function Providers({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
