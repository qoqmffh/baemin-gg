import { beforeEach, expect, test, vi } from 'vitest';
import { updateJsonFile } from './github';
import { setPat } from './pat';

function githubContentResponse(data: unknown, sha: string) {
  const json = JSON.stringify(data);
  const content = Buffer.from(json, 'utf-8').toString('base64');
  return { content, sha };
}

beforeEach(() => {
  localStorage.clear();
  setPat('ghp_test_token');
  vi.restoreAllMocks();
});

test('reads, updates, and writes the file in one round trip when there is no conflict', async () => {
  const getResponse = githubContentResponse([{ id: '1' }], 'sha-1');
  const fetchMock = vi
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify(getResponse), { status: 200 }))
    .mockResolvedValueOnce(new Response('{}', { status: 200 }));

  await updateJsonFile<{ id: string }[]>('data/members.json', 'add member', (current) => [
    ...current,
    { id: '2' },
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  const putCall = fetchMock.mock.calls[1];
  expect(putCall[1]?.method).toBe('PUT');
  const putBody = JSON.parse(putCall[1]!.body as string);
  expect(putBody.sha).toBe('sha-1');
  const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf-8'));
  expect(decoded).toEqual([{ id: '1' }, { id: '2' }]);
});

test('retries after a 409 conflict by re-fetching the latest sha', async () => {
  const firstGet = githubContentResponse([{ id: '1' }], 'sha-1');
  const secondGet = githubContentResponse([{ id: '1' }, { id: 'other' }], 'sha-2');
  const fetchMock = vi
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify(firstGet), { status: 200 }))
    .mockResolvedValueOnce(new Response('conflict', { status: 409 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(secondGet), { status: 200 }))
    .mockResolvedValueOnce(new Response('{}', { status: 200 }));

  await updateJsonFile<{ id: string }[]>('data/members.json', 'add member', (current) => [
    ...current,
    { id: '2' },
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(4);
  const secondPutCall = fetchMock.mock.calls[3];
  const putBody = JSON.parse(secondPutCall[1]!.body as string);
  expect(putBody.sha).toBe('sha-2');
  const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf-8'));
  expect(decoded).toEqual([{ id: '1' }, { id: 'other' }, { id: '2' }]);
});

test('throws after exhausting retries on repeated conflicts', async () => {
  const get = githubContentResponse([{ id: '1' }], 'sha-1');
  vi.spyOn(global, 'fetch').mockImplementation(async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (!init || init.method === undefined) {
      return new Response(JSON.stringify(get), { status: 200 });
    }
    return new Response('conflict', { status: 409 });
  });

  await expect(
    updateJsonFile<{ id: string }[]>('data/members.json', 'add member', (current) => [
      ...current,
      { id: '2' },
    ])
  ).rejects.toThrow(/conflicts/);
});
