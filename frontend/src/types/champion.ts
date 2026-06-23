export interface Champion {
  _id: string;
  championId: string;
  name: string;
  imgLink: string;
  timesPlayed: number;
  wins: number;
  counter: number;
  cooldownRemaining: number;
  banned: boolean;
}
