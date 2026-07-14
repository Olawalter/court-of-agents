# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
#
# Court of Agents — Unified Intelligent Contract
# =================================================
#
# This single contract replaces three previously-separate contracts:
#   - intelligent-contracts/adjudicator/contract.py    (CourtAdjudicator)
#   - intelligent-contracts/reputation/contract.py      (ReputationTracker)
#   - intelligent-contracts/dispute_registry/contract.py (DisputeRegistry)
#
# All three sets of storage and public methods are preserved here under one
# deployed address so the frontend only has to talk to a single contract.
# Reputation updates and the dispute audit log are now wired directly into
# the adjudication flow instead of requiring the frontend to make three
# separate transactions against three separate contracts.
#
# --- Why the LLM calls are structured the way they are ------------------
#
# GenLayer reaches consensus over non-deterministic operations (LLM calls,
# web fetches) through the Equivalence Principle: the leader node executes
# a function and produces a result; validator nodes independently execute
# (or judge) that result and vote on whether it is "equivalent enough" to
# accept. A raw `gl.nondet.exec_prompt(...)` call by itself is NOT
# consensus-safe — it must be wrapped so validators have a way to agree.
#
# Two wrapping strategies are used in this contract:
#
#   1. `gl.eq_principle.prompt_comparative(fn, principle=...)`
#      Both the leader and each validator independently execute `fn`
#      (which itself calls the LLM), and a comparison LLM judges whether
#      the two outputs satisfy `principle`. This is the correct tool for
#      subjective, judgment-based tasks — exactly what a judge persona or
#      a consensus synthesis is. It is used for every judge/consensus call
#      in this contract.
#
#   2. `gl.eq_principle.prompt_non_comparative(fn, task=..., criteria=...)`
#      `fn` fetches raw data (e.g. a webpage) that is identical on every
#      node; the leader performs `task` on that data, and validators only
#      check the leader's output against `criteria` (they do not redo the
#      task themselves). This fits open-ended tasks like "summarize this
#      article" where two independently-generated summaries could be
#      completely different in wording yet equally valid. It is used only
#      for the optional web-evidence summarization feature below.
#
# The `principle` / `criteria` text in every wrapper below is intentionally
# LENIENT: it asks validators to accept near-agreement (matching category,
# confidence within a tolerance band, similar reasoning) rather than exact
# string equality. Exact-match comparison of natural-language LLM output is
# the single biggest cause of transactions ending in "Undetermined" status,
# because two independent LLM calls essentially never produce byte-identical
# text. Every wrapper here is deliberately tuned to still reject genuinely
# different judgments (e.g. FAVOR_A vs FAVOR_B, or wildly different
# confidence) while tolerating wording drift, so the contract stays both
# safe (bad-faith or wildly divergent leader output is rejected) and live
# (normal LLM variance does not stall consensus).
#
# --------------------------------------------------------------------------

from genlayer import *
import json


# ============================================================================
# Module-level constants
# ============================================================================

VALID_VERDICTS = ("FAVOR_A", "FAVOR_B", "PARTIAL_A", "PARTIAL_B", "DISMISS")

VALID_STATUSES = (
    "pending",
    "deliberating",
    "consensus_reached",
    "appealed",
    "finalized",
)

# The six judge personas. Each brings a different lens to the same dispute so
# that `calculate_consensus` has a genuinely diverse set of opinions to
# synthesize rather than six copies of the same reasoning.
JUDGE_PERSONAS = [
    (
        "commerce",
        "You are the Commerce Judge. You specialize in trade disputes and "
        "commercial agreements. You prioritize fair market practices and "
        "contractual obligations.",
    ),
    (
        "consumer",
        "You are the Consumer Judge. You advocate for consumer protection "
        "and fair dealing. You weigh power imbalances and information "
        "asymmetry.",
    ),
    (
        "contract",
        "You are the Contract Judge. You focus strictly on contractual "
        "terms and written agreements. You prioritize what was agreed upon "
        "in writing.",
    ),
    (
        "neutral",
        "You are the Neutral Judge. You provide the most balanced, "
        "impartial analysis possible with no domain bias.",
    ),
    (
        "risk",
        "You are the Risk Judge. You evaluate risk exposure, liability, "
        "and downstream consequences of each possible outcome.",
    ),
    (
        "genlayer",
        "You are the GenLayer Consensus Judge. You seek the most fair and "
        "reasonable outcome through decentralized reasoning principles.",
    ),
]

# Reputation ranks, ordered from highest to lowest requirement. Evaluated
# top-down so the first threshold that is satisfied wins.
RANK_THRESHOLDS = [
    ("grand_adjudicator", 5000, 100, 0.85),
    ("master_adjudicator", 1500, 50, 0.75),
    ("consensus_architect", 500, 20, 0.65),
    ("trusted_judge", 100, 5, 0.50),
    ("novice_arbiter", 0, 0, 0.0),
]

