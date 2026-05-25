export function generateRoomCode() {
  const part1 = Math.floor(Math.random() * 900 + 100).toString();
  const part2 = Math.floor(Math.random() * 900 + 100).toString();
  return `${part1}-${part2}`;
}
