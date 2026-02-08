// Simple hash for child PIN - not crypto-grade, just to avoid storing plaintext
export async function hashPin(pin: string): Promise<string> {
  // Use a simple hash since we don't need crypto-level security for a child PIN
  let hash = 0;
  const str = `galo-routine-pin-${pin}-salt`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
