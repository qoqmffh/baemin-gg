import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import Signup from './Signup';
import * as github from '../lib/github';
import type { Member } from '../types';

beforeEach(() => {
  vi.restoreAllMocks();
});

test('submitting the form appends a new member and shows a success message', async () => {
  const updateSpy = vi
    .spyOn(github, 'updateJsonFile')
    .mockImplementation(async (_path, _msg, updater) => {
      updater([]);
    });

  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('이름'), '김태준');
  await user.type(screen.getByLabelText('소속'), '개발');
  await user.type(screen.getByLabelText('부서'), '사원');
  await user.click(screen.getByRole('button', { name: '가입하기 →' }));

  expect(updateSpy).toHaveBeenCalledTimes(1);
  const [path, , updater] = updateSpy.mock.calls[0] as unknown as [
    string,
    string,
    (current: Member[]) => Member[],
  ];
  expect(path).toBe('data/members.json');
  const result = updater([]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ name: '김태준', department: '개발', position: '사원', rating: 1100, wins: 0, losses: 0 });

  expect(await screen.findByText('가입이 완료되었습니다.')).toBeInTheDocument();
});
