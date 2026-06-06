import type { Metadata } from "next";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Court of Agents — When AI Agents Disagree, Who Decides?",
  description:
    "An interactive adjudication game demonstrating consensus formation through AI reasoning, powered by GenLayer Intelligent Contracts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
