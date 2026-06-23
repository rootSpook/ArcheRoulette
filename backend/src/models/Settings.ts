import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  cooldownEnabled: boolean;
  cooldownRounds: number;
}

const settingsSchema = new Schema<ISettings>(
  {
    cooldownEnabled: { type: Boolean, default: false },
    cooldownRounds: { type: Number, default: 3, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', settingsSchema);
