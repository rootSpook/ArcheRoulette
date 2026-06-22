export type Tier =
  | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD'
  | 'PLATINUM' | 'EMERALD' | 'DIAMOND'
  | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';

export type Division = 'I' | 'II' | 'III' | 'IV';

export interface StreamerStats {
  _id: string;
  tier: Tier;
  division: Division;
  lp: number;
  wins: number;
  losses: number;
}
