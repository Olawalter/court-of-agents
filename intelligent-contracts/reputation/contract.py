# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class ReputationTracker(gl.Contract):
    """
    Court of Agents — Reputation Tracker Contract

    Tracks user reputation on-chain based on their adjudication decisions.
    Wallet address is the user identity.

    Ranks:
    - novice_arbiter (0+ score)
    - trusted_judge (100+ score, 5+ cases, 50%+ accuracy)
    - consensus_architect (500+ score, 20+ cases, 65%+ accuracy)
    - master_adjudicator (1500+ score, 50+ cases, 75%+ accuracy)
    - grand_adjudicator (5000+ score, 100+ cases, 85%+ accuracy)
    """

    reputations: TreeMap[str, str]
    user_count: u256

    def __init__(self) -> None:
        self.reputations = TreeMap[str, str]()
        self.user_count = u256(0)

    @gl.public.write
    def register_user(self, user_address: str, username: str) -> None:
        """Register a new user with their wallet address."""
        if user_address in self.reputations:
            return

        data = json.dumps({
            "user_address": user_address,
            "username": username,
            "rank": "novice_arbiter",
            "score": 0,
            "total_cases": 0,
            "correct_decisions": 0,
            "accuracy": 0.0,
            "streak": 0,
            "best_streak": 0,
        })
        self.reputations[user_address] = data
        self.user_count = u256(int(self.user_count) + 1)

    @gl.public.write
    def update_after_decision(
        self,
        user_address: str,
        is_correct: bool,
    ) -> None:
        """Update reputation after a user submits a decision on a resolved case."""
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
        data["accuracy"] = data["correct_decisions"] / data["total_cases"] if data["total_cases"] > 0 else 0.0

        # Determine rank
        score = data["score"]
        cases = data["total_cases"]
        acc = data["accuracy"]

        if score >= 5000 and cases >= 100 and acc >= 0.85:
            data["rank"] = "grand_adjudicator"
        elif score >= 1500 and cases >= 50 and acc >= 0.75:
            data["rank"] = "master_adjudicator"
        elif score >= 500 and cases >= 20 and acc >= 0.65:
            data["rank"] = "consensus_architect"
        elif score >= 100 and cases >= 5 and acc >= 0.50:
            data["rank"] = "trusted_judge"
        else:
            data["rank"] = "novice_arbiter"

        self.reputations[user_address] = json.dumps(data)

    @gl.public.view
    def get_reputation(self, user_address: str) -> str:
        """Get a user's reputation data."""
        return self.reputations.get(user_address, "")

    @gl.public.view
    def get_user_count(self) -> u256:
        """Get total registered users."""
        return self.user_count
