"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusVariants: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  pending: "default",
  in_review: "info",
  deliberating: "warning",
  consensus_reached: "success",
  appealed: "danger",
  finalized: "success",
};

const categoryLabels: Record<string, string> = {
  commerce: "Commerce",
  service: "Service",
  prediction_market: "Prediction Market",
  dao_governance: "DAO Governance",
  agent_agreement: "Agent Agreement",
  contract_interpretation: "Contract Interpretation",
};

const difficultyStars = (d: number) => "★".repeat(d) + "☆".repeat(5 - d);

interface CaseCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  difficulty: number;
  created_at: string | null;
  index: number;
}

export function AnimatedCaseCard({
  id, title, description, category, status, difficulty, created_at, index,
}: CaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link href={`/cases/${id}`} aria-label={`View case: ${title}, status ${status.replace(/_/g, " ")}`}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.995 }}>
          <Card hover className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
                <Badge variant={statusVariants[status] || "default"}>
                  <span className="sr-only">Status: </span>
                  {status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{description}</p>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5">
                  {categoryLabels[category] || category}
                </span>
                <span role="img" aria-label={`Difficulty: ${difficulty} of 5`}>
                  {difficultyStars(difficulty)}
                </span>
                <span>
                  {created_at
                    ? new Date(created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
            <div aria-hidden="true" className="ml-4 text-sm text-brand-600 font-medium whitespace-nowrap">View →</div>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );
}
