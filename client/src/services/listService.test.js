import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({ supabase: {} }));

import { supabase } from '../lib/supabaseClient';
import { createSupabaseMock } from '../test/supabaseMock';
import {
  getUserLists,
  getListById,
  createList,
  addToList,
  removeFromList,
  updateList,
  deleteList,
} from './listService';

let mock;

beforeEach(() => {
  mock = createSupabaseMock();
  Object.assign(supabase, mock.supabase);
});

describe('getUserLists', () => {
  it('scopes to the user and orders newest first', async () => {
    const rows = [{ id: 'l1' }];
    const builder = mock.mockFrom('lists', { data: rows, error: null });

    await expect(getUserLists('user-1')).resolves.toEqual(rows);
    expect(builder.calls.eq).toEqual([['user_id', 'user-1']]);
    expect(builder.calls.order).toEqual([['created_at', { ascending: false }]]);
  });

  it('throws when the query errors', async () => {
    mock.mockFrom('lists', { data: null, error: new Error('boom') });
    await expect(getUserLists('user-1')).rejects.toThrow('boom');
  });
});

describe('getListById', () => {
  it('fetches a single list by id', async () => {
    const list = { id: 'l1', name: 'Signature Scents' };
    const builder = mock.mockFrom('lists', { data: list, error: null });

    await expect(getListById('l1')).resolves.toEqual(list);
    expect(builder.calls.eq).toEqual([['id', 'l1']]);
  });
});

describe('createList', () => {
  it('inserts with the given fields and applies defaults', async () => {
    const created = { id: 'l1', name: 'Summer', description: '', is_public: false };
    const builder = mock.mockFrom('lists', { data: created, error: null });

    await expect(createList({ name: 'Summer' })).resolves.toEqual(created);
    expect(builder.calls.insert).toEqual([[{ name: 'Summer', description: '', is_public: false }]]);
  });
});

describe('addToList', () => {
  it('inserts a list_items row linking the list and perfume', async () => {
    const builder = mock.mockFrom('list_items', { error: null });

    await addToList('l1', 'p1');

    expect(builder.calls.insert).toEqual([[{ list_id: 'l1', perfume_id: 'p1' }]]);
  });

  it('throws when the insert errors', async () => {
    mock.mockFrom('list_items', { error: new Error('duplicate') });
    await expect(addToList('l1', 'p1')).rejects.toThrow('duplicate');
  });
});

describe('removeFromList', () => {
  it('deletes the matching list_items row', async () => {
    const builder = mock.mockFrom('list_items', { error: null });

    await removeFromList('l1', 'p1');

    expect(builder.calls.eq).toEqual([['list_id', 'l1'], ['perfume_id', 'p1']]);
  });
});

describe('updateList', () => {
  it('updates only the fields provided and returns the updated row', async () => {
    const updated = { id: 'l1', name: 'Renamed' };
    const builder = mock.mockFrom('lists', { data: updated, error: null });

    await expect(updateList('l1', { name: 'Renamed', description: 'd', is_public: true })).resolves.toEqual(updated);
    expect(builder.calls.update).toEqual([[{ name: 'Renamed', description: 'd', is_public: true }]]);
    expect(builder.calls.eq).toEqual([['id', 'l1']]);
  });
});

describe('deleteList', () => {
  it('deletes by id', async () => {
    const builder = mock.mockFrom('lists', { error: null });

    await deleteList('l1');

    expect(builder.calls.eq).toEqual([['id', 'l1']]);
  });

  it('throws when the delete errors', async () => {
    mock.mockFrom('lists', { error: new Error('nope') });
    await expect(deleteList('l1')).rejects.toThrow('nope');
  });
});
