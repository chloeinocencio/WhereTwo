const adjectives = [
  'happy', 'sunny', 'clever', 'bright', 'swift', 'gentle', 'brave', 'calm', 'eager', 'fancy',
  'jolly', 'kind', 'lively', 'merry', 'nice', 'proud', 'silly', 'witty', 'zany', 'cool',
  'crisp', 'daring', 'epic', 'fresh', 'grand', 'icy', 'jazzy', 'lucky', 'mighty', 'noble',
  'wild', 'smooth', 'sweet', 'pink', 'blue', 'golden', 'silver', 'amber', 'cosmic', 'mystic',
  'butter', 'honey', 'maple', 'berry', 'cherry', 'peach', 'melon', 'grape', 'mango', 'cocoa'
];

const nouns = [
  'panda', 'tiger', 'eagle', 'dolphin', 'falcon', 'rabbit', 'phoenix', 'dragon', 'unicorn', 'wolf',
  'lion', 'bear', 'fox', 'owl', 'hawk', 'dove', 'swan', 'raven', 'sparrow', 'robin',
  'cloud', 'storm', 'breeze', 'wave', 'flame', 'frost', 'thunder', 'rain', 'snow', 'wind',
  'mountain', 'river', 'ocean', 'forest', 'meadow', 'valley', 'canyon', 'island', 'lake', 'peak',
  'muffin', 'cookie', 'waffle', 'pancake', 'cupcake', 'brownie', 'donut', 'bagel', 'toast', 'biscuit'
];

export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${adjective}-${noun}-${number}`;
}