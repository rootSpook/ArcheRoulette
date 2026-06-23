import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  cooldownEnabled: boolean;
  cooldownRounds: number;
  riotApiKeyEncrypted?: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    cooldownEnabled: { type: Boolean, default: false },
    cooldownRounds: { type: Number, default: 3, min: 1 },
    riotApiKeyEncrypted: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', settingsSchema);
