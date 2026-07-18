/**
 * End-to-end on-chain test for Court of Agents.
 *
 * Flow:
 *   1. Key A  — submit_case (names Key B as respondent)
 *   2. Key B  — respond_to_case
 *   3. Key A  — attach_web_evidence (fetches a real URL on-chain)
 *   4. Key A  — run_judges          (6 AI judge personas)
 *   5. Key A  — calculate_consensus
 *   6. Either — get_verdicts + get_consensus (verified receipt from contract)
 *
 * Run:  node scripts/e2e-test.mjs
 */

import { createClient, createAccount, chains } from "genlayer-js";

// ── Config ────────────────────────────────────────────────────────────────────

const RPC       = "https://studio.genlayer.com/api";
const CONTRACT  = "0x3aabaEbd7F86B2dc32a6f4e1f371B7Ff3bE4e144";

const KEY_A = "0xb6958506c3e194c6dbed2cc601507320f68a8a1b2889c7a98cfa381ccbc3acce";
const KEY_B = "0x99aab047082873e94ab3704eabfe3f3f31d57760dcfe8acb53e89bf649711814";

const ADDR_A = "0x398911F78Fb27f7c85469C5D240314963c06dEf0";
const ADDR_B = "0x464Bb0d41fB830d0c177bcec20e041Ee06e7daBB";

// Unique case id for this test run
const CASE_ID = `test-${Date.now()}`;

// Evidence URL — small plain-HTML page, easy for GenLayer validators to fetch
const EVIDENCE_URL   = "https://etherscan.io/";
const EVIDENCE_LABEL = "Etherscan — Ethereum blockchain explorer";

// ── Helpers ───────────────────────────────────────────────────────────────────

function clientFor(privateKey) {
  const chain = { ...chains.studionet };
  chain.rpcUrls = { default: { http: [RPC] } };
  return createClient({ chain, account: createAccount(privateKey) });
}

// retries × interval = max wait time
// submit_case / respond_to_case: ~30 retries × 5s = 2.5 min
// attach_web_evidence:           ~60 retries × 5s = 5 min
// run_judges (6 AI calls):       ~240 retries × 5s = 20 min
// calculate_consensus:           ~120 retries × 5s = 10 min
const WAIT_OPTS = {
  default:  { retries:  30, interval: 5000 },
  evidence: { retries:  60, interval: 5000 },
  judges:   { retries: 240, interval: 5000 },
  consensus:{ retries: 120, interval: 5000 },
};

async function writeAndWait(client, functionName, args, label, waitOpts) {
  console.log(`\n  ⏳ ${label}`);
  const hash = await client.writeContract({
    value: BigInt(0),
    address: CONTRACT,
    functionName,
    args,
  });
  console.log(`     tx: ${hash}`);
  const opts = waitOpts ?? WAIT_OPTS.default;
  const maxMin = Math.round((opts.retries * opts.interval) / 60000);
  console.log(`     waiting for ACCEPTED (up to ~${maxMin} min)...`);
  await client.waitForTransactionReceipt({ hash, ...opts });
  console.log(`     ✓ finalized`);
  return hash;
}

async function readContract(client, functionName, args) {
  return client.readContract({ address: CONTRACT, functionName, args });
}

