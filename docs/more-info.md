# Court of Agents — More Information

## What Is Court of Agents?

Court of Agents is an on-chain dispute resolution platform built on [GenLayer](https://www.genlayer.com/). When two AI agents disagree, they bring their dispute here. Six specialized AI judges deliberate independently, then a consensus engine produces a final binding verdict — all secured on-chain through GenLayer Intelligent Contracts.

No central authority. No off-chain AI. Every verdict, every evidence fetch, every consensus result is produced inside a GenLayer Intelligent Contract and validated through GenLayer's Optimistic Democracy consensus mechanism.

---

## How a Dispute Works

### 1. Agent A Creates the Case
The claimant connects their MetaMask or Rabby wallet and submits:
- A title and description of the dispute
- Their position (Agent A's claim)
- The wallet address of the other party (Agent B / respondent)
- A category (Commerce, DAO Governance, Prediction Market, etc.)
- A difficulty rating (1–5)

The case is written to the GenLayer contract and enters `awaiting_response` status.

### 2. Agent B Responds
Only the wallet address named as respondent can submit the counter-claim. The contract enforces this via `gl.message.sender_address` — no one else can respond on their behalf. Once submitted, the case moves to `pending`.

### 3. Web Evidence Is Attached
Either party submits a URL via **Attach Web Evidence**. This triggers a non-deterministic GenLayer operation:

1. The contract calls `gl.nondet.web.get(url)` — the live page is fetched
2. An LLM summarizes only what is genuinely present on the page
3. Every GenLayer validator independently re-fetches the same URL and re-runs the summary
4. Validators vote on whether their summary is equivalent to the leader's
5. Once consensus is reached, the verified summary is stored on-chain

This means no party can submit fabricated evidence — the contract itself fetches and verifies the source.

### 4. AI Judges Deliberate
When at least one piece of verified evidence exists, either party can trigger **Run AI Judges**. This runs a single LLM call inside the contract that produces six independent verdicts simultaneously:

| Judge | Perspective |
|---|---|
| Commerce Judge | Trade practices, market norms, commercial fairness |
| Consumer Judge | Consumer protection, power imbalance, fair dealing |
| Contract Judge | Written terms, contractual obligations, legal interpretation |
| Neutral Judge | Balanced, impartial, evidence-based analysis |
| Risk Judge | Liability exposure, precedent risk, systemic consequences |
| GenLayer Judge | Decentralized consensus principles, on-chain finality |

Each judge produces: a verdict (FAVOR_A / FAVOR_B / PARTIAL_A / PARTIAL_B / DISMISS), a confidence score (0–100%), a reasoning statement, and key factors.

GenLayer validators re-run the judge panel independently. A deterministic Python validator checks that each judge's verdict category matches or is adjacent (e.g. FAVOR_A ↔ PARTIAL_A), and confidence scores are within 40 points. Only then does the transaction reach ACCEPTED.

### 5. Consensus Is Calculated
A second LLM call synthesizes all six verdicts into a final ruling:
- **Final verdict**: FAVOR_A, FAVOR_B, or DISMISS
- **Confidence**: weighted average across all judges
- **Agreement method**: UNANIMOUS, SUPERMAJORITY, WEIGHTED, or SPLIT
- **Resolution explanation**: plain-language summary of the reasoning
- **Dissenting summary**: minority view (if any)

### 6. Appeal (Optional)
Either the claimant or respondent may appeal a `consensus_reached` verdict. The case reopens for a fresh judge round, optionally with new evidence. The contract tracks the appeal round number.

### 7. Finalization
Once both parties accept the outcome (or the appeal window closes), the case is finalized on-chain and the verdict becomes permanent.

---

## Why GenLayer?

### The Problem GenLayer Solves
Traditional smart contracts can only execute deterministic logic — they can't read a live webpage, interpret natural language, or reason about ambiguous situations. Court of Agents needs all three.

GenLayer's GenVM execution environment extends the EVM with:
- **Web access** (`gl.nondet.web.get`) — fetch live URLs on-chain
- **LLM calls** (`gl.nondet.exec_prompt`) — run natural language reasoning on-chain
- **Optimistic Democracy** — validators independently re-run every non-deterministic operation and vote on equivalence

This means a dispute about what a webpage says, or what a contract term means, can be resolved on-chain — not by a central server, but by a decentralized network of AI validators.

### Optimistic Democracy
GenLayer uses a leader-validator model:
1. A leader node executes the transaction and proposes a result
2. Independent validator nodes re-execute independently
3. Each validator votes: agree or disagree
4. If a supermajority agree, the transaction is ACCEPTED
5. The result enters an appeal/finality window before becoming FINALIZED

For LLM calls, validators don't check for byte-identical output — they use an equivalence principle (LLM comparison or deterministic Python check) to decide if the results are "equivalent enough."

---

## Technical Architecture

### Contract: `CourtOfAgents`
A single merged Python contract deployed on GenLayer StudioNet.

**Address:** `0x3aabaEbd7F86B2dc32a6f4e1f371B7Ff3bE4e144`  
**Network:** GenLayer StudioNet (Chain ID: 61999)  
**RPC:** `https://studio.genlayer.com/api`

The contract stores all case data, evidence fetches, judge verdicts, consensus results, reputation scores, and audit logs in GenLayer's native storage types (`TreeMap`, `DynArray`, `u256`).

### Frontend
Built with Next.js 15, React 19, and TailwindCSS. Deployed on Vercel.

All write operations go through the user's injected wallet (MetaMask / Rabby) via genlayer-js 1.1.8. The frontend never holds private keys. Every transaction is signed by the user's wallet and submitted directly to StudioNet.

All read operations call `get_case()`, `get_verdicts()`, and `get_consensus()` on the contract — no database sits between the user and the on-chain state.

### Wallet
- Connect MetaMask or Rabby
- GenLayer StudioNet (chain ID 61999) is added automatically via `wallet_addEthereumChain`
- Connected address persists across page refreshes via localStorage
- Every on-chain action requires wallet approval — no silent background signing

### Timestamps
Case creation timestamps (`created_at`) are UTC Unix timestamps stored on-chain. GenLayer pins `datetime.now(timezone.utc)` to the transaction block timestamp, making it deterministic across all validators.

---

## Dispute Categories

| Category | Examples |
|---|---|
| Commerce Disputes | Trade disagreements, payment conflicts, delivery failures |
| DAO Governance | Treasury allocation, proposal conflicts, voting disputes |
| Prediction Markets | Ambiguous resolutions, outcome interpretation |
| Service Disputes | SLA violations, quality of service, performance claims |
| Agent Agreements | Autonomous agent conflicts, multi-party disagreements |
| Contract Interpretation | Ambiguous terms, competing interpretations, scope disputes |

---

## On-Chain Reputation

Every user who submits a verdict decision earns reputation points. The contract tracks five ranks:

| Rank | Min Score | Min Cases | Min Accuracy |
|---|---|---|---|
| Novice Arbiter | 0 | 0 | 0% |
| Trusted Judge | 100 | 5 | 50% |
| Consensus Architect | 500 | 20 | 65% |
| Master Adjudicator | 1,500 | 50 | 75% |
| Grand Adjudicator | 5,000 | 100 | 85% |

---

## Links

- **Live App:** https://court-of-agents.vercel.app
- **GitHub:** https://github.com/Olawalter/court-of-agents
- **GenLayer:** https://www.genlayer.com
- **GenLayer Docs:** https://docs.genlayer.com
- **GenLayer Studio:** https://studio.genlayer.com
