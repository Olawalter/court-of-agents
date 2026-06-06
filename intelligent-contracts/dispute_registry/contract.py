# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class DisputeRegistry(gl.Contract):
    """
    Court of Agents — Dispute Registry Contract

    Immutable on-chain record of all disputes and their final outcomes.
    Used for audit trail and StudioNet explorer integration.
    """

    registry: TreeMap[str, str]
    total_disputes: u256
    total_resolved: u256

    def __init__(self) -> None:
        self.registry = TreeMap[str, str]()
        self.total_disputes = u256(0)
        self.total_resolved = u256(0)

    @gl.public.write
    def register_dispute(
        self,
        dispute_id: str,
        title: str,
        category: str,
        submitter_address: str,
    ) -> None:
        """Register a new dispute on-chain."""
        data = json.dumps({
            "dispute_id": dispute_id,
            "title": title,
            "category": category,
            "submitter": submitter_address,
            "resolved": False,
            "verdict": "",
            "confidence": 0,
        })
        self.registry[dispute_id] = data
        self.total_disputes = u256(int(self.total_disputes) + 1)

    @gl.public.write
    def resolve_dispute(
        self,
        dispute_id: str,
        verdict: str,
        confidence: int,
    ) -> None:
        """Record the resolution of a dispute."""
        existing = self.registry.get(dispute_id, "")
        if not existing:
            return

        data = json.loads(existing)
        data["resolved"] = True
        data["verdict"] = verdict
        data["confidence"] = confidence

        self.registry[dispute_id] = json.dumps(data)
        self.total_resolved = u256(int(self.total_resolved) + 1)

    @gl.public.view
    def get_dispute(self, dispute_id: str) -> str:
        """Get dispute details."""
        return self.registry.get(dispute_id, "")

    @gl.public.view
    def get_stats(self) -> str:
        """Get registry statistics."""
        return json.dumps({
            "total_disputes": int(self.total_disputes),
            "total_resolved": int(self.total_resolved),
        })
