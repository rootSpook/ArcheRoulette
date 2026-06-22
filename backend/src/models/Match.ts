import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  champion: mongoose.Types.ObjectId;
  result: 'win' | 'loss';
  playedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    champion: { type: Schema.Types.ObjectId, ref: 'Champion', required: true },
    result: { type: String, enum: ['win', 'loss'], required: true },
    playedAt: { type: Date, default: Date.now },
  }
);

export default mongoose.model<IMatch>('Match', matchSchema);
