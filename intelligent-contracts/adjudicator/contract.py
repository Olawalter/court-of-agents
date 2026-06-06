# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class CourtAdjudicator(gl.Contract):
    """
    Court of Agents — Main Adjudicator Contract

    All dispute adjudication flows through this contract.
    Every judge verdict is produced by gl.exec_prompt() — real GenLayer LLM consensus.

    Flow:
    1. User calls submit_case() → case stored on-chain
    2. User calls run_judges() → 6 LLM judge personas produce verdicts via gl.exec_prompt()
    3. User calls calculate_consensus() → LLM synthesizes final verdict from all judge outputs
    4. User calls submit_user_decision() → user's own verdict recorded
    """

    cases: TreeMap[str, str]
    verdicts: TreeMap[str, str]
    consensus_results: TreeMap[str, str]
    user_decisions: TreeMap[str, str]
    case_count: u256

    def __init__(self) -> None:
        self.cases = TreeMap[str, str]()
        self.verdicts = TreeMap[str, str]()
        self.consensus_results = TreeMap[str, str]()
        self.user_decisions = TreeMap[str, str]()
        self.case_count = u256(0)

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
        """Submit a new dispute case on-chain."""
        case_data = json.dumps({
            "case_id": case_id,
            "title": title,
            "description": description,
            "category": category,
            "difficulty": difficulty,
            "claim_a": {
                "agent_name": claim_a_name,
                "summary": claim_a_summary,
                "argument": claim_a_argument,
            },
            "claim_b": {
                "agent_name": claim_b_name,
                "summary": claim_b_summary,
                "argument": claim_b_argument,
            },
            "evidence_summary": evidence_summary,
            "status": "pending",
        })
        self.cases[case_id] = case_data
        self.case_count = u256(int(self.case_count) + 1)

    @gl.public.write
    def run_judges(self, case_id: str) -> None:
        """Run all 6 AI judge personas on a case using GenLayer LLM consensus."""
        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            return

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

        judges = [
            ("commerce", "You are the Commerce Judge. You specialize in trade disputes and commercial agreements. You prioritize fair market practices and contractual obligations."),
            ("consumer", "You are the Consumer Judge. You advocate for consumer protection and fair dealing. You weigh power imbalances and information asymmetry."),
            ("contract", "You are the Contract Judge. You focus strictly on contractual terms and written agreements. You prioritize what was agreed upon in writing."),
            ("neutral", "You are the Neutral Judge. You provide the most balanced, impartial analysis possible with no domain bias."),
            ("risk", "You are the Risk Judge. You evaluate risk exposure, liability, and downstream consequences of each possible outcome."),
            ("genlayer", "You are the GenLayer Consensus Judge. You seek the most fair and reasonable outcome through decentralized reasoning principles."),
        ]

        all_verdicts = []

        for persona, system_prompt in judges:
            prompt = (
                f"{system_prompt}\n\n"
                f"Evaluate this dispute:\n\n"
                f"{case_context}\n\n"
                f"Respond with ONLY a JSON object containing:\n"
                f"- verdict: one of FAVOR_A, FAVOR_B, PARTIAL_A, PARTIAL_B, DISMISS\n"
                f"- confidence: integer 0-100\n"
                f"- reasoning: a 2-3 sentence explanation\n"
                f"- key_factors: list of 2-3 key factors that influenced your decision"
            )

            result = gl.exec_prompt(prompt)

            verdict_data = {
                "persona": persona,
                "raw_response": result.strip(),
            }
            all_verdicts.append(verdict_data)

        self.verdicts[case_id] = json.dumps(all_verdicts)

        # Update case status
        case_data["status"] = "deliberating"
        self.cases[case_id] = json.dumps(case_data)

    @gl.public.write
    def calculate_consensus(self, case_id: str) -> None:
        """Calculate consensus from all judge verdicts using GenLayer LLM."""
        verdicts_raw = self.verdicts.get(case_id, "")
        if not verdicts_raw:
            return

        case_raw = self.cases.get(case_id, "")
        if not case_raw:
            return

        verdicts = json.loads(verdicts_raw)

        verdict_summary = ""
        for v in verdicts:
            verdict_summary += f"\n{v['persona'].upper()} JUDGE: {v['raw_response']}\n"

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

        result = gl.exec_prompt(prompt)

        self.consensus_results[case_id] = result.strip()

        # Update case status
        case_data = json.loads(case_raw)
        case_data["status"] = "consensus_reached"
        self.cases[case_id] = json.dumps(case_data)

    @gl.public.write
    def submit_user_decision(
        self,
        case_id: str,
        user_address: str,
        decision: str,
        reasoning: str,
    ) -> None:
        """Record a user's own verdict on a case."""
        key = f"{case_id}:{user_address}"
        decision_data = json.dumps({
            "case_id": case_id,
            "user_address": user_address,
            "decision": decision,
            "reasoning": reasoning,
        })
        self.user_decisions[key] = decision_data

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        """Get case data."""
        return self.cases.get(case_id, "")

    @gl.public.view
    def get_verdicts(self, case_id: str) -> str:
        """Get all judge verdicts for a case."""
        return self.verdicts.get(case_id, "")

    @gl.public.view
    def get_consensus(self, case_id: str) -> str:
        """Get consensus result for a case."""
        return self.consensus_results.get(case_id, "")

    @gl.public.view
    def get_user_decision(self, case_id: str, user_address: str) -> str:
        """Get a user's decision on a case."""
        key = f"{case_id}:{user_address}"
        return self.user_decisions.get(key, "")

    @gl.public.view
    def get_case_count(self) -> u256:
        """Get total number of cases."""
        return self.case_count
