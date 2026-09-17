import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TopNav from '../components/TopNav';
import PageBackground from '../components/PageBackground';
import SideTaglines from '../components/SideTaglines';
import { updateJsonFile } from '../lib/github';
import { MEMBERS_PATH, INITIAL_RATING } from '../config';
import type { Member } from '../types';
import './Signup.css';

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={1.8} />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth={1.8} />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M14 20c0-2.5 1.8-4.2 4-4.2s4 1.7 4 4.2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="1.2" stroke="currentColor" strokeWidth={1.8} />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

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

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PageBackground />
      <SideTaglines />
      <TopNav />
      <div className="signup-wrap">
        <div className="signup-card">
          {done ? (
            <p>가입이 완료되었습니다.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="signup-card__eyebrow">JOIN US</div>
              <h1>회원가입</h1>
              <p className="signup-card__subtitle">함께하는 배드민턴, 더 멀리 가는 우리</p>

              <div className="signup-field">
                <PersonIcon />
                <input
                  aria-label="이름"
                  placeholder="이름을 입력하세요."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="signup-field">
                <GroupIcon />
                <input
                  aria-label="소속"
                  placeholder="소속을 입력하세요. (예: 학교, 회사, 동호회 등)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
              <div className="signup-field">
                <BuildingIcon />
                <input
                  aria-label="부서"
                  placeholder="부서를 입력하세요. (예: 인사팀, 개발팀 등)"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                />
              </div>

              {error && <p role="alert">{error}</p>}
              <button type="submit" className="signup-submit" disabled={submitting}>
                가입하기 →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
