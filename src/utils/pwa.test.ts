import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerServiceWorker } from './pwa';

const publicFile = (path: string) => new URL(`../../public/${path}`, import.meta.url);

test('the static manifest supports installation on either domain with correctly sized PNG icons', () => {
  const manifest = JSON.parse(readFileSync(publicFile('manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.id, '/');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
  assert.ok(manifest.name && manifest.short_name);
  for (const size of ['192x192', '512x512']) {
    assert.ok(manifest.icons.some((icon: { sizes: string; purpose: string }) => icon.sizes === size && icon.purpose === 'any'));
  }
  assert.ok(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    assert.equal(icon.type, 'image/png');
    const png = readFileSync(publicFile(icon.src.slice(1)));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /rel="manifest" href="\/manifest.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png"/);
  const appleIcon = readFileSync(publicFile('apple-touch-icon.png'));
  assert.equal(appleIcon.readUInt32BE(16), 180);
  assert.equal(appleIcon.readUInt32BE(20), 180);
});

function mockBrowser(t: TestContext, readyState: string, supported = true) {
  const events = new EventTarget();
  const calls: string[] = [];
  const globals = {
    window: events,
    document: { readyState },
    navigator: supported ? { serviceWorker: { register: async (url: string) => { calls.push(url); } } } : {},
  };
  for (const [key, value] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  return { events, calls };
}

test('registers the same-origin generated worker when load already finished', (t) => {
  const { calls } = mockBrowser(t, 'complete');
  registerServiceWorker();
  assert.deepEqual(calls, ['/sw.js']);
});

test('waits for load and only registers once', (t) => {
  const { events, calls } = mockBrowser(t, 'interactive');
  registerServiceWorker();
  assert.deepEqual(calls, []);
  events.dispatchEvent(new Event('load'));
  events.dispatchEvent(new Event('load'));
  assert.deepEqual(calls, ['/sw.js']);
});

test('browsers without service worker support still run the app', (t) => {
  const { calls } = mockBrowser(t, 'complete', false);
  assert.doesNotThrow(registerServiceWorker);
  assert.deepEqual(calls, []);
});