# Verdict categories that are considered "adjacent" for the purpose of
# judging whether two independent judge calls roughly agree. This is used
# directly by the deterministic Python validators (`_verdicts_adjacent`) —
# it IS the acceptance rule, not just prompt guidance. Deliberately wide:
# DISMISS is treated as compatible with everything (a "no strong fault"
# judgment from one run and a "slight lean" judgment from another run of
# the same underlying facts are not a real disagreement), and each FAVOR
# is compatible with its own PARTIAL. FAVOR_A/FAVOR_B remain mutually
# exclusive, and PARTIAL_A/PARTIAL_B remain mutually exclusive, since those
# really are opposite conclusions that should NOT be smoothed over — only
# genuinely opposite outcomes should ever cause real disagreement.
ADJACENT_VERDICTS = {
    "FAVOR_A": ("FAVOR_A", "PARTIAL_A", "DISMISS"),
    "PARTIAL_A": ("PARTIAL_A", "FAVOR_A", "DISMISS"),
    "FAVOR_B": ("FAVOR_B", "PARTIAL_B", "DISMISS"),
    "PARTIAL_B": ("PARTIAL_B", "FAVOR_B", "DISMISS"),
    "DISMISS": ("DISMISS", "FAVOR_A", "PARTIAL_A", "FAVOR_B", "PARTIAL_B"),
}

MAX_EVIDENCE_FETCH_CHARS = 6000  # cap raw fetched text before handing to the LLM
MAX_STORED_FIELD_CHARS = 4000    # defensive cap so a single field can't blow up storage

# Minimum number of the 6 judge personas that must agree (verdict-adjacent +
# within confidence tolerance) between leader and validator for the panel to
# be accepted. Unanimity (6/6) was tested on real StudioNet deployments and
# reliably triggered leader rotation -> Undetermined; 5/6 tolerates one
# persona's normal LLM variance without treating the whole panel as untrustworthy.
PANEL_AGREEMENT_QUORUM = 5
MAX_PAGE_SIZE = 100              # cap on any single paginated view call

VALID_CATEGORIES = (
    "commerce",
    "service",
    "prediction_market",
    "dao_governance",
    "agent_agreement",
    "contract_interpretation",
)


# ============================================================================
# Small deterministic helpers (no LLM / no web access — pure Python)
# ============================================================================

def _clamp_int(value, lo, hi, default):
    """Best-effort int coercion + clamp. Never raises."""
    try:
        v = int(value)
    except (TypeError, ValueError):
        return default
    if v < lo:
        return lo
    if v > hi:
        return hi
    return v


def _clamp_float(value, lo, hi, default):
    try:
        v = float(value)
    except (TypeError, ValueError):
        return default
    if v < lo:
        return lo
    if v > hi:
        return hi
    return v


def _truncate(text, max_len):
    if text is None:
        return ""
    text = str(text)
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def _strip_code_fences(text):
    """LLMs frequently wrap JSON in ```json ... ``` fences. Strip them."""
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        t = "\n".join(lines).strip()
    return t


def _first_json_object(text):
    """
    Extract the first top-level {...} object from a string, tolerating
    leading/trailing prose the model may have added despite instructions.
    """
    start = text.find("{")
    if start == -1:
        return text
    depth = 0
    for i in range(start, len(text)):
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return text[start:]


def _parse_json_loose(raw_text):
    """
    Defensive JSON parsing for LLM output. Never raises — returns an empty
    dict on failure so callers can apply their own fallback/defaults rather
    than crashing the whole transaction on a single malformed response.

    Accepts either a string OR an already-parsed dict/list. This matters
    because `gl.nondet.exec_prompt(..., response_format="json")` may return
    an already-decoded object rather than a raw string depending on the
    GenVM version — calling `str()` on a dict before parsing produces a
    Python repr with single-quoted keys, which is NOT valid JSON and always
    fails to parse. That failure was silent (falls back to `{}`) and
    happened identically for both the leader and every validator (since
    it's a systematic type mismatch, not LLM randomness), which meant the
    deterministic validators "agreed" on a set of empty defaults instead of
    on real judge output — a transaction that looks successful but contains
    garbage. Handling the dict case directly here fixes that at the root.
    """
    if isinstance(raw_text, dict):
        return raw_text
    if isinstance(raw_text, list):
        # Some providers wrap the object in a single-element array.
        for item in raw_text:
            if isinstance(item, dict):
                return item
        return {}
    if not raw_text:
        return {}
    candidate = _strip_code_fences(raw_text)
    candidate = _first_json_object(candidate)
    try:
        result = json.loads(candidate)
        if isinstance(result, dict):
            return result
        return {}
    except (json.JSONDecodeError, ValueError):
        # Last resort: drop trailing commas before the final brace and retry once.
        cleaned = candidate.replace(",}", "}").replace(",]", "]")
        try:
            result = json.loads(cleaned)
            if isinstance(result, dict):
                return result
        except (json.JSONDecodeError, ValueError):
            pass
        return {}


def _normalize_verdict(value):
    if not isinstance(value, str):
        return "DISMISS"
    v = value.strip().upper().replace(" ", "_").replace("-", "_")
    if v in VALID_VERDICTS:
        return v
    # Common aliasing the model might produce despite instructions.
    aliases = {
        "A": "FAVOR_A",
        "AGENT_A": "FAVOR_A",
        "B": "FAVOR_B",
        "AGENT_B": "FAVOR_B",
        "PARTIAL": "PARTIAL_A",
        "DISMISSED": "DISMISS",
        "NONE": "DISMISS",
    }
    return aliases.get(v, "DISMISS")


