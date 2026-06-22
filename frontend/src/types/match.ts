import { Champion } from './champion';

export interface Match {
  _id: string;
  champion: Pick<Champion, '_id' | 'name' | 'imgLink' | 'championId'>;
  result: 'win' | 'loss';
  playedAt: string;
}
