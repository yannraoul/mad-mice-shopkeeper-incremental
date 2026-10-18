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
// A phase change plays a short overlay (the shop sign, the night sky): wait it out so it is not in the picture.
const openShop = () => click(/Open the shop/, 2800);
const closeShop = () => click(/Close the shop/, 2800);
const sleepNow = () => click(/Go to sleep/, 4600);
const endDay = async () => { await openShop(); await closeShop(); await sleepNow(); };
// With every helper hired a batch plays on the scene (about a second per step): wait until Start is available again.
const craftBatch = async () => {
  await click(/^Start batch$/, 300);
  for (let i = 0; i < 80; i++) { const b = btn(/^(Start batch|Make another)/); if (b && !b.disabled) return; await wait(100); }
};
const settings = async () => { document.querySelector('button[aria-label=Settings]').click(); await wait(200); };
const drawer = async () => { await click(/Board & errands/, 400); };
`;

// The first days are played by hand; the late game is a developer end-game shop (every upgrade, quest and helper).
const RICH = '?seed=11&stage=2&money=420&unlocks=oven,clerk,errandsBoard,map,contractBoard,sunflower,dark-garden,royal-jelly';
const END = '?endgame=1';

interface Scenario {
  name: string;
  query: string;
  steps: string;
}
const SCENARIOS: Scenario[] = [
  { name: '01-morning-workshop', query: END, steps: '' },
  { name: '02-morning-craft-bench', query: RICH, steps: `await click(/^Start batch$/); document.querySelector('button.tile').click(); await wait(80);` },
  { name: '03-afternoon-counter', query: END, steps: `await openShop();` },
  { name: '04-afternoon-order-open', query: END, steps: `await openShop(); document.querySelector('.list .who').click(); await wait(300);` },
  { name: '05-evening-tree-and-report', query: END, steps: `await openShop(); await closeShop();` },
  { name: '06-settings', query: END, steps: `await settings();` },
  { name: '07-first-day-morning', query: '?seed=3', steps: '' },
  { name: '08-first-day-afternoon', query: '?seed=3', steps: `await openShop();` },
  { name: '09-rival-active-morning', query: RICH, steps: `await endDay(); await endDay();` },
  { name: '10-final-stage-cleared', query: '?seed=5&stage=3&completed=1&money=50&unlocks=oven,clerk,errandsBoard,map', steps: '' },
  { name: '11-board-drawer', query: END, steps: `await drawer();` },
  { name: '12-routine-switches', query: END, steps: `await click(/Accounting/, 150); await click(/Auto sleep/, 150);` },
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
  { dir: 'desktop-light', width: 1200, height: 800, scale: 1, mobile: false, scheme: 'light', only: ['01-morning-workshop', '03-afternoon-counter', '05-evening-tree-and-report'] },
  { dir: 'mobile-dark', width: 390, height: 844, scale: 2, mobile: true, scheme: 'dark', only: ['01-morning-workshop', '02-morning-craft-bench', '03-afternoon-counter', '04-afternoon-order-open', '05-evening-tree-and-report', '11-board-drawer', '12-routine-switches'] },
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
