import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Screenshots of every screen, for design hand-offs: `npm run screenshots`.
// Drives a real headless Chromium (Edge or Chrome, whichever is installed) over the DevTools
// protocol with no extra dependency, replays each scenario through the real UI on a throwaway
// developer-hook game (never touches a real save), and writes full-page PNGs.
//
//   npm run screenshots -- [--base http://localhost:5173] [--out docs/design-brief/screens] [--only mobile]
//
// The dev server must be running (`npm run dev`).

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? def) : def;
};
const BASE = opt('base', 'http://localhost:5173');
const OUT = resolve(ROOT, opt('out', 'docs/design-brief/screens'));
const ONLY = opt('only', '');
const PORT = 9333;

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const browserPath = BROWSERS.find((p) => p && existsSync(p));
if (!browserPath) throw new Error('No Chrome or Edge found; set CHROME_PATH.');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------------------- DevTools client
class Cdp {
  private id = 0;
  private pending = new Map<number, { ok: (v: any) => void; fail: (e: Error) => void }>();
  private waiters: { event: string; ok: () => void }[] = [];
  constructor(private ws: WebSocket) {
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(String(e.data));
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        msg.error ? p.fail(new Error(`${msg.error.message}`)) : p.ok(msg.result);
      } else if (msg.method) {
        this.waiters = this.waiters.filter((w) => (w.event === msg.method ? (w.ok(), false) : true));
      }
    });
  }
  static async connect(url: string) {
    const ws = new WebSocket(url);
    await new Promise<void>((ok, fail) => {
      ws.addEventListener('open', () => ok());
      ws.addEventListener('error', () => fail(new Error('DevTools connection failed')));
    });
    return new Cdp(ws);
  }
  send(method: string, params: object = {}): Promise<any> {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, fail) => this.pending.set(id, { ok, fail }));
  }
  once(event: string): Promise<void> {
    return new Promise((ok) => this.waiters.push({ event, ok }));
  }
  close() {
    this.ws.close();
  }
}

// ----------------------------------------------------------------------------- scenarios
/** Helpers available to every scenario script (run inside the page). Buttons are matched by their English text. */
const PRELUDE = `
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const btn = (re) => [...document.querySelectorAll('button')].find((b) => re.test(b.textContent.trim()));
const click = async (re, ms = 120) => { const b = btn(re); if (!b) throw new Error('no button ' + re); b.click(); await wait(ms); };
const images = async () => { for (let i = 0; i < 40; i++) { if ([...document.images].every((m) => m.complete)) return; await wait(100); } };
const craftBatch = async (quality) => {
  if (quality) { const q = [...document.querySelectorAll('.workshop .seg .opt')].find((o) => o.textContent.toLowerCase().startsWith(quality)); q.click(); await wait(60); }
  await click(/^Start batch$/);
  const st = document.querySelector('button.cauldron');
  for (let i = 0; i < 12; i++) {
    const open = [...document.querySelectorAll('.inside b')].find((x) => { const m = x.textContent.match(/(\\d+) \\/ (\\d+)$/); return m && +m[1] < +m[2]; });
    if (!open) break;
    const name = open.textContent.replace(/ \\d+ \\/ \\d+$/, '');
    [...document.querySelectorAll('button.tile')].find((b) => b.textContent.includes(name)).click(); await wait(40);
    st.click(); await wait(40);
  }
  for (let i = 0; i < 6; i++) {
    if (!document.querySelector('.bench')) break; // the batch is finished and the form is back
    const next = [...document.querySelectorAll('.workshop .actions button.btn3')].find((b) => !b.disabled && !b.classList.contains('cancel'));
    if (!next) break; next.click(); await wait(70);
  }
};
const openShop = () => click(/Open the shop/, 300);
const closeShop = () => click(/Close the shop/, 300);
const clerkOn = async () => { const c = document.querySelector('.rail input[role=switch]'); if (c && !c.checked) { c.click(); await wait(200); } };
const serveOne = async () => { const b = [...document.querySelectorAll('.cust button')].find((x) => /^Serve/.test(x.textContent.trim()) && !x.disabled); if (b) { b.click(); await wait(150); } };
const buy = async (name) => { const n = [...document.querySelectorAll('.node')].find((x) => x.querySelector('.nhead b').textContent.trim() === name); const b = n && n.querySelector('.buy:not([disabled])'); if (b) { b.click(); await wait(120); } };
const endDay = async () => { await click(/Open the shop/, 200); await click(/Close the shop/, 200); await click(/Go to sleep/, 200); };
const settings = async () => { document.querySelector('button[aria-label=Settings]').click(); await wait(200); };
`;

