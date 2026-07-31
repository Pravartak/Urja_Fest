import { LeaderboardEntry } from './types';

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return [
    { name: 'Contingent A', points: 4250 },
    { name: 'Contingent B', points: 3980 },
    { name: 'Contingent C', points: 3750 },
    { name: 'Contingent D', points: 3450 },
    { name: 'Contingent E', points: 3200 },
    { name: 'Contingent F', points: 2950 },
    { name: 'Contingent G', points: 2700 },
    { name: 'Contingent H', points: 2450 },
    { name: 'Contingent I', points: 2150 },
    { name: 'Contingent J', points: 1900 },
  ];
}
