export function parseNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(/,/g, '').replace('%', '').trim();
  if (!normalized || normalized === '-' || normalized === '--') return null;
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)([KMB亿万]?)$/i);
  if (!match) {
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }
  const base = Number(match[1]);
  const suffix = match[2].toUpperCase();
  const multiplier = suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : suffix === '万' ? 10_000 : suffix === '亿' ? 100_000_000 : 1;
  return Number.isFinite(base) ? base * multiplier : null;
}

export function extractJson(stdout: string): unknown {
  const startCandidates = ['[', '{']
    .map((char) => ({ char, index: stdout.indexOf(char) }))
    .filter((candidate) => candidate.index >= 0)
    .sort((a, b) => a.index - b.index);
  if (!startCandidates.length) throw new Error(`No JSON payload found: ${stdout.slice(0, 160)}`);

  const start = startCandidates[0].index;
  const open = stdout[start];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < stdout.length; index += 1) {
    const char = stdout[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth === 0) {
      return JSON.parse(stdout.slice(start, index + 1));
    }
  }

  throw new Error('JSON payload was not closed');
}
