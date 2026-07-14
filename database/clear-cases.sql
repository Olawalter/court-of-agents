-- Court of Agents — Clear all case data
--
-- Run this in the Supabase SQL Editor before pointing the app at the new
-- CourtOfAgents contract (0x8023bf1830499818f790479A19301c0A67d42Ae3). The
-- old cases were adjudicated/finalized against the previous 3-contract
-- deployment and their on-chain tx hashes / consensus ids no longer
-- correspond to anything at the new address, so they need to start fresh.
--
-- This clears cases and everything that hangs off a case_id via FK cascade
-- (evidence, verdicts, consensus_results, user_decisions). It leaves
-- `profiles` untouched (user accounts) and resets `user_reputation` scores
-- to zero rather than deleting the rows, since reputation is a per-user
-- running total that should restart clean alongside the new contract's own
-- on-chain reputation tracking rather than orphaning rows tied to
-- now-deleted user_decisions.

begin;

-- cases cascades into evidence, verdicts, consensus_results, user_decisions
truncate table cases cascade;

-- Reset reputation state so leaderboard numbers reflect only decisions made
-- against the new contract going forward.
update user_reputation set
  rank = 'novice_arbiter',
  score = 0,
  total_cases = 0,
  correct_decisions = 0,
  accuracy = 0,
  streak = 0,
  best_streak = 0,
  participation_rate = 0,
  consistency_score = 0,
  onchain_score = null,
  updated_at = now();

commit;
