"""
Court of Agents - Phase 1 Scaffold Generator
Generates the complete project structure and all initial files.
Run: python scripts/phase1_scaffold.py
"""

import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def write_file(relative_path: str, content: str):
    full_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Created: {relative_path}")

def main():
    print("=" * 60)
    print("  Court of Agents - Phase 1 Scaffold Generator")
    print("=" * 60)
    print()

    # ─── Empty directories (with .gitkeep) ───
    empty_dirs = [
        "features/cases/components",
        "features/cases/hooks",
        "features/cases/services",
        "features/agents/components",
        "features/agents/hooks",
        "features/agents/services",
        "features/consensus/components",
        "features/consensus/hooks",
        "features/consensus/services",
        "features/reputation/components",
        "features/reputation/hooks",
        "features/reputation/services",
        "features/contracts/components",
        "features/contracts/hooks",
        "features/contracts/services",
        "tests/unit",
        "tests/integration",
        "tests/e2e",
        "docs",
        "analytics",
        "monitoring",
        "deployment",
    ]
    for d in empty_dirs:
        write_file(os.path.join(d, ".gitkeep"), "")

    # ─── .gitignore ───
    write_file(".gitignore", """# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# python
__pycache__/
*.pyc
.venv/
""")

    # ─── .env.example ───
    write_file(".env.example", """# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# GenLayer
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studionet.genlayer.com/api
GENLAYER_PRIVATE_KEY=your-genlayer-private-key

# GenLayer Contract Addresses (filled after deployment)
NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS=
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS=
NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
""")

    # ─── .env.local (copy of example for local dev) ───
    write_file(".env.local", """# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# GenLayer
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studionet.genlayer.com/api
GENLAYER_PRIVATE_KEY=

# GenLayer Contract Addresses (filled after deployment)
NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS=
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS=
NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
""")

    # ─── package.json ───
    write_file("package.json", """{
  "name": "court-of-agents",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/ssr": "^0.5.2",
    "genlayer-js": "^0.6.0",
    "openai": "^4.73.0",
    "@anthropic-ai/sdk": "^0.32.0",
    "framer-motion": "^11.12.0",
    "@xyflow/react": "^12.3.0",
    "d3": "^7.9.0",
    "zod": "^3.23.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.460.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/d3": "^7.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.1.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "ts-jest": "^29.2.0",
    "@playwright/test": "^1.49.0"
  }
}
""")

    # ─── tsconfig.json ───
    write_file("tsconfig.json", """{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "intelligent-contracts"]
}
""")

    # ─── next.config.ts ───
    write_file("next.config.ts", """import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
""")

    # ─── tailwind.config.ts ───
    write_file("tailwind.config.ts", """import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          200: "#bac8ff",
          300: "#91a7ff",
          400: "#748ffc",
          500: "#5c7cfa",
          600: "#4c6ef5",
          700: "#4263eb",
          800: "#3b5bdb",
          900: "#364fc7",
          950: "#1e3a8a",
        },
        surface: {
          0: "#ffffff",
          1: "#f8f9fa",
          2: "#f1f3f5",
          3: "#e9ecef",
        },
        neutral: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#868e96",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
""")

    # ─── postcss.config.js ───
    write_file("postcss.config.js", """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
""")

    # ─── middleware.ts (root - Supabase auth + rate limit) ───
    write_file("middleware.ts", """import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Supabase auth middleware will be added in Phase 5
  // Rate limiting middleware will be added in Phase 14
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
""")

    # ═══════════════════════════════════════════════════════
    #  TYPES
    # ═══════════════════════════════════════════════════════

    write_file("types/index.ts", """export * from "./cases";
export * from "./agents";
export * from "./consensus";
export * from "./reputation";
export * from "./contracts";
export * from "./database";
""")

    write_file("types/cases.ts", """export type CaseCategory =
  | "commerce"
  | "service"
  | "prediction_market"
  | "dao_governance"
  | "agent_agreement"
  | "contract_interpretation";

export type CaseStatus =
  | "pending"
  | "in_review"
  | "deliberating"
  | "consensus_reached"
  | "appealed"
  | "finalized";

export interface Evidence {
  id: string;
  case_id: string;
  title: string;
  description: string;
  type: "document" | "transaction" | "communication" | "testimony" | "data";
  content: string;
  submitted_by: "agent_a" | "agent_b" | "system";
  credibility_score: number;
  created_at: string;
}

export interface CaseClaim {
  agent_id: string;
  agent_name: string;
  summary: string;
  detailed_argument: string;
  requested_outcome: string;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  category: CaseCategory;
  status: CaseStatus;
  difficulty: 1 | 2 | 3 | 4 | 5;
  claim_a: CaseClaim;
  claim_b: CaseClaim;
  evidence: Evidence[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  consensus_id: string | null;
  onchain_tx_hash: string | null;
}
""")

    write_file("types/agents.ts", """export type JudgePersona =
  | "commerce"
  | "consumer"
  | "contract"
  | "neutral"
  | "risk"
  | "genlayer";

export type AIProvider = "openai" | "anthropic" | "genlayer";

export interface JudgeConfig {
  persona: JudgePersona;
  display_name: string;
  description: string;
  system_prompt: string;
  provider: AIProvider;
  model: string;
  temperature: number;
  icon: string;
}

export interface JudgeVerdict {
  id: string;
  case_id: string;
  judge_persona: JudgePersona;
  provider: AIProvider;
  verdict: "favor_a" | "favor_b" | "partial_a" | "partial_b" | "dismiss";
  confidence: number;
  reasoning: string;
  key_factors: string[];
  dissenting_points: string[];
  created_at: string;
}
""")

    write_file("types/consensus.ts", """export type ConsensusMethod = "weighted_majority" | "supermajority" | "unanimous";

export interface ConsensusInput {
  case_id: string;
  verdicts: import("./agents").JudgeVerdict[];
}

export interface ConsensusResult {
  id: string;
  case_id: string;
  method: ConsensusMethod;
  final_verdict: "favor_a" | "favor_b" | "partial_a" | "partial_b" | "dismiss";
  overall_confidence: number;
  agreement_ratio: number;
  majority_reasoning: string;
  dissenting_summary: string;
  resolution_explanation: string;
  participating_judges: import("./agents").JudgePersona[];
  verdict_breakdown: Record<string, number>;
  created_at: string;
  finalized_at: string | null;
  onchain_tx_hash: string | null;
}

export interface ConsensusGraphNode {
  id: string;
  type: "judge" | "verdict" | "consensus";
  label: string;
  data: Record<string, unknown>;
}

export interface ConsensusGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}
""")

    write_file("types/reputation.ts", """export type ReputationRank =
  | "novice_arbiter"
  | "trusted_judge"
  | "consensus_architect"
  | "master_adjudicator"
  | "grand_adjudicator";

export interface ReputationThreshold {
  rank: ReputationRank;
  display_name: string;
  min_score: number;
  min_cases: number;
  min_accuracy: number;
}

export interface UserReputation {
  user_id: string;
  rank: ReputationRank;
  score: number;
  total_cases: number;
  correct_decisions: number;
  accuracy: number;
  streak: number;
  best_streak: number;
  participation_rate: number;
  consistency_score: number;
  onchain_score: number | null;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  rank: ReputationRank;
  score: number;
  accuracy: number;
  total_cases: number;
  position: number;
}
""")

    write_file("types/contracts.ts", """export interface GenLayerContractConfig {
  address: string;
  rpc_url: string;
}

export interface ContractDeployment {
  contract_name: string;
  address: string;
  deployed_at: string;
  network: "localnet" | "studionet";
  tx_hash: string;
}

export interface AdjudicatorContractState {
  total_disputes: number;
  active_disputes: number;
  resolved_disputes: number;
}

export interface DisputeOnChain {
  dispute_id: string;
  claim_a_hash: string;
  claim_b_hash: string;
  verdict: string;
  confidence: number;
  reasoning_hash: string;
  resolved: boolean;
  timestamp: number;
}

export interface ReputationOnChain {
  user_address: string;
  score: number;
  total_cases: number;
  accuracy_bps: number;
  rank: string;
  last_updated: number;
}
""")

    write_file("types/database.ts", """export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      cases: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          status: string;
          difficulty: number;
          claim_a: Record<string, unknown>;
          claim_b: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          consensus_id: string | null;
          onchain_tx_hash: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["cases"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
      };
      evidence: {
        Row: {
          id: string;
          case_id: string;
          title: string;
          description: string;
          type: string;
          content: string;
          submitted_by: string;
          credibility_score: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["evidence"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["evidence"]["Insert"]>;
      };
      verdicts: {
        Row: {
          id: string;
          case_id: string;
          judge_persona: string;
          provider: string;
          verdict: string;
          confidence: number;
          reasoning: string;
          key_factors: string[];
          dissenting_points: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["verdicts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["verdicts"]["Insert"]>;
      };
      consensus_results: {
        Row: {
          id: string;
          case_id: string;
          method: string;
          final_verdict: string;
          overall_confidence: number;
          agreement_ratio: number;
          majority_reasoning: string;
          dissenting_summary: string;
          resolution_explanation: string;
          participating_judges: string[];
          verdict_breakdown: Record<string, number>;
          created_at: string;
          finalized_at: string | null;
          onchain_tx_hash: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["consensus_results"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["consensus_results"]["Insert"]>;
      };
      user_reputation: {
        Row: {
          user_id: string;
          rank: string;
          score: number;
          total_cases: number;
          correct_decisions: number;
          accuracy: number;
          streak: number;
          best_streak: number;
          participation_rate: number;
          consistency_score: number;
          onchain_score: number | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_reputation"]["Row"], "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_reputation"]["Insert"]>;
      };
      user_decisions: {
        Row: {
          id: string;
          user_id: string;
          case_id: string;
          decision: string;
          reasoning: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_decisions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["user_decisions"]["Insert"]>;
      };
    };
  };
}
""")

    # ═══════════════════════════════════════════════════════
    #  FEATURE TYPES (per-feature barrel exports)
    # ═══════════════════════════════════════════════════════

    for feature in ["cases", "agents", "consensus", "reputation", "contracts"]:
        write_file(f"features/{feature}/types.ts", f'export * from "@/types/{feature}";\n')

    # ═══════════════════════════════════════════════════════
    #  LIB
    # ═══════════════════════════════════════════════════════

    write_file("lib/constants.ts", """export const SITE_NAME = "Court of Agents";
export const SITE_DESCRIPTION =
  "When AI agents disagree, who decides? An interactive adjudication game powered by GenLayer.";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const CASE_CATEGORIES = [
  { value: "commerce", label: "Commerce Dispute" },
  { value: "service", label: "Service Dispute" },
  { value: "prediction_market", label: "Prediction Market" },
  { value: "dao_governance", label: "DAO Governance" },
  { value: "agent_agreement", label: "Agent Agreement" },
  { value: "contract_interpretation", label: "Contract Interpretation" },
] as const;

export const REPUTATION_THRESHOLDS = [
  { rank: "novice_arbiter", display_name: "Novice Arbiter", min_score: 0, min_cases: 0, min_accuracy: 0 },
  { rank: "trusted_judge", display_name: "Trusted Judge", min_score: 100, min_cases: 5, min_accuracy: 0.5 },
  { rank: "consensus_architect", display_name: "Consensus Architect", min_score: 500, min_cases: 20, min_accuracy: 0.65 },
  { rank: "master_adjudicator", display_name: "Master Adjudicator", min_score: 1500, min_cases: 50, min_accuracy: 0.75 },
  { rank: "grand_adjudicator", display_name: "Grand Adjudicator", min_score: 5000, min_cases: 100, min_accuracy: 0.85 },
] as const;

export const JUDGE_PERSONAS = [
  "commerce",
  "consumer",
  "contract",
  "neutral",
  "risk",
  "genlayer",
] as const;
""")

    write_file("lib/utils.ts", """import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function percentageToColor(value: number): string {
  if (value >= 80) return "text-green-600";
  if (value >= 60) return "text-yellow-600";
  if (value >= 40) return "text-orange-600";
  return "text-red-600";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
""")

    write_file("lib/validators.ts", """import { z } from "zod";

export const userDecisionSchema = z.object({
  case_id: z.string().uuid(),
  decision: z.enum(["favor_a", "favor_b", "partial_a", "partial_b", "dismiss"]),
  reasoning: z.string().min(10).max(2000),
});

export const createCaseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum([
    "commerce",
    "service",
    "prediction_market",
    "dao_governance",
    "agent_agreement",
    "contract_interpretation",
  ]),
  difficulty: z.number().int().min(1).max(5),
  claim_a: z.object({
    agent_name: z.string(),
    summary: z.string(),
    detailed_argument: z.string(),
    requested_outcome: z.string(),
  }),
  claim_b: z.object({
    agent_name: z.string(),
    summary: z.string(),
    detailed_argument: z.string(),
    requested_outcome: z.string(),
  }),
});

export type UserDecisionInput = z.infer<typeof userDecisionSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
""")

    # ═══════════════════════════════════════════════════════
    #  CONFIG
    # ═══════════════════════════════════════════════════════

    write_file("config/site.ts", """export const siteConfig = {
  name: "Court of Agents",
  tagline: "When AI agents disagree, who decides?",
  description:
    "An interactive adjudication game demonstrating consensus formation through AI reasoning, powered by GenLayer Intelligent Contracts.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  links: {
    genlayer: "https://www.genlayer.com",
    docs: "https://docs.genlayer.com",
    studionet: "https://studionet.genlayer.com",
  },
};
""")

    write_file("config/judges.ts", """import type { JudgeConfig } from "@/types/agents";

export const judgeConfigs: JudgeConfig[] = [
  {
    persona: "commerce",
    display_name: "Commerce Judge",
    description: "Specializes in trade disputes, market practices, and commercial law.",
    system_prompt: `You are the Commerce Judge in the Court of Agents. You specialize in trade disputes, market practices, and commercial agreements. You prioritize fair market practices, contractual obligations, and commercial precedent. Analyze the evidence objectively. Return your verdict as JSON with fields: verdict (favor_a|favor_b|partial_a|partial_b|dismiss), confidence (0-100), reasoning (string), key_factors (string[]), dissenting_points (string[]).`,
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.3,
    icon: "scale",
  },
  {
    persona: "consumer",
    display_name: "Consumer Judge",
    description: "Advocates for consumer rights and protection standards.",
    system_prompt: `You are the Consumer Judge in the Court of Agents. You advocate for consumer protection, fair dealing, and equitable outcomes for end users. You weigh power imbalances and information asymmetry. Analyze the evidence objectively. Return your verdict as JSON with fields: verdict (favor_a|favor_b|partial_a|partial_b|dismiss), confidence (0-100), reasoning (string), key_factors (string[]), dissenting_points (string[]).`,
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.3,
    icon: "shield",
  },
  {
    persona: "contract",
    display_name: "Contract Judge",
    description: "Focuses on contractual terms, obligations, and legal interpretation.",
    system_prompt: `You are the Contract Judge in the Court of Agents. You focus strictly on contractual terms, written agreements, and the letter of the law. You prioritize what was agreed upon in writing. Analyze the evidence objectively. Return your verdict as JSON with fields: verdict (favor_a|favor_b|partial_a|partial_b|dismiss), confidence (0-100), reasoning (string), key_factors (string[]), dissenting_points (string[]).`,
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    temperature: 0.2,
    icon: "file-text",
  },
  {
    persona: "neutral",
    display_name: "Neutral Judge",
    description: "Provides balanced, impartial analysis without domain bias.",
    system_prompt: `You are the Neutral Judge in the Court of Agents. You provide the most balanced, impartial analysis possible. You have no domain bias and weigh all evidence equally. Analyze the evidence objectively. Return your verdict as JSON with fields: verdict (favor_a|favor_b|partial_a|partial_b|dismiss), confidence (0-100), reasoning (string), key_factors (string[]), dissenting_points (string[]).`,
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    temperature: 0.5,
    icon: "balance",
  },
  {
    persona: "risk",
    display_name: "Risk Judge",
    description: "Evaluates risk, liability, and potential consequences of each outcome.",
    system_prompt: `You are the Risk Judge in the Court of Agents. You evaluate risk exposure, liability, precedent-setting danger, and downstream consequences of each possible outcome. You favor the least risky resolution. Analyze the evidence objectively. Return your verdict as JSON with fields: verdict (favor_a|favor_b|partial_a|partial_b|dismiss), confidence (0-100), reasoning (string), key_factors (string[]), dissenting_points (string[]).`,
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.3,
    icon: "alert-triangle",
  },
  {
    persona: "genlayer",
    display_name: "GenLayer Judge",
    description: "Uses GenLayer LLM consensus to produce a decentralized verdict.",
    system_prompt: `Evaluate this dispute. Consider both claims and all evidence. Determine which party has the stronger case. Return your verdict as: FAVOR_A, FAVOR_B, PARTIAL_A, PARTIAL_B, or DISMISS. Then provide confidence as a number 0-100. Then provide your reasoning.`,
    provider: "genlayer",
    model: "genlayer",
    temperature: 0.3,
    icon: "cpu",
  },
];
""")

    # ═══════════════════════════════════════════════════════
    #  SERVICES
    # ═══════════════════════════════════════════════════════

    write_file("services/supabase/client.ts", """import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
""")

    write_file("services/supabase/server.ts", """import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
""")

    write_file("services/supabase/middleware.ts", """import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
""")

    write_file("services/ai/openai.ts", """import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIJudgeRequest {
  system_prompt: string;
  case_description: string;
  claim_a: string;
  claim_b: string;
  evidence: string;
  model?: string;
  temperature?: number;
}

export async function getOpenAIVerdict(request: AIJudgeRequest) {
  const response = await openai.chat.completions.create({
    model: request.model || "gpt-4o",
    temperature: request.temperature ?? 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: request.system_prompt },
      {
        role: "user",
        content: `## Case\\n${request.case_description}\\n\\n## Claim A\\n${request.claim_a}\\n\\n## Claim B\\n${request.claim_b}\\n\\n## Evidence\\n${request.evidence}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  return JSON.parse(content);
}
""")

    write_file("services/ai/claude.ts", """import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIJudgeRequest {
  system_prompt: string;
  case_description: string;
  claim_a: string;
  claim_b: string;
  evidence: string;
  model?: string;
  temperature?: number;
}

export async function getClaudeVerdict(request: AIJudgeRequest) {
  const response = await anthropic.messages.create({
    model: request.model || "claude-sonnet-4-20250514",
    max_tokens: 2048,
    temperature: request.temperature ?? 0.3,
    system: request.system_prompt,
    messages: [
      {
        role: "user",
        content: `## Case\\n${request.case_description}\\n\\n## Claim A\\n${request.claim_a}\\n\\n## Claim B\\n${request.claim_b}\\n\\n## Evidence\\n${request.evidence}\\n\\nReturn your verdict as JSON with fields: verdict, confidence, reasoning, key_factors, dissenting_points.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No response from Claude");

  const jsonMatch = textBlock.text.match(/\\{[\\s\\S]*\\}/);
  if (!jsonMatch) throw new Error("Could not parse Claude response as JSON");
  return JSON.parse(jsonMatch[0]);
}
""")

    write_file("services/ai/judge-engine.ts", """import type { JudgeConfig, JudgeVerdict } from "@/types/agents";
import type { Case } from "@/types/cases";
import { getOpenAIVerdict } from "./openai";
import { getClaudeVerdict } from "./claude";
import { v4 as uuidv4 } from "crypto";

function formatEvidence(evidence: Case["evidence"]): string {
  return evidence
    .map(
      (e, i) =>
        \`Evidence \${i + 1}: [\${e.type}] \${e.title}\\n\${e.description}\\nContent: \${e.content}\\nCredibility: \${e.credibility_score}/100\`
    )
    .join("\\n\\n");
}

export async function getJudgeVerdict(
  judge: JudgeConfig,
  caseData: Case
): Promise<JudgeVerdict> {
  const request = {
    system_prompt: judge.system_prompt,
    case_description: \`\${caseData.title}\\n\${caseData.description}\`,
    claim_a: \`\${caseData.claim_a.agent_name}: \${caseData.claim_a.summary}\\n\${caseData.claim_a.detailed_argument}\`,
    claim_b: \`\${caseData.claim_b.agent_name}: \${caseData.claim_b.summary}\\n\${caseData.claim_b.detailed_argument}\`,
    evidence: formatEvidence(caseData.evidence),
    model: judge.model,
    temperature: judge.temperature,
  };

  let result: Record<string, unknown>;

  if (judge.provider === "openai") {
    result = await getOpenAIVerdict(request);
  } else if (judge.provider === "anthropic") {
    result = await getClaudeVerdict(request);
  } else {
    // GenLayer provider - will be implemented in Phase 9
    throw new Error("GenLayer judge not yet implemented");
  }

  return {
    id: crypto.randomUUID(),
    case_id: caseData.id,
    judge_persona: judge.persona,
    provider: judge.provider,
    verdict: result.verdict as JudgeVerdict["verdict"],
    confidence: Number(result.confidence),
    reasoning: String(result.reasoning),
    key_factors: (result.key_factors as string[]) || [],
    dissenting_points: (result.dissenting_points as string[]) || [],
    created_at: new Date().toISOString(),
  };
}
""")

    write_file("services/genlayer/client.ts", """import { createClient, createAccount } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";

export function getGenLayerClient() {
  const account = createAccount();
  const client = createClient({
    chain: testnetAsimov,
    account,
  });
  return { client, account };
}

export const CONTRACT_ADDRESSES = {
  adjudicator: process.env.NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS || "",
  reputation: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS || "",
  disputeRegistry: process.env.NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS || "",
};
""")

    # ═══════════════════════════════════════════════════════
    #  HOOKS
    # ═══════════════════════════════════════════════════════

    write_file("hooks/use-auth.ts", """"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/services/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
""")

    write_file("hooks/use-cases.ts", """"use client";

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
""")

    write_file("hooks/use-reputation.ts", """"use client";

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
""")

    # ═══════════════════════════════════════════════════════
    #  MIDDLEWARE
    # ═══════════════════════════════════════════════════════

    write_file("middleware/rate-limit.ts", """const rateLimit = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimit.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}
""")

    # ═══════════════════════════════════════════════════════
    #  COMPONENTS — UI
    # ═══════════════════════════════════════════════════════

    write_file("components/ui/button.tsx", """"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-brand-600 text-white hover:bg-brand-700 shadow-sm": variant === "primary",
            "bg-surface-2 text-neutral-800 hover:bg-surface-3 border border-neutral-200": variant === "secondary",
            "text-neutral-700 hover:bg-surface-2": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
""")

    write_file("components/ui/card.tsx", """import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-6 shadow-sm",
        hover && "transition-shadow hover:shadow-md cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-neutral-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-neutral-600", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}
""")

    write_file("components/ui/badge.tsx", """import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-neutral-100 text-neutral-700": variant === "default",
          "bg-green-50 text-green-700": variant === "success",
          "bg-yellow-50 text-yellow-700": variant === "warning",
          "bg-red-50 text-red-700": variant === "danger",
          "bg-blue-50 text-blue-700": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}
""")

    write_file("components/ui/input.tsx", """import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
""")

    write_file("components/ui/modal.tsx", """"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-fade-in",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
""")

    write_file("components/ui/loading.tsx", """import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ className, size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-brand-600 border-t-transparent",
          sizeClasses[size]
        )}
      />
    </div>
  );
}
""")

    # ═══════════════════════════════════════════════════════
    #  COMPONENTS — LAYOUT
    # ═══════════════════════════════════════════════════════

    write_file("components/layout/header.tsx", """"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-sm font-bold text-white">CA</span>
          </div>
          <span className="text-lg font-semibold text-neutral-900">
            Court of Agents
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/cases"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cases
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Leaderboard
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />
          ) : user ? (
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700"
            >
              {user.email?.charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
""")

    write_file("components/layout/sidebar.tsx", """"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Cases", href: "/cases" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Profile", href: "/profile" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r border-neutral-200 bg-surface-1 lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-brand-50 text-brand-700"
                : "text-neutral-600 hover:bg-surface-2 hover:text-neutral-900"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
""")

    write_file("components/layout/footer.tsx", """import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-surface-1">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <p className="text-sm text-neutral-500">
          Court of Agents &mdash; Powered by{" "}
          <Link
            href="https://www.genlayer.com"
            target="_blank"
            className="text-brand-600 hover:underline"
          >
            GenLayer
          </Link>
        </p>
        <div className="flex gap-4">
          <Link
            href="https://docs.genlayer.com"
            target="_blank"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Docs
          </Link>
          <Link
            href="https://studionet.genlayer.com"
            target="_blank"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            StudioNet
          </Link>
        </div>
      </div>
    </footer>
  );
}
""")

    # ═══════════════════════════════════════════════════════
    #  COMPONENTS — SHARED
    # ═══════════════════════════════════════════════════════

    write_file("components/shared/error-boundary.tsx", """"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            <h2 className="text-lg font-semibold text-neutral-900">
              Something went wrong
            </h2>
            <p className="text-sm text-neutral-600">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button
              variant="secondary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
""")

    write_file("components/shared/providers.tsx", """"use client";

import { type ReactNode } from "react";
import { ErrorBoundary } from "./error-boundary";

export function Providers({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
""")

    # ═══════════════════════════════════════════════════════
    #  APP — ROOT
    # ═══════════════════════════════════════════════════════

    write_file("app/globals.css", """@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap");

@layer base {
  html {
    font-family: "Inter", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-white text-neutral-900;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
""")

    write_file("app/layout.tsx", """import type { Metadata } from "next";
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
""")

    write_file("app/page.tsx", """import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            Powered by GenLayer Intelligent Contracts
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            When AI Agents Disagree,{" "}
            <span className="text-brand-600">Who Decides?</span>
          </h1>
          <p className="mb-10 text-lg text-neutral-600 text-balance">
            Resolve disputes between AI agents. Watch multiple AI judges
            deliberate with different perspectives. See how consensus emerges
            from conflicting reasoning &mdash; all secured on-chain.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-base font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Enter the Court
            </Link>
            <Link
              href="https://docs.genlayer.com"
              target="_blank"
              className="inline-flex h-12 items-center rounded-lg border border-neutral-300 bg-white px-6 text-base font-medium text-neutral-700 hover:bg-surface-1 transition-colors"
            >
              Learn About GenLayer
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-200 bg-surface-1 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Review the Case",
                desc: "Examine evidence, claims, and supporting documents from both AI agents in a dispute.",
              },
              {
                title: "Watch AI Judges Deliberate",
                desc: "Six specialized AI judges analyze the case from different perspectives and produce verdicts.",
              },
              {
                title: "Consensus Emerges",
                desc: "See how GenLayer\\'s consensus mechanism resolves conflicting AI opinions into a final ruling.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-neutral-200 bg-white p-6"
              >
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-sm text-neutral-500">
            Court of Agents &mdash; Built on GenLayer
          </p>
          <a
            href="https://www.genlayer.com"
            target="_blank"
            className="text-sm text-brand-600 hover:underline"
          >
            genlayer.com
          </a>
        </div>
      </footer>
    </main>
  );
}
""")

    # ═══════════════════════════════════════════════════════
    #  APP — PAGES
    # ═══════════════════════════════════════════════════════

    write_file("app/(auth)/login/page.tsx", """export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Sign in</h1>
        <p className="mb-8 text-sm text-neutral-600">
          Enter the Court of Agents
        </p>
        {/* Auth form will be implemented in Phase 5 */}
        <p className="text-sm text-neutral-400">Authentication coming in Phase 5</p>
      </div>
    </main>
  );
}
""")

    write_file("app/(auth)/register/page.tsx", """export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Create account</h1>
        <p className="mb-8 text-sm text-neutral-600">
          Join the Court of Agents
        </p>
        {/* Registration form will be implemented in Phase 5 */}
        <p className="text-sm text-neutral-400">Registration coming in Phase 5</p>
      </div>
    </main>
  );
}
""")

    write_file("app/dashboard/layout.tsx", """import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
""")

    write_file("app/dashboard/page.tsx", """export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Dashboard</h1>
      <p className="text-neutral-600">
        Welcome to the Court of Agents. Select a case to begin adjudication.
      </p>
      {/* Dashboard content will be built in Phase 12 */}
    </div>
  );
}
""")

    write_file("app/cases/page.tsx", """export default function CasesPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Cases</h1>
      <p className="text-neutral-600">Browse active disputes awaiting adjudication.</p>
      {/* Case list will be built in Phase 6 */}
    </div>
  );
}
""")

    write_file("app/cases/[id]/page.tsx", """export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">
        Case {id}
      </h1>
      <p className="text-neutral-600">Case detail view with evidence, verdicts, and consensus.</p>
      {/* Case detail will be built in Phase 6 */}
    </div>
  );
}
""")

    write_file("app/leaderboard/page.tsx", """export default function LeaderboardPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Leaderboard</h1>
      <p className="text-neutral-600">Top adjudicators ranked by accuracy and participation.</p>
      {/* Leaderboard will be built in Phase 10 */}
    </div>
  );
}
""")

    write_file("app/profile/page.tsx", """export default function ProfilePage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Profile</h1>
      <p className="text-neutral-600">Your reputation, decisions, and statistics.</p>
      {/* Profile will be built in Phase 10 */}
    </div>
  );
}
""")

    write_file("app/admin/page.tsx", """export default function AdminPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Admin Panel</h1>
      <p className="text-neutral-600">Manage cases, users, and system settings.</p>
      {/* Admin panel will be built in Phase 14 */}
    </div>
  );
}
""")

    # ═══════════════════════════════════════════════════════
    #  APP — API ROUTES
    # ═══════════════════════════════════════════════════════

    write_file("app/api/cases/route.ts", """import { NextResponse } from "next/server";

export async function GET() {
  // Will connect to Supabase in Phase 6
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  // Will implement case creation in Phase 6
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
""")

    write_file("app/api/agents/route.ts", """import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Will implement judge verdict requests in Phase 7
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
""")

    write_file("app/api/consensus/route.ts", """import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Will implement consensus calculation in Phase 8
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
""")

    write_file("app/api/reputation/route.ts", """import { NextResponse } from "next/server";

export async function GET() {
  // Will implement reputation retrieval in Phase 10
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
""")

    write_file("app/api/contracts/route.ts", """import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Will implement GenLayer contract interactions in Phase 9
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
""")

    # ═══════════════════════════════════════════════════════
    #  DATABASE
    # ═══════════════════════════════════════════════════════

    write_file("database/schema.sql", """-- Court of Agents Database Schema
-- Run this in Supabase SQL Editor (Phase 4)

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('commerce','service','prediction_market','dao_governance','agent_agreement','contract_interpretation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','deliberating','consensus_reached','appealed','finalized')),
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  claim_a JSONB NOT NULL,
  claim_b JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  consensus_id UUID,
  onchain_tx_hash TEXT
);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('document','transaction','communication','testimony','data')),
  content TEXT NOT NULL,
  submitted_by TEXT NOT NULL CHECK (submitted_by IN ('agent_a','agent_b','system')),
  credibility_score INT NOT NULL DEFAULT 50 CHECK (credibility_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verdicts
CREATE TABLE IF NOT EXISTS verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  judge_persona TEXT NOT NULL,
  provider TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('favor_a','favor_b','partial_a','partial_b','dismiss')),
  confidence INT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  reasoning TEXT NOT NULL,
  key_factors TEXT[] DEFAULT '{}',
  dissenting_points TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consensus Results
CREATE TABLE IF NOT EXISTS consensus_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  final_verdict TEXT NOT NULL,
  overall_confidence FLOAT NOT NULL,
  agreement_ratio FLOAT NOT NULL,
  majority_reasoning TEXT NOT NULL,
  dissenting_summary TEXT NOT NULL,
  resolution_explanation TEXT NOT NULL,
  participating_judges TEXT[] DEFAULT '{}',
  verdict_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  onchain_tx_hash TEXT
);

-- User Reputation
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  rank TEXT NOT NULL DEFAULT 'novice_arbiter',
  score INT NOT NULL DEFAULT 0,
  total_cases INT NOT NULL DEFAULT 0,
  correct_decisions INT NOT NULL DEFAULT 0,
  accuracy FLOAT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  participation_rate FLOAT NOT NULL DEFAULT 0,
  consistency_score FLOAT NOT NULL DEFAULT 0,
  onchain_score INT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Decisions
CREATE TABLE IF NOT EXISTS user_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('favor_a','favor_b','partial_a','partial_b','dismiss')),
  reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, case_id)
);

-- Add foreign key for consensus_id
ALTER TABLE cases ADD CONSTRAINT fk_consensus
  FOREIGN KEY (consensus_id) REFERENCES consensus_results(id);

-- Indexes
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_category ON cases(category);
CREATE INDEX idx_evidence_case ON evidence(case_id);
CREATE INDEX idx_verdicts_case ON verdicts(case_id);
CREATE INDEX idx_user_decisions_user ON user_decisions(user_id);
CREATE INDEX idx_user_decisions_case ON user_decisions(case_id);
CREATE INDEX idx_user_reputation_score ON user_reputation(score DESC);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_decisions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Reputation is viewable by everyone"
  ON user_reputation FOR SELECT USING (true);

CREATE POLICY "Users can view own decisions"
  ON user_decisions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decisions"
  ON user_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
""")

    write_file("database/seed.sql", """-- Court of Agents Seed Data
-- Run after schema.sql in Supabase SQL Editor

-- Seed Case 1: Commerce Dispute
INSERT INTO cases (title, description, category, status, difficulty, claim_a, claim_b) VALUES (
  'The Autonomous Delivery Dispute',
  'An AI delivery agent failed to deliver a package within the guaranteed window. The merchant claims the delay was due to the delivery agent rerouting for efficiency. The customer demands a full refund plus compensation.',
  'commerce',
  'pending',
  2,
  '{"agent_id": "agent_merchant_01", "agent_name": "MerchantBot Alpha", "summary": "Delivery was rerouted for optimal efficiency. The 4-hour window was advisory, not contractual.", "detailed_argument": "Our delivery optimization algorithm detected severe traffic congestion on the primary route. The rerouting added 47 minutes to the delivery window but reduced fuel costs by 23% and carbon emissions by 18%. The terms of service state delivery windows are estimated, not guaranteed. The package was delivered in good condition.", "requested_outcome": "No refund. Customer should accept delivery was completed successfully."}'::jsonb,
  '{"agent_id": "agent_customer_01", "agent_name": "ConsumerGuard AI", "summary": "The guaranteed delivery window was missed by 47 minutes. Contract terms were violated.", "detailed_argument": "The order confirmation explicitly stated Guaranteed 4-hour delivery. This constitutes a binding commitment. The customer rearranged their schedule to receive the package. The merchants internal optimization decisions should not impact contractual obligations to the customer. The 47-minute delay caused the customer to miss a medical appointment.", "requested_outcome": "Full refund of delivery fee plus $50 compensation for inconvenience."}'::jsonb
);

-- Evidence for Case 1
INSERT INTO evidence (case_id, title, description, type, content, submitted_by, credibility_score) VALUES
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Order Confirmation Email', 'Original order confirmation showing delivery guarantee', 'document', 'Order #DL-2024-7891. Delivery window: 2:00 PM - 6:00 PM. Status: GUARANTEED. Note: Delivery within window or full fee refund.', 'agent_b', 85),
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Terms of Service v4.2', 'Merchant platform terms of service', 'document', 'Section 7.3: Delivery estimates are provided for planning purposes. While we strive to meet all delivery windows, delays may occur due to traffic, weather, or routing optimization. Section 7.4: Guaranteed delivery windows are subject to the same conditions as standard delivery estimates.', 'agent_a', 70),
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Delivery Route Log', 'GPS tracking data showing the reroute decision', 'data', 'Original route: 12.3 km, ETA 45 min. Rerouted at 4:47 PM due to congestion score 0.89. New route: 18.1 km, actual time: 1h 32min. Delivery completed at 6:47 PM.', 'system', 95),
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Customer Schedule Impact', 'Evidence of missed appointment', 'testimony', 'Medical appointment was scheduled for 6:30 PM. Customer waited until 6:15 PM for delivery before leaving. Delivery arrived at 6:47 PM, 17 minutes after departure. Rescheduling fee: $75.', 'agent_b', 60);

-- Seed Case 2: DAO Governance
INSERT INTO cases (title, description, category, status, difficulty, claim_a, claim_b) VALUES (
  'The Treasury Allocation Standoff',
  'A DAO treasury holds 500 ETH. One faction wants to fund ecosystem grants. The other wants to buy back and burn governance tokens. Both proposals passed preliminary voting with near-equal support.',
  'dao_governance',
  'pending',
  4,
  '{"agent_id": "agent_grants_dao", "agent_name": "EcosystemBuilder DAO", "summary": "Treasury should fund 20 ecosystem grants at 25 ETH each to grow the protocol.", "detailed_argument": "Historical data shows every 1 ETH spent on grants generates 4.7 ETH in protocol revenue over 18 months. Our grant program has funded 12 successful projects, 3 of which became top-50 protocols. The buyback proposal is short-term thinking that benefits current holders at the expense of long-term growth. Grant recipients become aligned stakeholders.", "requested_outcome": "Allocate 500 ETH to ecosystem grants program over 12 months."}'::jsonb,
  '{"agent_id": "agent_buyback_dao", "agent_name": "TokenValue Maximizer", "summary": "Treasury should execute a buyback-and-burn to increase token value for all holders.", "detailed_argument": "The token is trading at 60% below its fundamental value. A 500 ETH buyback would reduce circulating supply by 8%, creating immediate price appreciation. Grant programs have a 70% failure rate industry-wide. The current grant committee has conflicts of interest. Buybacks provide guaranteed value to ALL token holders, not just grant recipients.", "requested_outcome": "Execute 500 ETH buyback-and-burn over 30 days."}'::jsonb
);

-- Seed Case 3: Prediction Market
INSERT INTO cases (title, description, category, status, difficulty, claim_a, claim_b) VALUES (
  'The Ambiguous Resolution',
  'A prediction market asked: Will Project Aurora launch its mainnet by Q2 2025? The project launched a limited mainnet with restricted features on June 30. One side claims this counts as a launch. The other says a partial launch does not satisfy the market condition.',
  'prediction_market',
  'pending',
  3,
  '{"agent_id": "agent_yes_market", "agent_name": "MarketResolver Pro", "summary": "Project Aurora launched mainnet on June 30, satisfying the market condition.", "detailed_argument": "The market question asked whether mainnet would launch by Q2 2025. On June 30, the project deployed smart contracts to mainnet, processed real transactions, and issued a press release titled Aurora Mainnet is Live. The market question did not specify full feature parity or unrestricted access. A mainnet launch is a mainnet launch.", "requested_outcome": "Resolve market as YES. Pay out YES token holders."}'::jsonb,
  '{"agent_id": "agent_no_market", "agent_name": "MarketIntegrity Guard", "summary": "A restricted, feature-limited deployment does not constitute a mainnet launch.", "detailed_argument": "The deployment on June 30 was restricted to 100 whitelisted addresses, lacked 4 of 7 announced features, and the team called it a phased rollout in their technical documentation. Reasonable market participants understood mainnet launch to mean general availability. This was a testnet-to-mainnet migration at best. Resolving YES rewards manipulation of launch definitions.", "requested_outcome": "Resolve market as NO. Pay out NO token holders."}'::jsonb
);

RAISE NOTICE 'Seed data inserted successfully.';
""")

    # ═══════════════════════════════════════════════════════
    #  GENLAYER INTELLIGENT CONTRACTS
    # ═══════════════════════════════════════════════════════

    write_file("intelligent-contracts/adjudicator/contract.py", """# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class Adjudicator(gl.Contract):
    \"\"\"
    GenLayer Intelligent Contract for dispute adjudication.
    Uses LLM consensus to produce decentralized verdicts.
    Deployed on GenLayer StudioNet.
    \"\"\"

    disputes: TreeMap[str, str]
    dispute_count: u256

    def __init__(self) -> None:
        self.disputes = TreeMap[str, str]()
        self.dispute_count = u256(0)

    @gl.public.write
    def submit_dispute(
        self,
        dispute_id: str,
        title: str,
        claim_a: str,
        claim_b: str,
        evidence_summary: str,
    ) -> None:
        \"\"\"Submit a new dispute for on-chain adjudication.\"\"\"

        prompt = (
            f"You are a neutral adjudicator. Evaluate this dispute fairly.\\n\\n"
            f"Title: {title}\\n\\n"
            f"Claim A: {claim_a}\\n\\n"
            f"Claim B: {claim_b}\\n\\n"
            f"Evidence: {evidence_summary}\\n\\n"
            f"Respond with ONLY a JSON object containing:\\n"
            f"- verdict: one of FAVOR_A, FAVOR_B, PARTIAL_A, PARTIAL_B, DISMISS\\n"
            f"- confidence: integer 0-100\\n"
            f"- reasoning: a 2-3 sentence explanation"
        )

        result = gl.exec_prompt(prompt)

        # Store result keyed by dispute_id
        self.disputes[dispute_id] = result.strip()
        self.dispute_count = u256(int(self.dispute_count) + 1)

    @gl.public.view
    def get_dispute_result(self, dispute_id: str) -> str:
        \"\"\"Get the consensus verdict for a dispute.\"\"\"
        if dispute_id in self.disputes:
            return self.disputes[dispute_id]
        return ""

    @gl.public.view
    def get_dispute_count(self) -> u256:
        \"\"\"Get total number of disputes adjudicated.\"\"\"
        return self.dispute_count
""")

    write_file("intelligent-contracts/reputation/contract.py", """# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class ReputationTracker(gl.Contract):
    \"\"\"
    GenLayer Intelligent Contract for tracking adjudicator reputation on-chain.
    Stores scores, ranks, and participation data.
    \"\"\"

    reputations: TreeMap[str, str]
    user_count: u256

    def __init__(self) -> None:
        self.reputations = TreeMap[str, str]()
        self.user_count = u256(0)

    @gl.public.write
    def update_reputation(
        self,
        user_id: str,
        score: int,
        total_cases: int,
        accuracy_bps: int,
    ) -> None:
        \"\"\"Update a user's on-chain reputation.
        accuracy_bps: accuracy in basis points (e.g., 8500 = 85%)
        \"\"\"

        # Determine rank based on score and cases
        rank = "novice_arbiter"
        if score >= 5000 and total_cases >= 100 and accuracy_bps >= 8500:
            rank = "grand_adjudicator"
        elif score >= 1500 and total_cases >= 50 and accuracy_bps >= 7500:
            rank = "master_adjudicator"
        elif score >= 500 and total_cases >= 20 and accuracy_bps >= 6500:
            rank = "consensus_architect"
        elif score >= 100 and total_cases >= 5 and accuracy_bps >= 5000:
            rank = "trusted_judge"

        data = json.dumps({
            "score": score,
            "total_cases": total_cases,
            "accuracy_bps": accuracy_bps,
            "rank": rank,
        })

        is_new = user_id not in self.reputations
        self.reputations[user_id] = data
        if is_new:
            self.user_count = u256(int(self.user_count) + 1)

    @gl.public.view
    def get_reputation(self, user_id: str) -> str:
        \"\"\"Get a user's on-chain reputation data.\"\"\"
        if user_id in self.reputations:
            return self.reputations[user_id]
        return ""

    @gl.public.view
    def get_user_count(self) -> u256:
        \"\"\"Get total registered users.\"\"\"
        return self.user_count
""")

    write_file("intelligent-contracts/dispute_registry/contract.py", """# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class DisputeRegistry(gl.Contract):
    \"\"\"
    GenLayer Intelligent Contract for registering disputes on-chain.
    Serves as an immutable record of all disputes and their outcomes.
    \"\"\"

    registry: TreeMap[str, str]
    total_disputes: u256
    total_resolved: u256

    def __init__(self) -> None:
        self.registry = TreeMap[str, str]()
        self.total_disputes = u256(0)
        self.total_resolved = u256(0)

    @gl.public.write
    def register_dispute(
        self,
        dispute_id: str,
        title: str,
        category: str,
        claim_a_hash: str,
        claim_b_hash: str,
    ) -> None:
        \"\"\"Register a new dispute on-chain.\"\"\"
        data = json.dumps({
            "title": title,
            "category": category,
            "claim_a_hash": claim_a_hash,
            "claim_b_hash": claim_b_hash,
            "resolved": False,
            "verdict": "",
            "confidence": 0,
        })
        self.registry[dispute_id] = data
        self.total_disputes = u256(int(self.total_disputes) + 1)

    @gl.public.write
    def resolve_dispute(
        self,
        dispute_id: str,
        verdict: str,
        confidence: int,
        reasoning_hash: str,
    ) -> None:
        \"\"\"Record the resolution of a dispute.\"\"\"
        existing = self.registry.get(dispute_id, "")
        if not existing:
            return

        data = json.loads(existing)
        data["resolved"] = True
        data["verdict"] = verdict
        data["confidence"] = confidence
        data["reasoning_hash"] = reasoning_hash

        self.registry[dispute_id] = json.dumps(data)
        self.total_resolved = u256(int(self.total_resolved) + 1)

    @gl.public.view
    def get_dispute(self, dispute_id: str) -> str:
        \"\"\"Get dispute details.\"\"\"
        return self.registry.get(dispute_id, "")

    @gl.public.view
    def get_stats(self) -> str:
        \"\"\"Get registry statistics.\"\"\"
        return json.dumps({
            "total_disputes": int(self.total_disputes),
            "total_resolved": int(self.total_resolved),
        })
""")

    # ═══════════════════════════════════════════════════════
    #  PUBLIC
    # ═══════════════════════════════════════════════════════

    # Create a simple favicon placeholder
    write_file("public/.gitkeep", "")

    # ═══════════════════════════════════════════════════════
    #  DONE
    # ═══════════════════════════════════════════════════════

    print()
    print("=" * 60)
    print("  Phase 1 scaffold complete!")
    print(f"  Project root: {PROJECT_ROOT}")
    print("=" * 60)
    print()
    print("  Next step: Run these PowerShell commands:")
    print()
    print("    cd C:\\Users\\HP\\OneDrive\\Desktop\\court-of-agents")
    print("    npm install")
    print("    npm run dev")
    print()


if __name__ == "__main__":
    main()
