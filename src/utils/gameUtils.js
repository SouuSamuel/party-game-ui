export function getRandomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export function getRandomPhraseCutWord(bank) {
  const category = getRandomItem(bank);
  const word = getRandomItem(category.words);

  return {
    category: category.category,
    word,
  };
}

export function getRandomNote() {
  return Math.floor(Math.random() * 11);
32