import { Champion } from './champion';

export type VotingStatus = 'idle' | 'active' | 'ended' | 'result';

export interface VotingSession {
  _id: string;
  status: VotingStatus;
  endsAt?: string;
  winner?: Pick<Champion, '_id' | 'name' | 'imgLink' | 'championId'>;
}
