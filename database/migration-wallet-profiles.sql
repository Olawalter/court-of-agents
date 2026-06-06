-- Migration: Wallet-based profiles
-- Run this in Supabase SQL Editor

-- Create wallet_profiles table (address-based identity)
CREATE TABLE IF NOT EXISTS wallet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast address lookups (normalised lowercase)
CREATE INDEX IF NOT EXISTS idx_wallet_profiles_address ON wallet_profiles(address);

-- Enable RLS
ALTER TABLE wallet_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Wallet profiles are viewable by everyone"
  ON wallet_profiles FOR SELECT USING (true);

-- Anyone can create a profile (wallet self-registration)
CREATE POLICY "Anyone can create wallet profile"
  ON wallet_profiles FOR INSERT WITH CHECK (true);

-- Anyone can update (in production, add signature verification)
CREATE POLICY "Anyone can update wallet profile"
  ON wallet_profiles FOR UPDATE USING (true);

-- Grant access
GRANT ALL ON wallet_profiles TO anon;
GRANT ALL ON wallet_profiles TO authenticated;
GRANT ALL ON wallet_profiles TO service_role;
