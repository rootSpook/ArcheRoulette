import mongoose, { Document, Schema } from 'mongoose';

export type Tier =
  | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD'
  | 'PLATINUM' | 'EMERALD' | 'DIAMOND'
  | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';

export type Division = 'I' | 'II' | 'III' | 'IV';

export interface IStreamerStats extends Document {
  tier: Tier;
  division: Division;
  lp: number;
  wins: number;
  losses: number;
}

const streamerStatsSchema = new Schema<IStreamerStats>(
  {
    tier: { type: String, required: true, default: 'GOLD' },
    division: { type: String, required: true, default: 'IV' },
    lp: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IStreamerStats>('StreamerStats', streamerStatsSchema);
