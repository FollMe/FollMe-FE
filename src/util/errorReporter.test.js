import { isChunkLoadError, reportError, resetReported } from './errorReporter';

beforeEach(() => {
  resetReported();
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
});

const sent = () => global.fetch.mock.calls.map(([, init]) => JSON.parse(init.body));

describe('reportError', () => {
  it('sends the message, stack and path once', () => {
    const err = new TypeError('x is undefined');
    reportError(err);
    reportError(err);
    expect(sent()).toHaveLength(1);
    expect(sent()[0]).toMatchObject({ message: 'x is undefined', path: '/' });
    expect(sent()[0].stack).toContain('TypeError');
    expect(global.fetch.mock.calls[0][1]).toMatchObject({ method: 'POST', keepalive: true });
  });

  it('caps a page at five reports and skips noise', () => {
    reportError(new Error('ResizeObserver loop completed with undelivered notifications.'));
    reportError('Script error.');
    for (let i = 0; i < 8; i++) {
      reportError(new Error(`boom ${i}`));
    }
    expect(sent().map(r => r.message)).toEqual(['boom 0', 'boom 1', 'boom 2', 'boom 3', 'boom 4']);
  });

  it('reports rejections with no Error, and never throws', () => {
    reportError('plain reason');
    reportError(undefined);
    global.fetch = jest.fn(() => { throw new Error('offline'); });
    expect(() => reportError(new Error('later'))).not.toThrow();
    expect(sent).not.toThrow();
  });
});

describe('isChunkLoadError', () => {
  it('knows a missing chunk after a deploy', () => {
    expect(isChunkLoadError(Object.assign(new Error('Loading chunk 723 failed.'), { name: 'ChunkLoadError' }))).toBe(true);
    expect(isChunkLoadError(new Error('Loading CSS chunk 45 failed.\n(/static/css/45.abc.chunk.css)'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /x.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});
