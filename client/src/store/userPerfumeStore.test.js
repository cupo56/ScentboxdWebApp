import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/userPerfumeService', () => ({
  getUserPerfumeStatuses: vi.fn(),
  togglePerfumeStatus: vi.fn(),
}));
vi.mock('./toastStore', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { getUserPerfumeStatuses, togglePerfumeStatus } from '../services/userPerfumeService';
import { toast } from './toastStore';
import useUserPerfumeStore from './userPerfumeStore';

beforeEach(() => {
  vi.clearAllMocks();
  useUserPerfumeStore.getState().reset();
});

describe('userPerfumeStore', () => {
  it('loads the status map once per user', async () => {
    getUserPerfumeStatuses.mockResolvedValue([
      { perfume_id: 'p1', is_favorite: true, is_owned: false, is_want_to_try: false },
    ]);

    await useUserPerfumeStore.getState().load('u1');
    await useUserPerfumeStore.getState().load('u1');

    expect(getUserPerfumeStatuses).toHaveBeenCalledTimes(1);
    expect(useUserPerfumeStore.getState().statuses.p1.is_favorite).toBe(true);
    expect(useUserPerfumeStore.getState().loadedFor).toBe('u1');
  });

  it('reloads for a different user', async () => {
    getUserPerfumeStatuses.mockResolvedValue([]);

    await useUserPerfumeStore.getState().load('u1');
    await useUserPerfumeStore.getState().load('u2');

    expect(getUserPerfumeStatuses).toHaveBeenCalledTimes(2);
  });

  it('toggles optimistically and keeps the server result', async () => {
    togglePerfumeStatus.mockResolvedValue({ perfume_id: 'p1', is_favorite: true, is_owned: false, is_want_to_try: false });

    const pending = useUserPerfumeStore.getState().toggle('p1', 'is_favorite');
    expect(useUserPerfumeStore.getState().statuses.p1.is_favorite).toBe(true);
    await pending;

    expect(togglePerfumeStatus).toHaveBeenCalledWith('p1', 'is_favorite');
    expect(useUserPerfumeStore.getState().statuses.p1.is_favorite).toBe(true);
  });

  it('reverts and toasts when the toggle fails', async () => {
    togglePerfumeStatus.mockRejectedValue(new Error('boom'));

    await useUserPerfumeStore.getState().toggle('p1', 'is_owned');

    expect(useUserPerfumeStore.getState().statuses.p1?.is_owned ?? false).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Failed to update status: boom');
  });

  it('reset clears everything', async () => {
    getUserPerfumeStatuses.mockResolvedValue([{ perfume_id: 'p1', is_favorite: true }]);
    await useUserPerfumeStore.getState().load('u1');

    useUserPerfumeStore.getState().reset();

    expect(useUserPerfumeStore.getState()).toMatchObject({ statuses: {}, loadedFor: null });
  });
});
