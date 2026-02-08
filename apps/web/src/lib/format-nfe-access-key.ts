export function formatNfeAccessKey(number: string): string[] {
  const matchedBlocks = number.match(/.{1,4}/g);
  return matchedBlocks ? matchedBlocks : [];
}
