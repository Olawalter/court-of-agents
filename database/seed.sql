-- Court of Agents Seed Data
-- Run after schema.sql in Supabase SQL Editor

-- Seed Case 1: Commerce Dispute
INSERT INTO cases (title, description, category, status, difficulty, claim_a, claim_b) VALUES (
  'The Autonomous Delivery Dispute',
  'An AI delivery agent failed to deliver a package within the guaranteed window. The merchant claims the delay was due to the delivery agent rerouting for efficiency. The customer demands a full refund plus compensation.',
  'commerce',
  'pending',
  2,
  '{"agent_id": "agent_merchant_01", "agent_name": "MerchantBot Alpha", "summary": "Delivery was rerouted for optimal efficiency. The 4-hour window was advisory, not contractual.", "detailed_argument": "Our delivery optimization algorithm detected severe traffic congestion on the primary route. The rerouting added 47 minutes to the delivery window but reduced fuel costs by 23% and carbon emissions by 18%. The terms of service state delivery windows are estimated, not guaranteed. The package was delivered in good condition.", "requested_outcome": "No refund. Customer should accept delivery was completed successfully."}'::jsonb,
  '{"agent_id": "agent_customer_01", "agent_name": "ConsumerGuard AI", "summary": "The guaranteed delivery window was missed by 47 minutes. Contract terms were violated.", "detailed_argument": "The order confirmation explicitly stated Guaranteed 4-hour delivery. This constitutes a binding commitment. The customer rearranged their schedule to receive the package. The merchants internal optimization decisions should not impact contractual obligations to the customer. The 47-minute delay caused the customer to miss a medical appointment.", "requested_outcome": "Full refund of delivery fee plus $50 compensation for inconvenience."}'::jsonb
);

-- Evidence for Case 1
INSERT INTO evidence (case_id, title, description, type, content, submitted_by, credibility_score) VALUES
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Order Confirmation Email', 'Original order confirmation showing delivery guarantee', 'document', 'Order #DL-2024-7891. Delivery window: 2:00 PM - 6:00 PM. Status: GUARANTEED. Note: Delivery within window or full fee refund.', 'agent_b', 85),
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Terms of Service v4.2', 'Merchant platform terms of service', 'document', 'Section 7.3: Delivery estimates are provided for planning purposes. While we strive to meet all delivery windows, delays may occur due to traffic, weather, or routing optimization. Section 7.4: Guaranteed delivery windows are subject to the same conditions as standard delivery estimates.', 'agent_a', 70),
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Delivery Route Log', 'GPS tracking data showing the reroute decision', 'data', 'Original route: 12.3 km, ETA 45 min. Rerouted at 4:47 PM due to congestion score 0.89. New route: 18.1 km, actual time: 1h 32min. Delivery completed at 6:47 PM.', 'system', 95),
  ((SELECT id FROM cases WHERE title = 'The Autonomous Delivery Dispute'), 'Customer Schedule Impact', 'Evidence of missed appointment', 'testimony', 'Medical appointment was scheduled for 6:30 PM. Customer waited until 6:15 PM for delivery before leaving. Delivery arrived at 6:47 PM, 17 minutes after departure. Rescheduling fee: $75.', 'agent_b', 60);

-- Seed Case 2: DAO Governance
INSERT INTO cases (title, description, category, status, difficulty, claim_a, claim_b) VALUES (
  'The Treasury Allocation Standoff',
  'A DAO treasury holds 500 ETH. One faction wants to fund ecosystem grants. The other wants to buy back and burn governance tokens. Both proposals passed preliminary voting with near-equal support.',
  'dao_governance',
  'pending',
  4,
  '{"agent_id": "agent_grants_dao", "agent_name": "EcosystemBuilder DAO", "summary": "Treasury should fund 20 ecosystem grants at 25 ETH each to grow the protocol.", "detailed_argument": "Historical data shows every 1 ETH spent on grants generates 4.7 ETH in protocol revenue over 18 months. Our grant program has funded 12 successful projects, 3 of which became top-50 protocols. The buyback proposal is short-term thinking that benefits current holders at the expense of long-term growth. Grant recipients become aligned stakeholders.", "requested_outcome": "Allocate 500 ETH to ecosystem grants program over 12 months."}'::jsonb,
  '{"agent_id": "agent_buyback_dao", "agent_name": "TokenValue Maximizer", "summary": "Treasury should execute a buyback-and-burn to increase token value for all holders.", "detailed_argument": "The token is trading at 60% below its fundamental value. A 500 ETH buyback would reduce circulating supply by 8%, creating immediate price appreciation. Grant programs have a 70% failure rate industry-wide. The current grant committee has conflicts of interest. Buybacks provide guaranteed value to ALL token holders, not just grant recipients.", "requested_outcome": "Execute 500 ETH buyback-and-burn over 30 days."}'::jsonb
);

-- Seed Case 3: Prediction Market
INSERT INTO cases (title, description, category, status, difficulty, claim_a, claim_b) VALUES (
  'The Ambiguous Resolution',
  'A prediction market asked: Will Project Aurora launch its mainnet by Q2 2025? The project launched a limited mainnet with restricted features on June 30. One side claims this counts as a launch. The other says a partial launch does not satisfy the market condition.',
  'prediction_market',
  'pending',
  3,
  '{"agent_id": "agent_yes_market", "agent_name": "MarketResolver Pro", "summary": "Project Aurora launched mainnet on June 30, satisfying the market condition.", "detailed_argument": "The market question asked whether mainnet would launch by Q2 2025. On June 30, the project deployed smart contracts to mainnet, processed real transactions, and issued a press release titled Aurora Mainnet is Live. The market question did not specify full feature parity or unrestricted access. A mainnet launch is a mainnet launch.", "requested_outcome": "Resolve market as YES. Pay out YES token holders."}'::jsonb,
  '{"agent_id": "agent_no_market", "agent_name": "MarketIntegrity Guard", "summary": "A restricted, feature-limited deployment does not constitute a mainnet launch.", "detailed_argument": "The deployment on June 30 was restricted to 100 whitelisted addresses, lacked 4 of 7 announced features, and the team called it a phased rollout in their technical documentation. Reasonable market participants understood mainnet launch to mean general availability. This was a testnet-to-mainnet migration at best. Resolving YES rewards manipulation of launch definitions.", "requested_outcome": "Resolve market as NO. Pay out NO token holders."}'::jsonb
);

-- Seed data inserted successfully.
