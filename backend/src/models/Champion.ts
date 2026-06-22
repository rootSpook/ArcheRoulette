import mongoose, { Document, Schema } from 'mongoose';

export interface IChampion extends Document {
  championId: string;
  name: string;
  imgLink: string;
  timesPlayed: number;
  wins: number;
  counter: number;
}

const championSchema = new Schema<IChampion>(
  {
    championId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imgLink: { type: String, required: true },
    timesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    counter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IChampion>('Champion', championSchema);
