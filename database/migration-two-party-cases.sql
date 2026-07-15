-- Court of Agents — Two-party case lifecycle migration
--
-- Adds wallet-based claimant/respondent tracking to match the merged
-- CourtOfAgents contract's new submit_case()/respond_to_case() flow:
-- a case is now created by one wallet (the claimant) naming a specific
-- respondent wallet, who must separately call respond_to_case() before
-- claim_b exists and judges can run. Run this in the Supabase SQL Editor.

begin;

-- claim_b is no longer known at case-creation time — it's filled in later
-- by respond_to_case(), so it can't be NOT NULL anymore.
alter table cases alter column claim_b drop not null;

-- Wallet addresses for both parties. claimant_address is set at creation;
-- respondent_address is set at creation too (the invited wallet) but
-- respond_to_case() is what actually populates claim_b.
alter table cases add column if not exists claimant_address text;
alter table cases add column if not exists respondent_address text;

-- Tracks how many times a case has been appealed and re-run.
alter table cases add column if not exists appeal_round int not null default 0;

-- Expand the status enum to include the new "awaiting_response" state
-- that exists between case creation and the respondent's counter-claim.
alter table cases drop constraint if exists cases_status_check;
alter table cases add constraint cases_status_check
  check (status in ('awaiting_response','pending','in_review','deliberating','consensus_reached','appealed','finalized'));

-- New cases should start in awaiting_response rather than pending, since
-- claim_b won't exist yet.
alter table cases alter column status set default 'awaiting_response';

-- Evidence submitted_by needs to track actual wallet-verified party role
-- (claimant/respondent) rather than only the old agent_a/agent_b/system
-- labels, to match the contract's attach_web_evidence() tagging.
alter table evidence drop constraint if exists evidence_submitted_by_check;
alter table evidence add constraint evidence_submitted_by_check
  check (submitted_by in ('agent_a','agent_b','claimant','respondent','system'));

-- Index for looking up "cases where I'm the respondent" efficiently.
create index if not exists idx_cases_respondent on cases(respondent_address);
create index if not exists idx_cases_claimant on cases(claimant_address);

commit;