const RICH = '?seed=11&stage=2&money=420&unlocks=oven,clerk,errandsBoard,map,contractBoard,recipe-2,dark-garden,tonic-recipe';
const AFTERNOON = `await craftBatch(); await craftBatch(); await openShop(); await clerkOn(); await serveOne();`;
const EVENING = `${AFTERNOON} await closeShop(); await buy('Honey yield'); await buy('Honey yield'); await buy('Counter space'); await buy('Faithful'); await buy('Patience');`;

interface Scenario {
  name: string;
  query: string;
  steps: string;
}
const SCENARIOS: Scenario[] = [
  { name: '01-morning-craft-form', query: RICH, steps: '' },
  { name: '02-morning-craft-bench', query: RICH, steps: `await click(/^Start batch$/); document.querySelector('button.tile').click(); await wait(80); document.querySelector('button.cauldron').click(); await wait(100);` },
  { name: '03-afternoon-serve', query: RICH, steps: AFTERNOON },
  { name: '04-evening-tree-and-report', query: RICH, steps: EVENING },
  { name: '05-settings', query: RICH, steps: `${EVENING} await settings();` },
  { name: '06-first-day-morning', query: '?seed=3', steps: '' },
  { name: '07-first-day-afternoon', query: '?seed=3', steps: `await craftBatch(); await openShop();` },
  { name: '08-rival-active-morning', query: RICH, steps: `await endDay(); await endDay();` },
  { name: '09-final-stage-cleared', query: '?seed=5&stage=3&completed=1&money=50&unlocks=oven,clerk,errandsBoard,map', steps: '' },
];

interface Variant {
  dir: string;
  width: number;
  height: number;
  scale: number;
  mobile: boolean;
  scheme: 'dark' | 'light';
  /** Which scenarios to take (all when empty). */
  only?: string[];
}
const VARIANTS: Variant[] = [
  { dir: 'desktop-dark', width: 1200, height: 800, scale: 1, mobile: false, scheme: 'dark' },
  { dir: 'desktop-light', width: 1200, height: 800, scale: 1, mobile: false, scheme: 'light', only: ['01-morning-craft-form', '03-afternoon-serve', '04-evening-tree-and-report'] },
  { dir: 'mobile-dark', width: 390, height: 844, scale: 2, mobile: true, scheme: 'dark', only: ['01-morning-craft-form', '02-morning-craft-bench', '03-afternoon-serve', '04-evening-tree-and-report', '05-settings'] },
];

// ----------------------------------------------------------------------------- run
async function main() {
  const profile = mkdtempSync(join(tmpdir(), 'cst-shots-'));
  const proc = spawn(
    browserPath!,
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--lang=en-US',
      `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: 'ignore' },
  );
  try {
    let pages: { type: string; webSocketDebuggerUrl: string }[] = [];
    for (let i = 0; i < 60; i++) {
      try {
        pages = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()) as typeof pages;
        if (pages.some((p) => p.type === 'page')) break;
      } catch {}
      await sleep(250);
    }
    const page = pages.find((p) => p.type === 'page');
    if (!page) throw new Error('Browser did not start.');
    const cdp = await Connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const v of VARIANTS) {
      if (ONLY && !v.dir.includes(ONLY)) continue;
      const dir = join(OUT, v.dir);
      mkdirSync(dir, { recursive: true });
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: v.scale, mobile: v.mobile });
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: v.scheme }] });
      for (const sc of SCENARIOS.filter((s) => !v.only || v.only.includes(s.name))) {
        const loaded = cdp.once('Page.loadEventFired');
        await cdp.send('Page.navigate', { url: `${BASE}/${sc.query}` });
        await loaded;
        await sleep(700);
        const r = await cdp.send('Runtime.evaluate', {
          expression: `(async () => { ${PRELUDE}\n${sc.steps}\nawait images(); await wait(250); return 'ok'; })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        if (r.exceptionDetails) throw new Error(`${v.dir}/${sc.name}: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
        const m = await cdp.send('Page.getLayoutMetrics');
        const height = Math.ceil(m.cssContentSize.height);
        const shot = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: v.width, height, scale: 1 },
        });
        const file = join(dir, `${sc.name}.png`);
        writeFileSync(file, Buffer.from(shot.data, 'base64'));
        console.log(`${v.dir}/${sc.name}.png  ${v.width}x${height}  ${(statSync(file).size / 1024).toFixed(0)} KB`);
      }
    }
    cdp.close();
  } finally {
    proc.kill();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  }
}
const Connect = Cdp.connect;
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
