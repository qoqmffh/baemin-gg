import { useState, type ReactNode } from 'react';
import { getPat, setPat } from '../lib/pat';

export default function PatGate({ children }: { children: ReactNode }) {
  const [pat, setPatState] = useState<string | null>(() => getPat());
  const [input, setInput] = useState('');

  if (pat) return <>{children}</>;

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        padding: 24,
        maxWidth: 480,
        margin: '0 auto',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.15)',
        background: '#0d0d0d',
        boxSizing: 'border-box',
      }}
    >
      <h2>GitHub Personal Access Token 입력</h2>
      <p>배민.GG는 GitHub 리포를 데이터베이스로 사용합니다. 쓰기 권한이 있는 PAT를 입력해주세요.</p>
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="ghp_..."
        style={{ width: '100%', padding: 8, marginBottom: 12, boxSizing: 'border-box' }}
      />
      <button
        onClick={() => {
          const token = input.trim();
          if (!token) return;
          setPat(token);
          setPatState(token);
        }}
      >
        저장
      </button>
    </div>
  );
}
