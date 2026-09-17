import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { updateJsonFile } from '../lib/github';
import { MEMBERS_PATH, INITIAL_RATING } from '../config';
import type { Member } from '../types';

export default function Signup() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateJsonFile<Member[]>(MEMBERS_PATH, `signup: ${name}`, (current) => [
        ...current,
        {
          id: uuidv4(),
          name,
          department,
          position,
          rating: INITIAL_RATING,
          wins: 0,
          losses: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDone(true);
    } catch (err) {
      setError('가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <p>가입이 완료되었습니다.</p>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>회원가입</h2>
      <label htmlFor="signup-name">이름</label>
      <input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} required />

      <label htmlFor="signup-department">부서</label>
      <input id="signup-department" value={department} onChange={(e) => setDepartment(e.target.value)} required />

      <label htmlFor="signup-position">직급</label>
      <input id="signup-position" value={position} onChange={(e) => setPosition(e.target.value)} required />

      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        가입하기
      </button>
    </form>
  );
}
