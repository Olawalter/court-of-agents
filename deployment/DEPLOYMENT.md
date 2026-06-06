# Court of Agents — Deployment Guide

## Prerequisites

- Node.js 20+
- npm
- Vercel account
- Supabase project (already set up)
- GenLayer account with GEN tokens on StudioNet

---

## Step 1: GenLayer Contract Deployment

### 1.1 Generate a GenLayer account

```powershell
node scripts/deploy-contracts.mjs
```

This will generate a private key and address if none is set.
Save the private key in `.env.local` as `GENLAYER_PRIVATE_KEY`.

### 1.2 Fund the account

Go to StudioNet and fund your account address with GEN tokens.

### 1.3 Deploy contracts

```powershell
$env:GENLAYER_PRIVATE_KEY = "your-private-key"
node scripts/deploy-contracts.mjs
```

Save the output contract addresses to `.env.local`:
- `NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS`

---

## Step 2: Vercel Deployment

### 2.1 Install Vercel CLI

```powershell
npm install -g vercel
```

### 2.2 Initialize git

```powershell
git init
git add -A
git commit -m "Court of Agents v1.0"
```

### 2.3 Deploy

```powershell
vercel --prod
```

### 2.4 Set environment variables

In Vercel Dashboard > Settings > Environment Variables, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | `https://studio.genlayer.com/api` |
| `NEXT_PUBLIC_GENLAYER_CHAIN_ID` | `61999` |
| `GENLAYER_PRIVATE_KEY` | Your GenLayer private key |
| `NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS` | From deploy output |
| `NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS` | From deploy output |
| `NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS` | From deploy output |

### 2.5 Redeploy

```powershell
vercel --prod
```

---

## Step 3: Supabase Production

1. In Supabase Dashboard, ensure RLS policies are active
2. Verify all tables have the correct grants
3. Consider enabling email confirmation for production
4. Set up database backups

---

## Verification

After deployment, verify:

1. Landing page loads at your Vercel URL
2. `/cases` shows seed data
3. `/login` and `/register` work
4. Running judges on a case produces verdicts
5. Consensus calculation works
6. Submit On-Chain button connects to StudioNet (if contracts deployed)
