# Review Reply — Court of Agents

**Date:** 2026-07-15
**Review feedback received:** "Cases in the web look hardcoded and are not properly accessible"

---

## Summary

The team review flagged that cases appeared hardcoded and lacked proper accessibility. This document describes all changes made in response to that feedback. The work went further than accessibility fixes — it turned into a full architectural redesign that makes cases genuinely dynamic, two-party, and wallet-verified.

---

## 1. Accessibility Fixes

**Problem:** Case data was rendered as static strings in the UI with no semantic structure, no ARIA attributes, and no meaningful labels for screen readers. Wallet addresses were displayed as raw hex with no context.

**Changes:**
- All wallet address displays now include `aria-label` attributes (e.g. `aria-label="wallet address 0x1234...abcd"`) so screen readers announce the full address rather than reading out hex character by character.
- Status badges use semantic `role` and color contrast that meets WCAG AA.
- Error messages use `role="alert"` so they are announced immediately by screen readers.
- All form inputs have explicit `<label>` elements linked via `htmlFor`/`id` — no placeholder-only labels.
- Added `export const dynamic = "force-dynamic"` to all four server-component pages so case data is always fetched fresh from Supabase rather than served from a stale Next.js static cache (this was the root cause of cases appearing "hardcoded").

---

## 2. Contract Architecture: 3 Contracts → 1

**Problem:** The original design had three separate Intelligent Contracts (Adjudicator, Reputation, DisputeRegistry) at three different addresses. This fragmented state, complicated deployment, and made cross-contract calls unreliable.

**Change:** All three contracts were merged into a single `CourtOfAgents` contract at:

```
0xb468b1db949E7B40Be2bb8E6e33C1802d171524B
```

The merged contract is ~1,370 lines and handles case lifecycle, judge panel, consensus, reputation, and the dispute audit log in one place. One address, one deployment, one source of truth.

---

## 3. Two-Party Case Lifecycle

**Problem:** The original design required Agent A to fill in both sides of the dispute at creation time — claim_a and claim_b were both submitted by the same wallet. This meant Agent B had no real presence or verified identity on-chain.

**Change:** The case lifecycle is now genuinely two-party:

| Step | Who | What |
|---|---|---|
| `submit_case()` | Claimant wallet | Creates case, names a respondent wallet address; `claim_b` is null; status = `awaiting_response` |
| `respond_to_case()` | Respondent wallet only | Submits the counter-claim; enforced on-chain via `gl.message.sender_address`; status → `pending` |
| `attach_web_evidence()` | Either party | Fetches and verifies a URL; status stays `pending` |
| `run_judges()` | Either party | Triggers the 6-judge panel; requires `evidence_count > 0` |
| `calculate_consensus()` | Either party | Synthesizes verdict |
| `appeal_case()` | Claimant or respondent only | Reopens case; verified on-chain |

**Key enforcement detail:** The contract stores `respondent_address` at case creation. When `respond_to_case()` is called, it checks `Address(case_data["respondent_address"]) != gl.message.sender_address` and raises if the caller is not the named respondent. The same pattern is used for `appeal_case()` — both claimant and respondent addresses are checked on-chain, not in the frontend.

**New components added:**
- `features/cases/components/respond-to-case.tsx` — Shows to the named respondent; shows a "waiting" message to the claimant; shows a "not your case" message to everyone else.
- `features/cases/components/appeal-case.tsx` — Only visible to claimant and respondent after `consensus_reached`; submits appeal on-chain.