def _rank_for(score, cases, accuracy):
    for rank, min_score, min_cases, min_accuracy in RANK_THRESHOLDS:
        if score >= min_score and cases >= min_cases and accuracy >= min_accuracy:
            return rank
    return "novice_arbiter"


def _paginate_slice(length, offset, limit):
    """
    Clamp an (offset, limit) pair against a collection of the given length.
    Returns (start, end) indices safe to use in a slice. Never raises, so a
    caller passing a nonsensical offset/limit just gets an empty page back
    instead of an out-of-range error.
    """
    safe_offset = _clamp_int(offset, 0, max(length, 0), 0)
    safe_limit = _clamp_int(limit, 1, MAX_PAGE_SIZE, MAX_PAGE_SIZE)
    start = safe_offset
    end = min(length, start + safe_limit)
    return start, end


# ============================================================================
# The contract
# ============================================================================

class CourtOfAgents(gl.Contract):
    """
    Court of Agents — unified adjudication, reputation, and audit contract.

    Public write flow (mirrors the original 3-contract design 1:1 so the
    frontend's existing call sequence keeps working against one address):

      1. submit_case()            -> case stored, dispute auto-logged
      2. attach_web_evidence()    -> optional: pull live evidence from a URL
      3. run_judges()              -> 6 LLM judge personas deliberate
      4. calculate_consensus()     -> LLM synthesizes a final verdict,
                                       dispute log auto-resolved
      5. submit_user_decision()    -> a human records their own verdict;
                                       reputation is updated automatically
                                       by comparing it against consensus
      6. finalize_case() / appeal_case() -> lifecycle management
    """

    # --- Adjudicator storage -------------------------------------------------
    cases: TreeMap[str, str]
    case_ids: DynArray[str]
    verdicts: TreeMap[str, str]
    consensus_results: TreeMap[str, str]
    user_decisions: TreeMap[str, str]
    appeals: TreeMap[str, str]
    appealed_case_ids: DynArray[str]
    case_count: u256

    # --- Web-evidence storage -------------------------------------------------
    evidence_fetches: TreeMap[str, str]

    # --- Reputation storage (formerly ReputationTracker) ----------------------
    reputations: TreeMap[str, str]
    user_addresses: DynArray[str]
    user_count: u256

    # --- Dispute audit log (formerly DisputeRegistry) --------------------------
    dispute_log: TreeMap[str, str]
    total_disputes: u256
    total_resolved: u256

    def __init__(self) -> None:
        # DynArray[str] fields (case_ids, appealed_case_ids, user_addresses)
        # are NOT initialized here — GenVM storage collections can't be
        # constructed by user code (DynArray()/TreeMap() calls in __init__
        # raise "this class can't be instantiated by user"). Declaring the
        # field above is sufficient; GenVM zero-initializes it to an empty
        # collection automatically.
        self.cases = TreeMap[str, str]()
        self.verdicts = TreeMap[str, str]()
        self.consensus_results = TreeMap[str, str]()
        self.user_decisions = TreeMap[str, str]()
        self.appeals = TreeMap[str, str]()
        self.case_count = u256(0)

        self.evidence_fetches = TreeMap[str, str]()

        self.reputations = TreeMap[str, str]()
        self.user_count = u256(0)

        self.dispute_log = TreeMap[str, str]()
        self.total_disputes = u256(0)
        self.total_resolved = u256(0)

    # ========================================================================
    # Adjudicator: case lifecycle
    # ========================================================================

    @gl.public.write
    def submit_case(
        self,
        case_id: str,
        title: str,
        description: str,
        category: str,
        difficulty: int,
        claim_a_name: str,
        claim_a_summary: str,
        claim_a_argument: str,
        claim_b_name: str,
        claim_b_summary: str,
        claim_b_argument: str,
        evidence_summary: str,
    ) -> None:
        """
        Submit a new dispute case on-chain. Deterministic — no LLM or web
        calls, so this always succeeds without any consensus risk.

        Also writes a matching entry into the merged dispute audit log
        (formerly a separate transaction against DisputeRegistry).
        """
        if case_id in self.cases:
            raise Exception(f"Case '{case_id}' already exists")

        safe_category = category if category in VALID_CATEGORIES else "commerce"
        safe_difficulty = _clamp_int(difficulty, 1, 5, 3)

        case_data = json.dumps(
            {
                "case_id": case_id,
                "title": _truncate(title, MAX_STORED_FIELD_CHARS),
                "description": _truncate(description, MAX_STORED_FIELD_CHARS),
                "category": safe_category,
                "difficulty": safe_difficulty,
                "claim_a": {
                    "agent_name": claim_a_name,
                    "summary": _truncate(claim_a_summary, MAX_STORED_FIELD_CHARS),
                    "argument": _truncate(claim_a_argument, MAX_STORED_FIELD_CHARS),
                },
                "claim_b": {
                    "agent_name": claim_b_name,
                    "summary": _truncate(claim_b_summary, MAX_STORED_FIELD_CHARS),
                    "argument": _truncate(claim_b_argument, MAX_STORED_FIELD_CHARS),
                },
                "evidence_summary": _truncate(evidence_summary, MAX_STORED_FIELD_CHARS),
                "status": "pending",
            },
            sort_keys=True,
        )
        self.cases[case_id] = case_data
        self.case_ids.append(case_id)
        self.case_count = u256(int(self.case_count) + 1)

        # Auto-register in the merged audit log (previously a second
        # transaction to DisputeRegistry.register_dispute()).
        self._register_dispute(case_id, title, safe_category, claim_a_name)

    @gl.public.write
    def attach_web_evidence(self, case_id: str, url: str, label: str) -> None:
        """
        Fetch a live webpage and append an AI-generated summary of it to the
        case's evidence. This is the contract's "web access + web fetch"
        capability: GenVM validators fetch the SAME url independently (via
        `gl.nondet.web.get`) so the raw bytes are identical on every node;
        only the LLM-generated summary text needs consensus, which is
        reached through `prompt_non_comparative` (summarization is exactly
        the open-ended task type that wrapper is designed for).
        """
        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            raise Exception(f"Case '{case_id}' not found")

        def fetch_page_text() -> str:
            response = gl.nondet.web.get(url)
            body = response.body.decode("utf-8", errors="ignore")
            return body[:MAX_EVIDENCE_FETCH_CHARS]

        summary = gl.eq_principle.prompt_non_comparative(
            fetch_page_text,
            task=(
                "Summarize the key factual claims on this webpage in 3-5 "
                "sentences, focused on anything relevant to a commercial or "
                "contractual dispute (dates, amounts, commitments, "
                "statements of fact). Do not add opinions or invented facts."
            ),
            criteria="""
            Summary must be grounded only in content present on the page.
            Summary must be 3-5 sentences.
            Summary must not introduce facts, numbers, or claims that are
            not traceable to the fetched page content.
            Minor differences in wording or sentence order are acceptable.
            """,
        )

        summary_text = _truncate(str(summary).strip(), MAX_STORED_FIELD_CHARS)

        fetch_record = json.dumps(
            {
                "case_id": case_id,
                "url": _truncate(url, 500),
                "label": _truncate(label, 200),
                "summary": summary_text,
            },
            sort_keys=True,
        )
        fetch_key = f"{case_id}:{url}"
        self.evidence_fetches[fetch_key] = fetch_record

        # Fold the summary into the case's evidence_summary field so judges
        # see it automatically during run_judges().
        case_data = json.loads(case_raw)
        existing = case_data.get("evidence_summary", "")
        addition = f"\n[Web evidence — {label}] {summary_text}"
        case_data["evidence_summary"] = _truncate(existing + addition, MAX_STORED_FIELD_CHARS)
        self.cases[case_id] = json.dumps(case_data, sort_keys=True)

    @gl.public.write
    def run_judges(self, case_id: str) -> None:
        """
        Run all 6 AI judge personas on a case.

        DESIGN HISTORY (kept here because both failure modes were confirmed
        empirically on real StudioNet deployments and the reasoning matters
        for anyone touching this method again):

          v1 — 6 separate `gl.eq_principle.prompt_comparative` calls, one
          per persona. Each independently requires validator agreement, and
          the failure probabilities compound: even at 90% agreement per
          call, 6 independent calls only succeed together ~53% of the time
          (0.9^6). Went Undetermined in testing.

          v2 — collapsed to 1 LLM call producing all 6 verdicts, still
          checked via `prompt_comparative` (an LLM judging "are these two
          responses equivalent?"). This fixed the compounding problem but
          not the underlying one: asking an LLM to judge equivalence is
          ITSELF a nondeterministic decision prone to disagreement. Also
          went Undetermined in testing (majority of validators voted
          "disagree" even though the leader's actual judge output was
          perfectly reasonable).

          v3 (current) — 1 LLM call, validated with a DETERMINISTIC Python
          comparator (`gl.vm.run_nondet_unsafe`) instead of an LLM judge.
          Each validator independently re-runs the same panel prompt and
          the contract code (not an LLM) checks per-persona verdict
          category adjacency and confidence tolerance. This removes the
          extra nondeterministic judgment layer entirely — the only
          non-determinism left is the two LLM panel calls being compared,
          which is unavoidable and exactly what GenLayer's Equivalence
          Principle is designed to reconcile deterministically.
        """
        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            raise Exception(f"Case '{case_id}' not found")

        case_data = json.loads(case_raw)
        claim_a = case_data["claim_a"]
        claim_b = case_data["claim_b"]

        case_context = (
            f"Title: {case_data['title']}\n"
            f"Description: {case_data['description']}\n"
            f"Category: {case_data['category']}\n\n"
            f"CLAIM A ({claim_a['agent_name']}): {claim_a['summary']}\n"
            f"{claim_a['argument']}\n\n"
            f"CLAIM B ({claim_b['agent_name']}): {claim_b['summary']}\n"
            f"{claim_b['argument']}\n\n"
            f"EVIDENCE: {case_data['evidence_summary']}"
        )

        all_verdicts = self._run_judge_panel(case_context)

        self.verdicts[case_id] = json.dumps(all_verdicts, sort_keys=True)

        case_data["status"] = "deliberating"
        self.cases[case_id] = json.dumps(case_data, sort_keys=True)

    def _build_panel_prompt(self, case_context: str) -> str:
        persona_roster = "\n".join(
            f"{i + 1}. persona_id=\"{persona}\" — {system_prompt}"
            for i, (persona, system_prompt) in enumerate(JUDGE_PERSONAS)
        )
        return (
            "You are simulating a panel of 6 independent judges reviewing "
            "the SAME dispute, each from a different perspective. For EACH "
            "of the 6 personas below, produce your own independent "
            "evaluation as that persona — do not let one persona's opinion "
            "influence another's.\n\n"
            f"PERSONAS:\n{persona_roster}\n\n"
            f"DISPUTE TO EVALUATE:\n\n{case_context}\n\n"
            "Respond with ONLY a JSON object of the form:\n"
            '{"verdicts": [ {"persona": "<persona_id>", "verdict": '
            '"FAVOR_A|FAVOR_B|PARTIAL_A|PARTIAL_B|DISMISS", "confidence": '
            "<0-100>, \"reasoning\": \"<2-3 sentence explanation>\", "
            '"key_factors": ["<factor>", "<factor>"] }, ... ] }\n'
            "The `verdicts` array must contain EXACTLY 6 objects, one per "
            "persona listed above, in the same order, each using that "
            "persona's own persona_id."
        )

    def _parse_panel_response(self, raw_text) -> list:
        """
        Deterministic parsing/normalization of a panel LLM response into a
        fixed-order list of 6 verdict dicts. Called identically by the
        leader and by every validator (each on their own independently
        generated LLM text), so this function itself must be pure/
        deterministic given its input — all the non-determinism lives in
        the LLM call that produces `raw_text`, not in this parsing step.
        """
        parsed = _parse_json_loose(raw_text)
        raw_verdicts = parsed.get("verdicts")
        if not isinstance(raw_verdicts, list):
            raw_verdicts = []

        by_persona = {}
        for entry in raw_verdicts:
            if isinstance(entry, dict) and isinstance(entry.get("persona"), str):
                by_persona[entry["persona"].strip().lower()] = entry

        results = []
        for persona, _system_prompt in JUDGE_PERSONAS:
            entry = by_persona.get(persona, {})
            verdict = _normalize_verdict(entry.get("verdict"))
            confidence = _clamp_int(entry.get("confidence"), 0, 100, 50)
            reasoning = _truncate(entry.get("reasoning", "No reasoning provided."), 1000)
            key_factors = entry.get("key_factors")
            if not isinstance(key_factors, list):
                key_factors = []
            key_factors = [_truncate(str(f), 200) for f in key_factors[:5]]

            results.append(
                {
                    "persona": persona,
                    "verdict": verdict,
                    "confidence": confidence,
                    "reasoning": reasoning,
                    "key_factors": key_factors,
                }
            )

        return results

    @staticmethod
    def _verdicts_adjacent(a: str, b: str) -> bool:
        if a == b:
            return True
        return b in ADJACENT_VERDICTS.get(a, ()) or a in ADJACENT_VERDICTS.get(b, ())

    def _panel_equivalent(self, leader_verdicts: list, validator_verdicts: list) -> bool:
        """
        Deterministic acceptance rule for the judge panel: index-aligned
        (both lists are always emitted in JUDGE_PERSONAS order by
        `_parse_panel_response`), each persona's verdict category must
        match or be adjacent, and confidence must be within a 40-point
        tolerance band. Reasoning/key_factors are never compared — they're
        the noisiest, most subjective fields and gating consensus on
        wording would reintroduce the exact fragility this design removes.

        Requiring all 6 independent persona judgments to agree in the same
        transaction is too strict in practice: even a small per-persona
        disagreement rate compounds across 6 checks and was observed
        driving repeated leader rotation that ultimately finalized as
        Undetermined. A PANEL_AGREEMENT_QUORUM majority (5 of 6) is
        required instead of unanimity — one dissenting persona out of six
        is treated as normal LLM variance, not a sign the whole panel is
        untrustworthy. `zip()` naturally short-circuits at the shorter
        list, so a completely empty or malformed response (0 matches out
        of 6) still correctly fails outright.
        """
        if len(leader_verdicts) != len(validator_verdicts):
            return False
        agreements = 0
        for lv, vv in zip(leader_verdicts, validator_verdicts):
            if lv.get("persona") != vv.get("persona"):
                continue
            if not self._verdicts_adjacent(lv.get("verdict"), vv.get("verdict")):
                continue
            if abs(int(lv.get("confidence", 0)) - int(vv.get("confidence", 0))) > 40:
                continue
            agreements += 1
        return agreements >= PANEL_AGREEMENT_QUORUM

    def _run_judge_panel(self, case_context: str) -> list:
        """
        Runs the 6-persona judge panel through a single LLM call, verified
        by a deterministic Python validator (`gl.vm.run_nondet_unsafe`)
        rather than an LLM-judged Equivalence Principle wrapper. See the
        design history note on run_judges() for why.
        """
        prompt = self._build_panel_prompt(case_context)

        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return self._parse_panel_response(raw)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            validator_verdicts = leader_fn()
            leader_verdicts = leader_result.calldata
            return self._panel_equivalent(leader_verdicts, validator_verdicts)

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

    @gl.public.write
    def calculate_consensus(self, case_id: str) -> None:
        """
        Synthesize a final consensus verdict from all 6 judge verdicts.
        Uses the same comparative-Equivalence-Principle pattern as
        run_judges(), with a matching lenient tolerance band, so a single
        consensus-synthesis call is no more likely to go Undetermined than
        an individual judge call.

        Also auto-resolves the merged dispute audit log entry (previously a
        second transaction to DisputeRegistry.resolve_dispute()).
        """
        verdicts_raw = self.verdicts.get(case_id, "")
        if not verdicts_raw:
            raise Exception(f"No verdicts found for case '{case_id}' — call run_judges() first")

        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            raise Exception(f"Case '{case_id}' not found")

        verdicts = json.loads(verdicts_raw)

        verdict_summary = ""
        for v in verdicts:
            verdict_summary += (
                f"\n{v.get('persona', 'unknown').upper()} JUDGE: "
                f"verdict={v.get('verdict')}, confidence={v.get('confidence')}, "
                f"reasoning={v.get('reasoning')}\n"
            )

        prompt = (
            f"You are the Final Consensus Engine for the Court of Agents.\n\n"
            f"Six AI judges have evaluated a dispute. Their verdicts are below.\n\n"
            f"JUDGE VERDICTS:\n{verdict_summary}\n\n"
            f"Synthesize these verdicts into a final consensus decision.\n\n"
            f"Respond with ONLY a JSON object containing:\n"
            f"- final_verdict: one of FAVOR_A, FAVOR_B, PARTIAL_A, PARTIAL_B, DISMISS\n"
            f"- overall_confidence: integer 0-100\n"
            f"- agreement_ratio: float 0-1 representing how much judges agreed\n"
            f"- method: one of UNANIMOUS, SUPERMAJORITY, WEIGHTED_MAJORITY\n"
            f"- resolution_explanation: a 3-4 sentence explanation of the final decision\n"
            f"- dissenting_summary: brief summary of any dissenting opinions"
        )

        def parse_consensus(raw_text) -> dict:
            """Deterministic parsing step — identical for leader and every validator."""
            parsed = _parse_json_loose(raw_text)
            return {
                "final_verdict": _normalize_verdict(parsed.get("final_verdict")),
                "overall_confidence": _clamp_int(parsed.get("overall_confidence"), 0, 100, 50),
                "agreement_ratio": _clamp_float(parsed.get("agreement_ratio"), 0.0, 1.0, 0.5),
                "method": parsed.get("method")
                if parsed.get("method") in ("UNANIMOUS", "SUPERMAJORITY", "WEIGHTED_MAJORITY")
                else "WEIGHTED_MAJORITY",
                "resolution_explanation": _truncate(
                    parsed.get("resolution_explanation", "No explanation provided."), 1500
                ),
                "dissenting_summary": _truncate(parsed.get("dissenting_summary", ""), 800),
            }

        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return parse_consensus(raw)

        def validator_fn(leader_result) -> bool:
            # Deterministic Python comparator instead of an LLM-judged
            # Equivalence Principle wrapper — see the design history note
            # on run_judges() for why this is more reliable in practice.
            if not isinstance(leader_result, gl.vm.Return):
                return False
            validator_data = leader_fn()
            leader_data = leader_result.calldata
            # Loosened from the original 20/25-point and 0.25/0.3 tolerance
            # bands after real StudioNet testing showed unanimity-style
            # thresholds reliably triggering leader rotation -> Undetermined.
            if not self._verdicts_adjacent(
                leader_data["final_verdict"], validator_data["final_verdict"]
            ):
                return False
            if abs(leader_data["overall_confidence"] - validator_data["overall_confidence"]) > 40:
                return False
            if abs(leader_data["agreement_ratio"] - validator_data["agreement_ratio"]) > 0.5:
                return False
            return True

        parsed = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        final_verdict = parsed["final_verdict"]
        overall_confidence = parsed["overall_confidence"]

        consensus_record = {
            "case_id": case_id,
            "final_verdict": final_verdict,
            "overall_confidence": overall_confidence,
            "agreement_ratio": parsed["agreement_ratio"],
            "method": parsed["method"],
            "resolution_explanation": parsed["resolution_explanation"],
            "dissenting_summary": parsed["dissenting_summary"],
            "participating_judges": [v.get("persona") for v in verdicts],
        }

        self.consensus_results[case_id] = json.dumps(consensus_record, sort_keys=True)

        case_data = json.loads(case_raw)
        case_data["status"] = "consensus_reached"
        self.cases[case_id] = json.dumps(case_data, sort_keys=True)

        # Auto-resolve the merged dispute audit log entry.
        self._resolve_dispute(case_id, final_verdict, overall_confidence)

    @gl.public.write
    def finalize_case(self, case_id: str) -> None:
        """Mark a case finalized once consensus and any appeal window have passed."""
        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            raise Exception(f"Case '{case_id}' not found")
        case_data = json.loads(case_raw)
        if case_data.get("status") not in ("consensus_reached", "appealed"):
            raise Exception(
                "Case must have reached consensus (or been through an appeal) "
                "before it can be finalized"
            )
        case_data["status"] = "finalized"
        self.cases[case_id] = json.dumps(case_data, sort_keys=True)

    @gl.public.write
    def appeal_case(self, case_id: str, appellant_address: str, reason: str) -> None:
        """
        Flag a case as appealed. Deterministic bookkeeping only — re-running
        judges/consensus after an appeal is a separate, explicit call to
        run_judges()/calculate_consensus() so the appeal itself never risks
        an Undetermined transaction.
        """
        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            raise Exception(f"Case '{case_id}' not found")

        case_data = json.loads(case_raw)
        if case_data.get("status") != "consensus_reached":
            raise Exception("Only cases with a consensus result can be appealed")

        case_data["status"] = "appealed"
        self.cases[case_id] = json.dumps(case_data, sort_keys=True)

        appeal_record = json.dumps(
            {
                "case_id": case_id,
                "appellant_address": appellant_address,
                "reason": _truncate(reason, MAX_STORED_FIELD_CHARS),
            },
            sort_keys=True,
        )
        self.appeals[case_id] = appeal_record
        self.appealed_case_ids.append(case_id)

    @gl.public.write
    def submit_user_decision(
        self,
        case_id: str,
        user_address: str,
        decision: str,
        reasoning: str,
    ) -> None:
        """
        Record a user's own verdict on a case. Deterministic — no LLM/web
        calls. If the case already has a consensus result, this also
        updates the user's on-chain reputation automatically by comparing
        their decision against the consensus final_verdict (previously a
        second transaction the frontend had to send to ReputationTracker).
        """
        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            raise Exception(f"Case '{case_id}' not found")

        normalized_decision = _normalize_verdict(decision)
        key = f"{case_id}:{user_address}"
        decision_data = json.dumps(
            {
                "case_id": case_id,
                "user_address": user_address,
                "decision": normalized_decision,
                "reasoning": _truncate(reasoning, MAX_STORED_FIELD_CHARS),
            },
            sort_keys=True,
        )
        self.user_decisions[key] = decision_data

        consensus_raw = self.consensus_results.get(case_id, "")
        if consensus_raw and user_address in self.reputations:
            consensus = json.loads(consensus_raw)
            is_correct = normalized_decision == consensus.get("final_verdict")
            self._apply_reputation_update(user_address, is_correct)

    # ========================================================================
    # Reputation (formerly ReputationTracker)
    # ========================================================================

    @gl.public.write
    def register_user(self, user_address: str, username: str) -> None:
        """Register a new user with their wallet address. Idempotent."""
        if user_address in self.reputations:
            return

        data = json.dumps(
            {
                "user_address": user_address,
                "username": _truncate(username, 100),
                "rank": "novice_arbiter",
                "score": 0,
                "total_cases": 0,
                "correct_decisions": 0,
                "accuracy": 0.0,
                "streak": 0,
                "best_streak": 0,
            },
            sort_keys=True,
        )
        self.reputations[user_address] = data
        self.user_addresses.append(user_address)
        self.user_count = u256(int(self.user_count) + 1)

    @gl.public.write
    def update_after_decision(self, user_address: str, is_correct: bool) -> None:
        """
        Public entry point kept for backward compatibility with callers
        that want to apply a reputation update directly (e.g. an off-chain
        job reconciling historical decisions). Delegates to the same logic
        `submit_user_decision()` calls automatically.
        """
        self._apply_reputation_update(user_address, is_correct)

    def _apply_reputation_update(self, user_address: str, is_correct: bool) -> None:
        raw = self.reputations.get(user_address, "")
        if not raw:
            return

        data = json.loads(raw)

        data["total_cases"] = data["total_cases"] + 1
        if is_correct:
            data["correct_decisions"] = data["correct_decisions"] + 1
            data["streak"] = data["streak"] + 1
            if data["streak"] > data["best_streak"]:
                data["best_streak"] = data["streak"]
            score_change = 10 + (data["streak"] * 2)
        else:
            data["streak"] = 0
            score_change = -3

        data["score"] = max(0, data["score"] + score_change)
        data["accuracy"] = (
            data["correct_decisions"] / data["total_cases"]
            if data["total_cases"] > 0
            else 0.0
        )

        data["rank"] = _rank_for(data["score"], data["total_cases"], data["accuracy"])

        self.reputations[user_address] = json.dumps(data, sort_keys=True)

    # ========================================================================
    # Dispute audit log (formerly DisputeRegistry)
    # ========================================================================

    def _register_dispute(
        self, dispute_id: str, title: str, category: str, submitter_address: str
    ) -> None:
        """Internal — called automatically from submit_case()."""
        data = json.dumps(
            {
                "dispute_id": dispute_id,
                "title": _truncate(title, MAX_STORED_FIELD_CHARS),
                "category": category,
                "submitter": submitter_address,
                "resolved": False,
                "verdict": "",
                "confidence": 0,
            },
            sort_keys=True,
        )
        self.dispute_log[dispute_id] = data
        self.total_disputes = u256(int(self.total_disputes) + 1)

    def _resolve_dispute(self, dispute_id: str, verdict: str, confidence: int) -> None:
        """Internal — called automatically from calculate_consensus()."""
        existing = self.dispute_log.get(dispute_id, "")
        if not existing:
            return

        data = json.loads(existing)
        if data.get("resolved"):
            return  # idempotent — don't double-count total_resolved on re-runs

        data["resolved"] = True
        data["verdict"] = verdict
        data["confidence"] = _clamp_int(confidence, 0, 100, 0)

        self.dispute_log[dispute_id] = json.dumps(data, sort_keys=True)
        self.total_resolved = u256(int(self.total_resolved) + 1)

    @gl.public.write
    def register_dispute(
        self, dispute_id: str, title: str, category: str, submitter_address: str
    ) -> None:
        """
        Public entry point kept for backward compatibility with callers that
        used to talk to the standalone DisputeRegistry contract directly.
        Normal case submission uses submit_case(), which calls the internal
        helper automatically — this is only needed for disputes registered
        outside the standard case flow.
        """
        if dispute_id in self.dispute_log:
            raise Exception(f"Dispute '{dispute_id}' already registered")
        self._register_dispute(dispute_id, title, category, submitter_address)

    @gl.public.write
    def resolve_dispute(self, dispute_id: str, verdict: str, confidence: int) -> None:
        """Public entry point kept for backward compatibility. See register_dispute()."""
        self._resolve_dispute(dispute_id, _normalize_verdict(verdict), confidence)

    # ========================================================================
    # Views — Adjudicator
    # ========================================================================

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        """Get case data as a JSON string."""
        return self.cases.get(case_id, "")

    @gl.public.view
    def get_verdicts(self, case_id: str) -> str:
        """Get all judge verdicts for a case as a JSON string (array)."""
        return self.verdicts.get(case_id, "")

    @gl.public.view
    def get_consensus(self, case_id: str) -> str:
        """Get the consensus result for a case as a JSON string."""
        return self.consensus_results.get(case_id, "")

    @gl.public.view
    def get_user_decision(self, case_id: str, user_address: str) -> str:
        """Get a user's decision on a case as a JSON string."""
        key = f"{case_id}:{user_address}"
        return self.user_decisions.get(key, "")

    @gl.public.view
    def get_appeal(self, case_id: str) -> str:
        """Get the appeal record for a case as a JSON string, if any."""
        return self.appeals.get(case_id, "")

    @gl.public.view
    def get_case_count(self) -> u256:
        """Get total number of cases."""
        return self.case_count

    @gl.public.view
    def list_case_ids(self, offset: int, limit: int) -> str:
        """
        Paginated enumeration of all case ids, oldest first, as a JSON array
        string (kept consistent with every other view in this contract so
        the frontend has one decoding convention — json.loads() — instead
        of some views returning native lists and others returning JSON
        strings). The original 3-contract design had no on-chain way to
        enumerate cases at all — callers had to already know a case_id (the
        frontend relied entirely on its off-chain Supabase mirror for
        listing). This makes the contract self-sufficient for building case
        lists directly from chain state.
        """
        n = len(self.case_ids)
        start, end = _paginate_slice(n, offset, limit)
        return json.dumps([self.case_ids[i] for i in range(start, end)])

    @gl.public.view
    def list_appealed_case_ids(self, offset: int, limit: int) -> str:
        """Paginated enumeration of appealed case ids, as a JSON array string."""
        n = len(self.appealed_case_ids)
        start, end = _paginate_slice(n, offset, limit)
        return json.dumps([self.appealed_case_ids[i] for i in range(start, end)])

    @gl.public.view
    def get_valid_categories(self) -> str:
        """Return the fixed list of accepted case categories as a JSON array string."""
        return json.dumps(list(VALID_CATEGORIES))

    @gl.public.view
    def get_valid_verdicts(self) -> str:
        """Return the fixed list of accepted verdict values as a JSON array string."""
        return json.dumps(list(VALID_VERDICTS))

    # ========================================================================
    # Views — Web evidence
    # ========================================================================

    @gl.public.view
    def get_evidence_fetch(self, case_id: str, url: str) -> str:
        """Get the stored AI summary for a previously-fetched evidence URL."""
        fetch_key = f"{case_id}:{url}"
        return self.evidence_fetches.get(fetch_key, "")

    # ========================================================================
    # Views — Reputation
    # ========================================================================

    @gl.public.view
    def get_reputation(self, user_address: str) -> str:
        """Get a user's reputation data as a JSON string."""
        return self.reputations.get(user_address, "")

    @gl.public.view
    def get_user_count(self) -> u256:
        """Get total registered users."""
        return self.user_count

    @gl.public.view
    def list_user_addresses(self, offset: int, limit: int) -> str:
        """
        Paginated enumeration of registered user addresses, in registration
        order, as a JSON array string. Combined with get_reputation(), this
        lets a frontend build a full leaderboard directly from chain state
        without a mirrored off-chain database.
        """
        n = len(self.user_addresses)
        start, end = _paginate_slice(n, offset, limit)
        return json.dumps([self.user_addresses[i] for i in range(start, end)])

    # ========================================================================
    # Views — Dispute audit log
    # ========================================================================

    @gl.public.view
    def get_dispute(self, dispute_id: str) -> str:
        """Get dispute audit-log details as a JSON string."""
        return self.dispute_log.get(dispute_id, "")

    @gl.public.view
    def get_stats(self) -> str:
        """Get audit-log statistics as a JSON string."""
        return json.dumps(
            {
                "total_disputes": int(self.total_disputes),
                "total_resolved": int(self.total_resolved),
                "total_cases": int(self.case_count),
                "total_users": int(self.user_count),
            },
            sort_keys=True,
        )
