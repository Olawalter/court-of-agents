export interface GenLayerContractConfig {
  address: string;
  rpc_url: string;
}

export interface ContractDeployment {
  contract_name: string;
  address: string;
  deployed_at: string;
  network: "localnet" | "studionet";
  tx_hash: string;
}

export interface AdjudicatorContractState {
  total_disputes: number;
  active_disputes: number;
  resolved_disputes: number;
}

export interface DisputeOnChain {
  dispute_id: string;
  claim_a_hash: string;
  claim_b_hash: string;
  verdict: string;
  confidence: number;
  reasoning_hash: string;
  resolved: boolean;
  timestamp: number;
}

export interface ReputationOnChain {
  user_address: string;
  score: number;
  total_cases: number;
  accuracy_bps: number;
  rank: string;
  last_updated: number;
}