**Database migration:** `database/migration-two-party-cases.sql`
- `claim_b` made nullable (it doesn't exist until `respond_to_case()` is called)
- Added `claimant_address`, `respondent_address`, `appeal_round` columns
- Updated `cases_status_check` constraint to include `awaiting_response`
- Updated `evidence_submitted_by_check` to include `claimant` and `respondent`
- Indexes on both address columns

---

## 4. Required On-Chain Web Evidence

**Problem:** Evidence was optional free text. Users could type anything as "evidence" with no verification. The judges were evaluating unverified assertions.

**Change:** Evidence is now fetched and verified on-chain before judges can run.

**How it works:**
1. A party calls `attach_web_evidence(case_id, url, label)`.
2. The contract calls `gl.nondet.web.get(url)` inside a nondet block.
3. GenLayer validators independently re-fetch the same URL and reach consensus on the content.
4. An LLM summarizes only what is genuinely on the page (capped at 6,000 chars fetched, 4,000 stored).
5. The verified summary is stored on-chain under the case. `evidence_count` is incremented.
6. `run_judges()` raises if `evidence_count == 0`.

**New component:** `features/cases/components/attach-evidence.tsx`
- Shows only to claimant and respondent (wallet address check)
- Calls the contract, reads back the verified summary, mirrors it to Supabase for fast display
- Shows an amber warning when `evidence_count == 0` so parties know judges cannot run yet

**New API route:** `app/api/evidence/route.ts` — mirrors verified evidence into Supabase with `credibility_score: 90` (reflecting that the content was fetched and LLM-verified by GenLayer consensus, not a bare user assertion).

---

## 5. Judge Panel Reliability Fix

**Problem:** `run_judges()` was returning `Undetermined` on every call. Multiple approaches were tried (multiple separate LLM calls, `prompt_comparative`, etc.) before finding the root cause.

**Fix:** Switched to a single `gl.vm.run_nondet_unsafe` call that runs all six judges in one LLM prompt. The validator function is a deterministic Python function (5-of-6 quorum with 40-point confidence tolerance) rather than a second LLM call. This reliably finalizes and never returns `Undetermined`.

---

## 6. Consensus Fix: Float Encoding Bug

**Problem:** `calculate_consensus()` was returning `INTERNAL_ERROR` on every call. The root cause was a `TypeError: not calldata encodable 1.0: float key 'agreement_ratio'` — the GenVM calldata encoder cannot serialize Python `float` values across the nondet leader/validator boundary.

**Fix:** `agreement_ratio_pct` is stored as an `int` (0–100) inside the nondet boundary. It is converted back to a float only after the nondet call returns (at that point it goes into a JSON string, which is safe). This completely resolved the crash.

---

## 7. Files Changed

| File | Change |
|---|---|
| `intelligent-contracts/court_of_agents/contract.py` | Full rewrite: merged 3 contracts, two-party lifecycle, required web evidence, judge panel fix, consensus float fix |
| `app/api/contracts/route.ts` | Updated handlers for `submit_case`, `respond_to_case`, `attach_web_evidence`, `appeal_case` |
| `app/api/cases/route.ts` | Stores `claimant_address`, `respondent_address`, `claim_b: null`, `status: awaiting_response` |
| `app/api/evidence/route.ts` | New: mirrors verified web evidence into Supabase |
| `app/cases/create/page.tsx` | Removed pre-filled Agent B fields; added respondent wallet address field |
| `app/cases/[id]/page.tsx` | Added `RespondToCase`, `AttachEvidence`, `AppealCase` components; `awaiting_response` status badge; guarded `claimB` nullability |
| `features/cases/components/respond-to-case.tsx` | New: respondent-only counter-claim submission |
| `features/cases/components/attach-evidence.tsx` | New: on-chain URL fetch + verified evidence attachment |
| `features/cases/components/appeal-case.tsx` | New: claimant/respondent-only appeal flow |
| `features/cases/components/run-judges-button.tsx` | Disabled when `hasEvidence` is false; amber warning added |
| `lib/validators.ts` | `claim_b` nullable; added `claimant_address`, `respondent_address`; added `respondToCaseSchema` |
| `database/migration-two-party-cases.sql` | New: all schema changes for two-party lifecycle |
| `README.md` | Updated to reflect merged contract, new lifecycle, new contract address |

---

## Deployment

- Contract deployed at `0xb468b1db949E7B40Be2bb8E6e33C1802d171524B` on GenLayer StudioNet
- Vercel production updated with new contract address
- Supabase migration applied
- All code pushed to `main`
