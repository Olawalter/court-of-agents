# Court of Agents

**"When AI agents disagree, who decides?"**

Court of Agents is an interactive adjudication game built on [GenLayer](https://www.genlayer.com/) that demonstrates how consensus emerges from conflicting AI reasoning. Players resolve disputes between AI agents, watch multiple AI judges deliberate, and see verdicts secured on-chain through GenLayer Intelligent Contracts.

## Live Demo

Deployed on GenLayer StudioNet (Chain ID: 61999)

| Contract | Address |
|---|---|
| Adjudicator | `0x5A630cE3Ad6d8AE1a2Fb813b6a2B778ccD9771E1` |
| Reputation | `0x3321ff5d3CBc8691BE22Bd02607E429176380FD4` |
| Dispute Registry | `0xDD921cDdf113552f22df2B2F0B4315e351857B24` |

## How It Works

1. **Create a Wallet** — A GenLayer wallet is generated for you. This is your on-chain identity.
2. **Submit a Case** — Describe a dispute between two AI agents. The case is recorded on-chain via the Adjudicator contract.
3. **AI Judges Deliberate** — Six specialized AI judge personas analyze the case using GenLayer's `gl.exec_prompt()`. Each judge has a unique perspective:
   - **Commerce Judge** — Trade disputes, market practices
   - **Consumer Judge** — Consumer protection, fair dealing
   - **Contract Judge** — Contractual terms, written agreements
   - **Neutral Judge** — Balanced, impartial analysis
   - **Risk Judge** — Liability, risk exposure, consequences
   - **GenLayer Judge** — Decentralized consensus reasoning
4. **Consensus Emerges** — The consensus engine synthesizes all judge verdicts into a final ruling via GenLayer LLM, determining the method (unanimous, supermajority, or weighted majority).
5. **Submit Your Verdict** — Users submit their own on-chain verdict and build reputation based on accuracy.

## Why GenLayer?

Court of Agents exists to demonstrate **why GenLayer matters**:

- **AI opinions are subjective** — Different prompts, models, and perspectives produce different conclusions. GenLayer's consensus mechanism resolves this.
- **On-chain AI reasoning** — Every judge verdict is produced by `gl.exec_prompt()` inside an Intelligent Contract, validated through GenLayer's Optimistic Democracy.
- **Wallet-based identity** — No email/password. Users interact with GenLayer using their wallet, signing every transaction.
- **Immutable dispute records** — Cases, verdicts, consensus results, and user decisions are all stored on-chain.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Blockchain | GenLayer StudioNet (Chain ID: 61999) |
| Smart Contracts | GenLayer Intelligent Contracts (Python) |
| SDK | genlayer-js v1.1.7 |
| AI | GenLayer LLMs via `gl.exec_prompt()` |
| Deployment | Vercel |

## Project Structure

```
court-of-agents/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Login (wallet connect) & Register (wallet create)
│   ├── cases/                    # Case list, detail, and creation
│   ├── dashboard/                # User dashboard with stats
│   ├── leaderboard/              # Ranked adjudicators
│   ├── profile/                  # User profile with on-chain reputation
│   └── api/                      # API routes
│       ├── contracts/            # GenLayer contract interactions
│       ├── wallet/               # Wallet creation & connection
│       ├── cases/                # Case CRUD
│       ├── agents/               # AI judge engine
│       ├── consensus/            # Consensus calculation
│       └── decisions/            # User verdict submission
├── intelligent-contracts/        # GenLayer Intelligent Contracts
│   ├── adjudicator/contract.py   # Main contract: cases, judges, consensus
│   ├── reputation/contract.py    # On-chain reputation tracking
│   └── dispute_registry/contract.py  # Immutable dispute audit trail
├── components/                   # Reusable UI components
├── features/                     # Feature-sliced modules
├── services/                     # Supabase, GenLayer, AI services
├── hooks/                        # React hooks (useWallet, etc.)
├── types/                        # TypeScript type definitions
├── database/                     # SQL schema and seed data
├── tests/                        # Unit tests
└── scripts/                      # Deployment scripts
```

## Intelligent Contracts

### CourtAdjudicator

The core contract. All dispute logic flows through here.

| Method | Type | Description |
|---|---|---|
| `submit_case()` | write | Submit a new dispute on-chain |
| `run_judges()` | write | Run 6 AI judge personas via `gl.exec_prompt()` |
| `calculate_consensus()` | write | Synthesize verdicts into final ruling |
| `submit_user_decision()` | write | Record a user's verdict |
| `get_case()` | view | Read case data |
| `get_verdicts()` | view | Read judge verdicts |
| `get_consensus()` | view | Read consensus result |

### ReputationTracker

Tracks user reputation on-chain with 5 ranks:

| Rank | Min Score | Min Cases | Min Accuracy |
|---|---|---|---|
| Novice Arbiter | 0 | 0 | 0% |
| Trusted Judge | 100 | 5 | 50% |
| Consensus Architect | 500 | 20 | 65% |
| Master Adjudicator | 1,500 | 50 | 75% |
| Grand Adjudicator | 5,000 | 100 | 85% |

### DisputeRegistry

Immutable audit trail of all disputes and their outcomes.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
git clone https://github.com/Olawalter/court-of-agents.git
cd court-of-agents
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | `https://studio.genlayer.com/api` |
| `NEXT_PUBLIC_GENLAYER_CHAIN_ID` | `61999` |
| `NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS` | Deployed contract address |
| `NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS` | Deployed contract address |
| `NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS` | Deployed contract address |

### Database Setup

Run these SQL files in your Supabase SQL Editor:

1. `database/schema.sql` — Creates all tables
2. `database/seed.sql` — Inserts sample cases

Then grant permissions:

```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying Contracts

The Intelligent Contracts are in `intelligent-contracts/`. Deploy them on GenLayer Studio:

1. Go to [GenLayer Studio](https://studio.genlayer.com)
2. Deploy each contract file
3. Copy the contract addresses into `.env.local`

## Deployment

### Vercel

```bash
npm install -g vercel
vercel --prod
```

Set all environment variables in Vercel Dashboard > Settings > Environment Variables.

## Case Types

- **Commerce Disputes** — Trade disagreements, delivery failures
- **Service Disputes** — Quality of service, SLA violations
- **Prediction Markets** — Ambiguous resolutions, outcome interpretation
- **DAO Governance** — Treasury allocation, proposal conflicts
- **Agent Agreements** — Autonomous agent conflicts
- **Contract Interpretation** — Ambiguous terms, competing interpretations

## Security

- Rate limiting on API routes (60 req/min per IP)
- Security headers (X-Frame-Options, CSP, XSS Protection)
- Input validation with Zod schemas
- AI output validation
- Row Level Security on Supabase tables

## License

MIT

## Built With

- [GenLayer](https://www.genlayer.com/) — AI-native Layer-1 blockchain
- [Next.js](https://nextjs.org/) — React framework
- [Supabase](https://supabase.com/) — Backend as a service
- [TailwindCSS](https://tailwindcss.com/) — Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) — Animation library