// ── Test ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("Court of Agents — End-to-End On-Chain Test");
  console.log("=".repeat(60));
  console.log(`Case ID   : ${CASE_ID}`);
  console.log(`Agent A   : ${ADDR_A}`);
  console.log(`Agent B   : ${ADDR_B}`);
  console.log(`Contract  : ${CONTRACT}`);
  console.log(`Evidence  : ${EVIDENCE_URL}`);

  const clientA = clientFor(KEY_A);
  const clientB = clientFor(KEY_B);

  // ── 1. submit_case ──────────────────────────────────────────────────────────
  console.log("\n[1/5] submit_case (Key A)");
  await writeAndWait(clientA, "submit_case", [
    CASE_ID,
    "Bitcoin Ownership Dispute",
    "Two parties claim rights to the same Bitcoin wallet based on conflicting transfer records.",
    "commerce",
    3,
    "CryptoGuard AI",
    "The wallet was transferred to Agent A via a signed transaction on 2024-01-15.",
    "The blockchain transfer record shows a valid cryptographic signature from the original owner to Agent A address. Agent A has transaction proof.",
    ADDR_B,
    "No additional context beyond on-chain records.",
  ], "submit_case");

  // ── 2. respond_to_case ─────────────────────────────────────────────────────
  console.log("\n[2/5] respond_to_case (Key B)");
  await writeAndWait(clientB, "respond_to_case", [
    CASE_ID,
    "LedgerWatch AI",
    "The wallet was never validly transferred — the transaction was reverted.",
    "The signed transaction Agent A references was submitted but then reverted due to a double-spend attempt. On-chain state shows the wallet still belongs to Agent B. Agent B holds the original seed phrase.",
  ], "respond_to_case");

  // ── 3. attach_web_evidence ─────────────────────────────────────────────────
  console.log("\n[3/5] attach_web_evidence (Key A — fetches URL on-chain)");
  console.log("     Note: GenLayer validators will independently re-fetch this URL.");
  await writeAndWait(clientA, "attach_web_evidence", [
    CASE_ID,
    EVIDENCE_URL,
    EVIDENCE_LABEL,
  ], "attach_web_evidence (on-chain fetch)", WAIT_OPTS.evidence);

  // Read back the verified summary
  const evidenceRaw = await readContract(clientA, "get_evidence_fetch", [CASE_ID, EVIDENCE_URL]);
  if (evidenceRaw) {
    const ev = JSON.parse(evidenceRaw);
    console.log(`     verified summary: "${ev.summary?.substring(0, 120)}..."`);
  }

  // ── 4. run_judges ───────────────────────────────────────────────────────────
  console.log("\n[4/5] run_judges (Key A — 6 AI judge personas)");
  await writeAndWait(clientA, "run_judges", [CASE_ID], "run_judges", WAIT_OPTS.judges);

  // Read verdicts directly from the contract
  const verdictsRaw = await readContract(clientA, "get_verdicts", [CASE_ID]);
  if (!verdictsRaw) throw new Error("get_verdicts returned empty — run_judges may not have finalized");
  const verdicts = JSON.parse(verdictsRaw);

  console.log("\n  Judge Verdicts (from get_verdicts — receipt-confirmed):");
  console.log("  " + "-".repeat(56));
  for (const v of verdicts) {
    console.log(`  ${v.persona.padEnd(10)} | ${v.verdict.padEnd(10)} | ${v.confidence}% | ${v.reasoning.substring(0, 60)}...`);
  }

  // ── 5. calculate_consensus ─────────────────────────────────────────────────
  console.log("\n[5/5] calculate_consensus (Key A)");
  await writeAndWait(clientA, "calculate_consensus", [CASE_ID], "calculate_consensus", WAIT_OPTS.consensus);

  // Read consensus from the contract
  const consensusRaw = await readContract(clientA, "get_consensus", [CASE_ID]);
  if (!consensusRaw) throw new Error("get_consensus returned empty");
  const consensus = JSON.parse(consensusRaw);

  console.log("\n" + "=".repeat(60));
  console.log("FINAL CONSENSUS (from get_consensus — receipt-confirmed)");
  console.log("=".repeat(60));
  console.log(`Verdict      : ${consensus.final_verdict}`);
  console.log(`Confidence   : ${consensus.overall_confidence}%`);
  console.log(`Agreement    : ${Math.round(consensus.agreement_ratio * 100)}%`);
  console.log(`Method       : ${consensus.method}`);
  console.log(`Explanation  : ${consensus.resolution_explanation}`);
  console.log(`Judges       : ${consensus.participating_judges.join(", ")}`);
  console.log("=".repeat(60));
  console.log("\n✅ Test complete — all adjudication data came from the contract.");
}

main().catch((err) => {
  console.error("\n❌ Test failed:", err.message || err);
  process.exit(1);
});
