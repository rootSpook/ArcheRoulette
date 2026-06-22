import mongoose, { Document, Schema } from 'mongoose';

export interface IVoterLog extends Document {
  ip: string;
  championId: mongoose.Types.ObjectId;
}

const voterLogSchema = new Schema<IVoterLog>(
  {
    ip: { type: String, required: true, unique: true },
    championId: { type: Schema.Types.ObjectId, ref: 'Champion', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IVoterLog>('VoterLog', voterLogSchema);
