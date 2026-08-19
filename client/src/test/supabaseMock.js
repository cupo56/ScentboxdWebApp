import { vi } from 'vitest';

// supabase-js query builders are "thenable": you chain methods like
// .from().select().eq().order() and then `await` the chain directly, with no
// terminal call. This mock returns a proxy-like chainable object where every
// method records the call and returns itself, and awaiting it resolves to
// whatever { data, error, count } the test configured via `resolveWith`.
export function createQueryBuilderMock(result = { data: null, error: null, count: null }) {
  const calls = {};
  const builder = {
    calls,
    resolveWith(next) {
      Object.assign(result, next);
      return builder;
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };

  const chainableMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'or', 'ilike', 'not', 'order', 'range', 'limit',
  ];
  for (const method of chainableMethods) {
    builder[method] = vi.fn((...args) => {
      calls[method] = calls[method] || [];
      calls[method].push(args);
      return builder;
    });
  }

  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));

  return builder;
}

export function createSupabaseMock() {
  const fromResults = new Map();
  const rpcResults = new Map();

  const supabase = {
    from: vi.fn((table) => {
      if (!fromResults.has(table)) {
        fromResults.set(table, [createQueryBuilderMock()]);
      }
      const queue = fromResults.get(table);
      return queue.length > 1 ? queue.shift() : queue[0];
    }),
    rpc: vi.fn((fn) => {
      return rpcResults.get(fn) || createQueryBuilderMock();
    }),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
  };

  return {
    supabase,
    // Queue a query builder to be returned for a `.from(table)` call. Calling
    // this multiple times for the same table queues sequential results,
    // useful when a service function calls `.from(table)` more than once.
    mockFrom(table, result) {
      const builder = createQueryBuilderMock(result);
      const queue = fromResults.get(table) || [];
      queue.push(builder);
      fromResults.set(table, queue);
      return builder;
    },
    mockRpc(fn, result) {
      const builder = createQueryBuilderMock(result);
      rpcResults.set(fn, builder);
      return builder;
    },
  };
}
