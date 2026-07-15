# Court of Agents

**"When AI agents disagree, who decides?"**

Court of Agents is an interactive adjudication platform built on [GenLayer](https://www.genlayer.com/) that demonstrates how consensus emerges from conflicting AI reasoning. Two parties submit a real dispute, attach on-chain-verified web evidence, watch six specialized AI judges deliberate, and receive a verdict secured on-chain through GenLayer Intelligent Contracts.

## Live Demo

Deployed on GenLayer StudioNet (Chain ID: 61999)

| Contract | Address |
|---|---|
| CourtOfAgents (merged) | `0xb468b1db949E7B40Be2bb8E6e33C1802d171524B` |

## How It Works

1. **Connect Wallet** — Your GenLayer wallet is your on-chain identity. Every action is signed by your wallet; the app never holds your private key server-side.
2. **Agent A Creates a Case** — The claimant describes the dispute and names a respondent wallet address. The case is recorded on-chain in `awaiting_response` status.
3. **Agent B Responds** — Only the wallet named as respondent can submit the counter-claim. The contract enforces this via `gl.message.sender_address`. Once submitted, the case moves to `pending`.
4. **Both Parties Attach Web Evidence** — Either party submits a URL via `attach_web_evidence()`. GenLayer fetches the live page, has an LLM summarize only what is genuinely there, and validators independently re-fetch the same URL to reach consensus. At least one evidence entry is required before judges can run.
5. **AI Judges Deliberate** — Six specialized judge personas analyze the case in a single on-chain LLM call via `gl.vm.run_nondet_unsafe`. Each judge produces a verdict and confidence score:
   - **Commerce Judge** — Trade disputes, market practices
   - **Consumer Judge** — Consumer protection, fair dealing
   - **Contract Judge** — Contractual terms, written agreements
   - **Neutral Judge** — Balanced, impartial analysis
   - **Risk Judge** — Liability, risk exposure, consequences
   - **GenLayer Judge** — Decentralized consensus reasoning
6. **Consensus Emerges** — A second LLM call synthesizes all six verdicts into a final ruling (FAVOR_A, FAVOR_B, or DISMISS) with a confidence score and explanation.
7. **Appeal** — Either the claimant or respondent may appeal a `consensus_reached` verdict. The case reopens for a fresh judge round, optionally with new evidence.

## Case Lifecycle

```
awaiting_response → pending → deliberating → consensus_reached
                                                      ↓ (appeal)
                                                   pending  (repeat)
                                                      ↓
                                                  finalized
```

## Why GenLayer?

- **AI opinions are subjective** — Different prompts, models, and perspectives produce different conclusions. GenLayer's consensus mechanism resolves this.
- **On-chain AI reasoning** — Every judge verdict and web evidence fetch is produced inside an Intelligent Contract, validated through GenLayer's Optimistic Democracy. Validators independently re-run every LLM call and web fetch.
- **Wallet-based identity and access control** — No email/password. The contract enforces who can respond, submit evidence, and appeal by checking `gl.message.sender_address` against stored wallet addresses.
- **Immutable dispute records** — Cases, verdicts, consensus results, and appeal history are all stored on-chain.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Blockchain | GenLayer StudioNet (Chain ID: 61999) |
| Smart Contracts | GenLayer Intelligent Contracts (Python) |
| SDK | genlayer-js v1.1.7 |
| AI | GenLayer LLMs via `gl.nondet.exec_prompt()` and `gl.vm.run_nondet_unsafe` |
| Deployment | Vercel |

## Project Structure

```
court-of-agents/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Login (wallet connect) & Register (wallet create)
│   ├── cases/                    # Case list, detail, and creation
│   │   ├── create/               # Two-party case submission form
│   │   └── [id]/                 # Case detail: respond, evidence, judges, appeal
│   ├── dashboard/                # User dashboard with stats
│   ├── leaderboard/              # Ranked adjudicators
│   ├── profile/                  # User profile with on-chain reputation
│   └── api/                      # API routes
│       ├── contracts/            # GenLayer contract interactions
│       ├── wallet/               # Wallet creation & connection
│       ├── cases/                # Case CRUD
│       ├── evidence/             # Evidence mirroring to Supabase
│       ├── agents/               # AI judge engine
│       ├── consensus/            # Consensus calculation
│       └── decisions/            # User verdict submission
├── intelligent-contracts/        # GenLayer Intelligent Contracts
│   └── court_of_agents/contract.py  # Single merged contract: cases, evidence,
│                                     # judges, consensus, reputation, audit log
├── features/cases/components/    # Case-specific UI components
│   ├── respond-to-case.tsx       # Respondent wallet submits counter-claim
│   ├── attach-evidence.tsx       # On-chain web evidence fetch
│   ├── appeal-case.tsx           # Appeal flow for claimant/respondent
│   └── run-judges-button.tsx     # Triggers judge panel (gated on evidence)
├── components/                   # Reusable UI components
├── services/                     # Supabase, GenLayer, AI services
├── hooks/                        # React hooks (useWallet, etc.)
├── types/                        # TypeScript type definitions
├── database/                     # SQL schema, seed data, migrations
│   └── migration-two-party-cases.sql
└── scripts/                      # Deployment scripts
```

## Intelligent Contract

### CourtOfAgents — `intelligent-contracts/court_of_agents/contract.py`

A single merged contract that replaces the previous 3-contract design (adjudicator, reputation, dispute_registry). All functionality lives at one address. LLM calls use `gl.vm.run_nondet_unsafe` with a deterministic Python validator for reliable finalization.

| Method | Type | Description |
|---|---|---|
| `submit_case()` | write | Claimant creates a case naming a respondent wallet; starts in `awaiting_response` |
| `respond_to_case()` | write | Only the named respondent wallet can submit the counter-claim; enforced via `gl.message.sender_address` |
| `attach_web_evidence()` | write | Fetch a URL on-chain; LLM summarizes the live content; validators re-fetch independently; increments `evidence_count` |
| `run_judges()` | write | Six AI personas in one LLM call; gated on `evidence_count > 0` and case not in `awaiting_response` |
| `calculate_consensus()` | write | Synthesizes verdicts into FAVOR_A / FAVOR_B / DISMISS with confidence and explanation |
| `appeal_case()` | write | Claimant or respondent (verified on-chain) reopens case; increments `appeal_round` |
| `submit_user_decision()` | write | Record a user's verdict; auto-updates on-chain reputation |
| `finalize_case()` | write | Move a `consensus_reached` case to `finalized` |
| `register_user()` / `update_after_decision()` | write | On-chain reputation (5 ranks) |
| `get_case()` / `get_verdicts()` / `get_consensus()` | view | Read case, verdict, and consensus data |
| `get_evidence_fetch()` | view | Read the verified summary for a given URL |
| `list_case_ids()` / `list_user_addresses()` | view | Paginated on-chain enumeration |
| `get_reputation()` / `get_dispute()` / `get_stats()` | view | Reputation and audit-log reads |

Key implementation notes:
- `agreement_ratio_pct` stored as `int` (0–100) internally — Python `float` cannot be serialized across the GenVM calldata boundary.
- `_ascii_safe()` transliterates smart quotes and em-dashes before passing text to LLM prompts.
- `evidence_count` tracked as int on each case; `run_judges()` raises if it is zero.
- `Address(str)` constructor used for all wallet comparisons — never raw string equality.

Reputation ranks:

| Rank | Min Score | Min Cases | Min Accuracy |
|---|---|---|---|
| Novice Arbiter | 0 | 0 | 0% |
| Trusted Judge | 100 | 5 | 50% |
| Consensus Architect | 500 | 20 | 65% |
| Master Adjudicator | 1,500 | 50 | 75% |
| Grand Adjudicator | 5,000 | 100 | 85% |

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
| `NEXT_PUBLIC_COURT_CONTRACT_ADDRESS` | Deployed CourtOfAgents contract address |

Note: `GENLAYER_PRIVATE_KEY` is intentionally absent — users sign their own transactions via their wallet.

### Database Setup

Run these SQL files in your Supabase SQL Editor in order:

1. `database/schema.sql` — Creates all tables
2. `database/seed.sql` — Inserts sample cases
3. `database/migration-two-party-cases.sql` — Two-party lifecycle columns and constraints

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

## Deploying the Contract

1. Go to [GenLayer Studio](https://studio.genlayer.com)
2. Upload `intelligent-contracts/court_of_agents/contract.py`
3. Deploy the contract
4. Copy the contract address into `.env.local` as `NEXT_PUBLIC_COURT_CONTRACT_ADDRESS`

## Deployment

### Vercel

Set all environment variables in Vercel Dashboard > Settings > Environment Variables, then:

```bash
vercel --prod
```

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
- Wallet-address access control enforced on-chain (not just in the frontend)
- Row Level Security on Supabase tables

## License

MIT

## Built With

- [GenLayer](https://www.genlayer.com/) — AI-native Layer-1 blockchain
- [Next.js](https://nextjs.org/) — React framework
- [Supabase](https://supabase.com/) — Backend as a service
- [TailwindCSS](https://tailwindcss.com/) — Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) — Animation library
