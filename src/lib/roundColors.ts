/** Maps a round label to its accent-color class (see .bk-c1…5 / .bk-cg in index.css). */
export const ROUND_CLASS: Record<string, string> = {
  'Group Stage': 'bk-cg',
  'Round of 32': 'bk-c1',
  'Round of 16': 'bk-c2',
  Quarterfinals: 'bk-c3',
  Semifinals: 'bk-c4',
  Final: 'bk-c5',
  '3rd Place': 'bk-c5',
};

/** Short banner label per round. */
export const ROUND_SHORT: Record<string, string> = {
  'Group Stage': 'GROUP',
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  Quarterfinals: 'QF',
  Semifinals: 'SF',
  Final: 'FINAL',
  '3rd Place': '3RD',
};
