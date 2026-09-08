import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.test' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, screen, cleanup, fireEvent, waitFor } = await import('@testing-library/react');
const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = await build({
  stdin: { contents: "export { default as CommentList } from './src/components/CommentList.jsx'; export { authStore } from './src/stores/authStore.ts';", resolveDir: root },
  bundle: true, write: false, format: 'esm', platform: 'node', packages: 'external',
  plugins: [{ name: 'test-client', setup(b) {
    b.onResolve({ filter: /^@\// }, ({ path }) => path === '@/lib/supabaseClient'
      ? { path: 'client', namespace: 'mock' } : { path: resolve(root, 'src', path.slice(2) + '.ts') });
    b.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents:
      'export const isSupabaseConfigured = true; export const supabase = {from(...args) {return globalThis.commentTestClient.from(...args)}};' }));
  } }]
});
await mkdir(resolve(root, '.astro/tests'), { recursive: true });
const bundlePath = resolve(root, `.astro/tests/comments-${process.pid}.mjs`);
await writeFile(bundlePath, compiled.outputFiles[0].text);
const { CommentList, authStore } = await import(pathToFileURL(bundlePath));
const pending = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const result = data => ({ data, error: null });
const row = (id, floor = 1) => ({ id, floor_number: floor, content: id, likes_count: 0,
  user_id: 'author', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', profiles: { username: 'author' } });
function mock(steps) {
  const calls = [];
  globalThis.commentTestClient = { from(table) {
    const next = steps.shift();
    assert.ok(next, `unexpected ${table} query`);
    assert.equal(table, next.table);
    const call = { table, filters: {}, signal: null }; calls.push(call);
    const q = { then: (yes, no) => Promise.resolve(next.response).then(yes, no) };
    for (const key of ['select', 'eq', 'order', 'limit', 'gt', 'in', 'abortSignal']) {
      q[key] = (...args) => { call.filters[key] = args; if (key === 'abortSignal') call.signal = args[0]; return q; };
    }
    return q;
  } };
  return calls;
}
async function login(id) { await act(async () => authStore.set({ user: id ? { id } : null, session: null, isLoading: false, error: null })); }
afterEach(async () => { cleanup(); await login(null); });

test('changing article aborts the old request and rejects late results', async () => {
  const old = pending();
  const calls = mock([{ table: 'comments', response: old.promise }, { table: 'comments', response: result([row('new article')]) }]);
  const view = render(React.createElement(CommentList, { postSlug: 'old' }));
  view.rerender(React.createElement(CommentList, { postSlug: 'new' }));
  await screen.findByText('new article');
  await act(async () => old.resolve(result([row('old article')])));
  assert.equal(screen.queryByText('old article'), null);
  assert.equal(calls[0].signal.aborted, true);
});

test('late A likes cannot replace B likes after account switch', async () => {
  await login('A'); const old = pending();
  const calls = mock([
    { table: 'comments', response: result([row('comment')]) }, { table: 'comment_likes', response: old.promise },
    { table: 'comments', response: result([row('comment')]) }, { table: 'comment_likes', response: result([]) }
  ]);
  render(React.createElement(CommentList, { postSlug: 'post' }));
  await waitFor(() => assert.equal(calls.length, 2));
  await login('B'); await screen.findByText('comment');
  await act(async () => old.resolve(result([{ comment_id: 'comment' }])));
  assert.ok(screen.getByRole('button', { name: '🤍 0' }));
  assert.equal(calls[1].signal.aborted, true);
});

test('login while anonymous comments are pending fetches the new user likes', async () => {
  const old = pending();
  mock([
    { table: 'comments', response: old.promise },
    { table: 'comments', response: result([row('comment')]) },
    { table: 'comment_likes', response: result([{ comment_id: 'comment' }]) }
  ]);
  render(React.createElement(CommentList, { postSlug: 'post' }));
  await login('A'); await screen.findByRole('button', { name: '❤️ 0' });
  await act(async () => old.resolve(result([row('anonymous stale')])));
  assert.equal(screen.queryByText('anonymous stale'), null);
  assert.ok(screen.getByRole('button', { name: '❤️ 0' }));
});

test('refresh invalidates an in-flight page; pagination uses floors with bounded likes queries', async () => {
  await login('A'); const old = pending();
  const first = Array.from({ length: 20 }, (_, i) => row(`c${i + 1}`, i + 1));
  const calls = mock([
    { table: 'comments', response: old.promise },
    { table: 'comments', response: result(first) }, { table: 'comment_likes', response: result([]) },
    { table: 'comments', response: result([row('c21', 21)]) }, { table: 'comment_likes', response: result([]) }
  ]);
  const view = render(React.createElement(CommentList, { postSlug: 'post', refreshKey: 0 }));
  view.rerender(React.createElement(CommentList, { postSlug: 'post', refreshKey: 1 }));
  await screen.findByText('c1');
  fireEvent.click(screen.getByRole('button', { name: /加载更多评论/ }));
  await screen.findByText('c21');
  await act(async () => old.resolve(result([row('stale')])));
  assert.equal(screen.queryByText('stale'), null);
  assert.deepEqual(calls[3].filters.gt, ['floor_number', 20]);
  assert.equal(calls[2].filters.in[1].length, 20);
  assert.deepEqual(calls[4].filters.in[1], ['c21']);
});

test('failed likes query leaves no actionable row and can be retried', async () => {
  await login('A');
  mock([
    { table: 'comments', response: result([row('comment')]) },
    { table: 'comment_likes', response: { data: null, error: { message: 'likes unavailable' } } },
    { table: 'comments', response: result([row('comment')]) },
    { table: 'comment_likes', response: result([{ comment_id: 'comment' }]) }
  ]);
  render(React.createElement(CommentList, { postSlug: 'post' }));
  await screen.findByText(/likes unavailable/);
  assert.equal(screen.queryByText('comment'), null);
  fireEvent.click(screen.getByRole('button', { name: '重试加载评论' }));
  await screen.findByRole('button', { name: '❤️ 0' });
});
