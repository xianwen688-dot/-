import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 DoubingInvestmentStudio/0.1',
  Accept: 'application/json,text/plain,*/*',
  Referer: 'https://quote.eastmoney.com/'
};

export async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, { headers: defaultHeaders });
    if (response.ok) return response.json();
  } catch {
    // Eastmoney's TLS edge can abruptly close Node fetch on Windows.
  }

  if (process.platform === 'win32') {
    const viaPowerShell = await withRetry(() => fetchTextWithPowerShell(url)).catch(() => '');
    const parsedPowerShell = parseJsonText(viaPowerShell);
    if (parsedPowerShell) return parsedPowerShell;

    const viaCurl = await withRetry(() => fetchTextWithCurl(url));
    const parsedCurl = parseJsonText(viaCurl);
    if (parsedCurl) return parsedCurl;
  }

  const response = await fetch(url, { headers: defaultHeaders });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function fetchTextWithCurl(url: string) {
  const { stdout } = await execFileAsync(
    'curl.exe',
    ['-k', '--http1.1', '-L', '--silent', '--show-error', '--max-time', '20', '-H', 'User-Agent: Mozilla/5.0', url],
    {
      timeout: 25_000,
      maxBuffer: 1024 * 1024 * 12,
      windowsHide: true,
      encoding: 'buffer'
    } as Parameters<typeof execFile>[2]
  );
  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(String(stdout));
  return decodeBuffer(buffer);
}

async function fetchTextWithPowerShell(url: string) {
  const safeUrl = url.replace(/'/g, "''");
  const command = [
    '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8',
    '$OutputEncoding=[System.Text.Encoding]::UTF8',
    '$ProgressPreference="SilentlyContinue"',
    "$headers=@{'User-Agent'='Mozilla/5.0';'Accept'='application/json,text/plain,*/*'}",
    `(Invoke-RestMethod -Headers $headers -Uri '${safeUrl}') | ConvertTo-Json -Depth 50`
  ].join('; ');
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
    timeout: 35_000,
    maxBuffer: 1024 * 1024 * 12,
    windowsHide: true,
    encoding: 'buffer'
  } as Parameters<typeof execFile>[2]);
  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(String(stdout));
  return decodeBuffer(buffer);
}

async function withRetry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) await sleep(500 * (index + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  return JSON.parse(trimmed);
}

function decodeBuffer(buffer: Buffer) {
  const utf8 = buffer.toString('utf8');
  return utf8.includes('\uFFFD') ? new TextDecoder('gb18030').decode(buffer) : utf8;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
