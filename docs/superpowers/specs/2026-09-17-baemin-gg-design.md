# 배민.GG 설계 문서

날짜: 2026-09-17
작업 위치: `C:\Users\user\Desktop\Dev\태준개인개발파일\배민.GG`

## 1. 개요

사내 배드민턴 동아리(배민클럽)의 대전 기록과 랭크(레이팅)를 관리하는 반응형 웹앱.
회원가입, 경기 등록, 레이팅 산정, 리더보드 조회, 회원 검색, 클럽 소개, 숨겨진 관리자 기능을 제공한다.

## 2. 기술 스택

- **Vite + React (TypeScript)**
- `framer-motion` — 제공된 HoverImageReveal 컴포넌트를 홈 화면 배경 인터랙션으로 재사용
- `react-router-dom` — 클라이언트 라우팅
- 빌드 산출물은 GitHub Actions로 자동 빌드하여 GitHub Pages(같은 리포)로 배포

## 3. 리포지토리 & 배포 구조

- **단일 public GitHub 리포** 하나에 앱 코드와 데이터 파일을 함께 둔다.
  - GitHub Pages는 개인 Free 플랜에서 private 리포를 지원하지 않으므로 리포는 public이어야 함.
  - 이로 인해 `data/` 아래 JSON은 누구나 읽을 수 있음 — 그래서 회원가입 항목에서 **휴대폰 번호를 수집하지 않는다** (이름/부서/직급만).
- `data/members.json`, `data/matches.json` — 리포 루트에 위치.

## 4. 데이터 모델

```jsonc
// data/members.json
[
  {
    "id": "uuid",
    "name": "string",
    "department": "string",
    "position": "string",
    "rating": 1200,
    "wins": 0,
    "losses": 0,
    "createdAt": "ISO8601"
  }
]

// data/matches.json
[
  {
    "id": "uuid",
    "type": "singles" | "doubles",
    "teamA": ["memberId", ...],   // singles: 1명, doubles: 2명
    "teamB": ["memberId", ...],
    "scoreA": 21,
    "scoreB": 15,
    "winner": "A" | "B",
    "ratingChanges": { "memberId": <delta>, ... },
    "playedAt": "ISO8601",
    "recordedAt": "ISO8601"
  }
]
```

## 5. GitHub API 쓰기 흐름 (회원가입 / 경기등록 / 관리자 삭제 공통)

1. GitHub Contents API로 대상 JSON 파일을 GET → 현재 내용 + `sha` 획득
2. 클라이언트에서 새 레코드를 추가/수정/삭제한 JSON 구성
3. 같은 API로 PUT하여 커밋 (base64 인코딩, 자동 생성된 커밋 메시지, 기존 `sha` 첨부)
4. 커밋 시 `sha` 불일치(409)로 실패하면 최신본을 다시 GET하여 병합 후 재시도 (최대 2~3회). 최종 실패 시 사용자에게 재시도 안내 메시지 표시.

### PAT(Personal Access Token) 처리

- 최초 접속 시 PAT 입력 모달 → `localStorage`에 저장, 이후 자동 사용.
- 리포 owner/name, 데이터 파일 경로는 코드 상수로 고정 (동아리 전용 하드코딩).
- 리포가 public이므로 코드/데이터 자체는 누구나 열람 가능하지만, 쓰기는 유효한 PAT 소지자만 가능. 이 프로젝트는 신뢰 기반 내부용으로 이 수준의 보안을 허용한다.

## 6. 레이팅(랭크) 시스템 — 플레이스홀더

- 정식 공식은 추후 사용자가 별도로 확정할 예정. 지금은 **표준 Elo를 임시값**으로 구현한다.
- 로직은 `src/lib/rating.ts` 한 파일에 격리하여, 나중에 공식만 교체 가능하도록 한다.
- 초기 레이팅: 1200 (임시값)
- 단복식 통합 단일 레이팅 사용 (분리하지 않음)
- 복식은 "팀 평균 레이팅 vs 팀 평균 레이팅"으로 기대승률을 계산하고, 승패에 따른 변동폭을 팀원 전원에게 동일하게 적용
- 경기 등록 시점에 계산한 `ratingChanges`를 `matches.json`에 스냅샷으로 저장 (재계산 없이 이력 추적 가능)

## 7. 화면 구성

### 홈 (`/`)
- 제공된 `HoverImageReveal` 컴포넌트를 배경 인터랙션으로 재사용
- 헤드 텍스트 "배민.GG" — VITRO CORE 폰트
- 메뉴 5개 (영문, VITRO CORE 폰트로 통일):
  - `FIND PLAYER` — 클릭 시 같은 화면에서 검색창이 framer-motion 애니메이션과 함께 인라인으로 펼쳐짐 (모달 아님)
  - `MATCH RECORD` → `/record`
  - `LEADERBOARD` → `/rankings`
  - `CLUB INFO` → `/club`
  - `SIGN UP` → `/signup`
- 모바일에서는 마우스 호버 대신 탭으로 이미지 프리뷰 전환

### 전적검색 (홈 인라인)
- 회원명 검색(부분일치) → 레이팅, 승/패, 최근 5경기 표시

### 전적기록 (`/record`)
- 회원 검색으로 팀 구성 (단식 2명 / 복식 4명)
- 스코어 입력 → 등록 시 Elo 계산 → `matches.json` + `members.json` 갱신 커밋
- 누구나 등록 가능 (신뢰 기반, 별도 인증 없음)

### 전적현황/리더보드 (`/rankings`)
- 레이팅 순위표
- 최근 경기 리스트
- "최대 이변 승리" — 레이팅 차이 대비 하위 랭커가 이긴 경기 순위

### 클럽정보 (`/club`)
- 현재는 플레이스홀더 텍스트로 구성. 실제 콘텐츠는 이후 코드 파일을 직접 수정해 반영 (기업컨설팅 사이트와 동일한 패턴).

### 회원가입 (`/signup`)
- 이름, 부서, 직급 입력 → `members.json`에 커밋 (휴대폰 번호 없음)

### 관리자 (`/admin`, 히든)
- 간단한 비밀번호 입력(프론트 단순 검증)으로 접근
- 회원 삭제, 경기기록 삭제 모두 지원
- 경기기록 삭제 시 관련 레이팅은 재계산하지 않고 그대로 둠 (삭제된 경기는 이후 이력에서만 제외됨)

## 8. 반응형 & 폰트

- 모바일/태블릿/PC 반응형 — CSS 브레이크포인트 기반, Playwright로 모바일 폭 확인 필수
- VITRO CORE/INSPIRE/PRIDE 폰트 `@font-face`로 등록, `public/fonts/`에 포함
- 홈 화면 헤드 및 메뉴 텍스트는 VITRO CORE 통일 적용

## 9. 알려진 제약 (의도적으로 수용)

- 리포가 public이므로 회원 이름/부서/직급, 전적 데이터는 누구나 열람 가능 (링크를 아는 사람만 접근한다는 전제의 내부용 신뢰 기반 설계)
- PAT는 localStorage 저장 기반이며 브라우저/기기 단위로 별도 입력 필요
- 레이팅 공식은 임시 Elo이며 추후 교체 예정
