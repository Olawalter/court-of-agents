-- Court of Agents Database Schema
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
