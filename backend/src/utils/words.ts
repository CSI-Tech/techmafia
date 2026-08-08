export const WORD_PAIRS = [
  { civilian: 'LIME', mafia: 'LEMON' },
  { civilian: 'HOSPITAL', mafia: 'CLINIC' },
  { civilian: 'OCEAN', mafia: 'SEA' },
  { civilian: 'GUITAR', mafia: 'BASS' },
  { civilian: 'MOUNTAIN', mafia: 'HILL' },
  { civilian: 'TRAIN', mafia: 'SUBWAY' },
  { civilian: 'BOOK', mafia: 'MAGAZINE' },
  { civilian: 'CHAIR', mafia: 'STOOL' },
];

export function getRandomWordPair() {
  const index = Math.floor(Math.random() * WORD_PAIRS.length);
  return WORD_PAIRS[index];
}
