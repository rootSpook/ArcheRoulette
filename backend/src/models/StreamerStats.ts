import mongoose, { Document, Schema } from 'mongoose';

export type Tier =
  | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD'
  | 'PLATINUM' | 'EMERALD' | 'DIAMOND'
  | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';

export type Division = 'I' | 'II' | 'III' | 'IV';

export type StreakType = 'win' | 'loss';

export interface IStreamerStats extends Document {
  tier: Tier;
  division: Division;
  lp: number;
  wins: number;
  losses: number;
  streakType: StreakType;
  streakCount: number;
}

const streamerStatsSchema = new Schema<IStreamerStats>(
  {
    tier: { type: String, required: true, default: 'GOLD' },
    division: { type: String, required: true, default: 'IV' },
    lp: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    streakType: { type: String, enum: ['win', 'loss'], default: 'win' },
    streakCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IStreamerStats>('StreamerStats', streamerStatsSchema);
