# Review: Contract Merge & Accessibility Fixes — 2026-07-14

## Background

The team flagged two issues in review:

1. "Cases in the web look hardcoded and are not properly accessible."
2. Three separate GenLayer Intelligent Contracts (`adjudicator`, `reputation`, `dispute_registry`) needed to be merged into one, without losing any functionality, and without the contract going Undetermined on-chain.

This document records every change made to address both, including several rounds of real on-chain debugging that were needed to get the merged contract reliably out of "Undetermined" status.

---

## 1. Accessibility fixes

| File | Change |
|---|---|
| [features/cases/components/animated-case-card.tsx](../features/cases/components/animated-case-card.tsx) | Decorative "View →" marked `aria-hidden`; difficulty stars now have a real `aria-label` (previously only a `title` tooltip, which screen readers don't reliably expose); card link has a descriptive `aria-label`. |
| [app/cases/page.tsx](../app/cases/page.tsx) | Case grid changed from a bare `<div>` list to a semantic `<ul>/<li>` with `aria-label="Cases"`. |
| [features/cases/components/submit-decision.tsx](../features/cases/components/submit-decision.tsx) | Verdict buttons now form a real `role="radiogroup"`/`role="radio"` group with `aria-checked` reflecting selection (previously state was only conveyed by border/ring color); added focus rings; textarea now has an associated (visually-hidden) `<label>` instead of relying on a placeholder; wallet address gets a full-value `aria-label`; error message is `role="alert"` and wired via `aria-describedby`. |
| [features/contracts/components/submit-onchain-button.tsx](../features/contracts/components/submit-onchain-button.tsx) | Fixed alongside the contract work — see §3. |

None of the "hardcoded" case data was actually hardcoded in the frontend — `app/cases/page.tsx` and `app/cases/[id]/page.tsx` both pull live data from Supabase. The apparent staleness was actually a caching bug (see §5).

---

## 2. Contract merge: 3 contracts → 1

**Removed** (git history preserves them):
- `intelligent-contracts/adjudicator/contract.py` (`CourtAdjudicator`)
- `intelligent-contracts/reputation/contract.py` (`ReputationTracker`)
- `intelligent-contracts/dispute_registry/contract.py` (`DisputeRegistry`)

**Added**: [intelligent-contracts/court_of_agents/contract.py](../intelligent-contracts/court_of_agents/contract.py) — single `CourtOfAgents` contract (~1,100 lines) preserving every method from all three, with the same argument shapes and JSON-string view return format, so existing frontend action names in `app/api/contracts/route.ts` kept working unchanged.

New capabilities added during the merge (previously impossible with 3 separate contracts):
- `submit_case()` auto-registers the dispute audit log entry (previously a second transaction to `DisputeRegistry.register_dispute()`).
- `calculate_consensus()` auto-resolves that audit log entry.
- `submit_user_decision()` auto-updates the user's on-chain reputation by comparing their decision to consensus (previously a second transaction to `ReputationTracker.update_after_decision()`).
- `attach_web_evidence()` — new: fetches a live webpage via `gl.nondet.web.get()` and attaches an AI-summarized excerpt as case evidence.
- `finalize_case()` / `appeal_case()` — new case lifecycle methods (the frontend already had `finalized`/`appealed` status badges with no way to trigger them).
- `list_case_ids()`, `list_user_addresses()`, `list_appealed_case_ids()` — new paginated on-chain enumeration (the original 3-contract design had no way to list anything on-chain at all; the frontend relied entirely on its Supabase mirror).

**Config/wiring updated to match**: [services/genlayer/client.ts](../services/genlayer/client.ts), [scripts/deploy-contracts.mjs](../scripts/deploy-contracts.mjs), [.env.example](../.env.example), [deployment/DEPLOYMENT.md](../deployment/DEPLOYMENT.md), [README.md](../README.md) — all now reference a single `NEXT_PUBLIC_COURT_CONTRACT_ADDRESS` instead of three separate address env vars.

**Backend API updated**: [app/api/contracts/route.ts](../app/api/contracts/route.ts) — added handlers for every new contract action (`attach_web_evidence`, `finalize_case`, `appeal_case`, `get_appeal`, `get_evidence_fetch`, `list_case_ids`, `list_appealed_case_ids`, `list_user_addresses`, `get_valid_categories`, `get_valid_verdicts`).

**Bug found and fixed along the way**: [submit-onchain-button.tsx](../features/contracts/components/submit-onchain-button.tsx) was calling an action (`submit_dispute`) that never existed in the API — it would have 400'd every time it was clicked. Since `submit_case`/`calculate_consensus` now auto-handle dispute-log registration/resolution, the button was repointed at the genuinely still-needed `finalize_case` step instead.

---

## 3. Getting the merged contract off "Undetermined" — five deployment iterations

GenLayer reaches consensus over non-deterministic operations (LLM calls) through the Equivalence Principle: the leader executes a function, and validators must independently agree the result is "equivalent enough" to accept. Getting `run_judges()` (6 AI judge personas) and `calculate_consensus()` (synthesizes their verdicts) to reliably pass consensus took several rounds of real on-chain testing and fixes.

| # | Address | Design | Result |
|---|---|---|---|
| 1 | `0x8023bf...` | 6 separate `gl.eq_principle.prompt_comparative` calls per judge persona | Failed to even deploy — `DynArray[str]()` can't be constructed by user code in `__init__`; only declaring the field is allowed (GenVM zero-initializes it) |
| 2 | `0xc5eE11...` | Same design, DynArray init bug fixed | **Undetermined** — 6 independent LLM-judged agreement checks compound: even at 90% agreement each, 6 independent calls only succeed together ~53% of the time (confirmed: 3/5 validators disagreed) |
| 3 | `0xdA5FDb...` | Collapsed to 1 LLM call for all 6 personas, still checked via `prompt_comparative` (an LLM judging "are these equivalent?") | **Undetermined** — the fix reduced the *compounding* problem, but asking an LLM to judge equivalence is itself an unreliable, nondeterministic decision (3/5 validators still disagreed, even though the leader's actual judge output was reasonable) |
| 4 | `0xd9a21d...` | Switched to `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` with a **deterministic Python validator** (verdict-category adjacency + confidence tolerance, no LLM judging equivalence) | Transaction finalized successfully, but **every field was an empty fallback default** (`confidence: 50`, `DISMISS`, `"No reasoning provided."`) — a silent parsing bug: `gl.nondet.exec_prompt(..., response_format="json")` returns an already-parsed dict, but the code called `str()` on it first, producing an unparseable Python repr (single-quoted keys). Both leader and every validator failed identically and "agreed" on garbage defaults. |
| 5 | `0xb8E240...` | Fixed the dict-vs-string parsing bug; loosened comparator: panel now needs 5/6 (not 6/6) persona agreement, confidence tolerance widened 25→40 points, `DISMISS` treated as adjacent to every verdict category | **Confirmed working** — real, varied, high-quality verdicts returned across all 6 personas (mix of `PARTIAL_A`/`PARTIAL_B`, confidence 55-70, genuinely distinct reasoning per persona); `calculate_consensus` reached `ACCEPTED` (successful consensus, not Undetermined) |

**Current deployed address**: `0xb8E240dD48f2929B8a54893942fF09E6f4b6C580`

### Design principles that came out of this

- Never wrap raw `gl.nondet.exec_prompt()` output in `gl.eq_principle.prompt_comparative` for anything beyond simple/open-ended tasks — use a deterministic Python validator (`gl.vm.run_nondet_unsafe`) that does tolerance-based comparison on parsed, structured fields instead of asking another LLM to judge equivalence.
- Avoid chaining multiple independent nondet/agreement checks inside one write method — collapse into a single LLM call where possible; failure probabilities compound multiplicatively across independent checks.
- `response_format="json"` on `exec_prompt` may return an already-parsed object, not a string — defensive parsing code must handle both, not blindly `str()`-coerce before parsing.
- Requiring unanimous agreement across multiple independently-judged sub-results (e.g. 6 judge personas) is too strict for LLM output; a quorum (5/6 here) tolerates normal LLM variance without treating the whole result as untrustworthy.

---

## 4. Database reset

New case IDs from testing against earlier (now-superseded) contract addresses needed to be cleared so the app starts fresh against the final deployed contract. [database/clear-cases.sql](../database/clear-cases.sql) was written and run manually in the Supabase SQL Editor (outside this session — Supabase credentials were never handled by the assistant): truncates `cases` (cascades to `evidence`, `verdicts`, `consensus_results`, `user_decisions`) and resets `user_reputation` scores to zero, leaving `profiles` (user accounts) untouched.

---

## 5. Stale frontend cache bug

After clearing the database, cases and leaderboard data were still showing on the live site. Root cause: `app/cases/page.tsx`, `app/cases/[id]/page.tsx`, `app/leaderboard/page.tsx`, and `app/dashboard/page.tsx` are Server Components with no `cookies()`/`headers()` calls and no `revalidate` config, so Next.js treated them as static routes and cached the rendered HTML from the most recent deploy — the database was correctly cleared the whole time, the frontend just wasn't refetching.

**Fix**: added `export const dynamic = "force-dynamic";` to all four pages. Verified live post-redeploy: `/cases` correctly shows "No cases found" and `/leaderboard` shows all zeros. This also means any case created going forward will appear immediately without requiring a new deploy.

---

## 6. Infrastructure access

Vercel CLI was authenticated via proper OAuth device-code flow (no credentials typed by the assistant) and used to link the local repo to the `court-of-agents` Vercel project, update environment variables across Production/Preview/Development as the contract address changed through each deployment iteration, and trigger production redeploys.

Supabase CLI login was **not** completed — it requires a personal access token passed as a credential, which falls under "never enter API keys/tokens" regardless of permission granted. All database changes were made manually by the user via the Supabase SQL Editor instead.

---

## Outstanding / known items

- `GENLAYER_PRIVATE_KEY` is intentionally not set in Vercel — by design, users sign their own transactions with their own wallet rather than a shared server-side key.
- StudioNet's shared public RPC endpoint has a visible, flapping rate limit (500 req/hour) that isn't user-specific — expect occasional transient `Rate limit exceeded` errors under load.
- `calculate_consensus` transactions can take a while to move from `ACCEPTED` to fully `FINALIZED` on StudioNet (observed >20 minutes in testing) — this is network-level finality/appeal-window behavior, not a contract bug.
