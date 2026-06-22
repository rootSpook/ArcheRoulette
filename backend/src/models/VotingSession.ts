import mongoose, { Document, Schema } from 'mongoose';

export type VotingStatus = 'idle' | 'active' | 'ended' | 'result';

export interface IVotingSession extends Document {
  status: VotingStatus;
  endsAt?: Date;
  winner?: mongoose.Types.ObjectId;
}

const votingSessionSchema = new Schema<IVotingSession>(
  {
    status: { type: String, enum: ['idle', 'active', 'ended', 'result'], default: 'idle' },
    endsAt: { type: Date },
    winner: { type: Schema.Types.ObjectId, ref: 'Champion' },
  },
  { timestamps: true }
);

export default mongoose.model<IVotingSession>('VotingSession', votingSessionSchema);
