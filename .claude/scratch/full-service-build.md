# 교집합 전체 서비스 구축 계획

## 원문 요구사항

> v2 디자인 기반으로 전체 서비스 구축. 회원가입(구직/구인 분기, 카카오 가입 UI), 로그인, 공고(기관당 1개 + 다포지션 태그), 이력서, 지원하기(이력서+기관별 세부질문), 마이페이지(구직/구인 분기), 기관 상세, 내부 알림, 푸터 사업자정보. 첨부 와이어프레임 기반.
>
> 비밀번호 추가, 카카오톡 가입(기능 구현은 없더라도 UI), 가입유형 분기(왼쪽 구직자/오른쪽 구인자), 지원하기는 이력서 자동 전송 + 기관별 세부질문, 알림은 내부만, 기관 페이지 넣기, 검색 필터는 있는 것만.

---

## Phase 0: 기반 작업

### 0-1. v2를 메인 홈으로 적용
- **파일**: `src/app/page.tsx`
- **작업**: 현재 `/designs/v2/page.tsx` 내용을 `/page.tsx`로 이동
- `src/app/designs/` 폴더는 삭제하지 않고 유지 (시안 비교용)

### 0-2. 푸터 사업자 정보 추가
- **파일**: `src/components/Footer.tsx`
- **변경**: 하단에 사업자 정보 블록 추가
```
상호: 교집합 | 대표: 최성웅
사업자등록번호: 147-51-01159
주소: 경기도 부천시 소사구 범안로129번길 72, 106동 1301호
업태: 정보통신업 | 종목: 포털 및 기타 인터넷 정보 매개 서비스업
```

### 0-3. mock 데이터 구조 개편
- **파일**: `src/data/mock.ts`
- **핵심 변경**: 기관당 공고 1개 + 포지션 여러 개 구조로 전환

**변경할 타입:**

```ts
// 기존 JobPosting을 기관 공고로 변환
interface InstitutionPosting {
  id: string;
  kindergarten: Kindergarten;
  positions: PositionEntry[];   // 다포지션
  customQuestions: string[];     // 기관 공통 세부질문
  postedAt: string;
  deadline: string;
  description: string;          // 공고 소개
}

interface PositionEntry {
  id: string;
  position: '원감' | '담임교사' | '보조교사' | '방과후교사' | '특별활동강사';
  ageGroup: '만3세' | '만4세' | '만5세' | '혼합연령' | '무관';
  headcount: number;            // 모집 인원
  employmentType: '정규직' | '기간제' | '시간제';
  salary: string;
  salaryNegotiable: boolean;
  workHours: string;
  benefits: string[];
  requirements: string[];
  preferred: string[];
  hasVacation: boolean;
  vacationInfo: string;
  insuranceProvided: boolean;
  retirementPayProvided: boolean;
  mealProvided: boolean;
}
```

**추가할 타입:**

```ts
// 유저 (공통)
interface User {
  id: string;
  email: string;
  userType: 'teacher' | 'institution';
  createdAt: string;
}

// 구직자 프로필
interface TeacherProfile extends User {
  userType: 'teacher';
  name: string;
  birthDate: string;
  address: string;
  phone: string;
  photo: string;                // 프로필 사진
  affiliation?: string;         // 현재 소속기관 (선택)
}

// 구인자 프로필
interface InstitutionProfile extends User {
  userType: 'institution';
  kindergarten: Kindergarten;
  businessNumber: string;       // 사업자번호
  registrationNumber: string;   // 기관 고유번호
  purpose: ('교원모집' | '구인')[];  // 가입목적 (최대 2)
  photos: string[];             // 정경사진들
}

// 이력서
interface Resume {
  id: string;
  teacherId: string;
  photo: string;
  name: string;
  birthDate: string;
  age: number;
  phone: string;
  certificates: { name: string; issuer: string }[];
  affiliation?: string;
  experiences: {
    institution: string;
    period: string;
    role: string;
    ageGroup: string;
  }[];
  introduction: string;         // 자기소개
  portfolio?: string;           // 자기개발/공모/포트폴리오
  updatedAt: string;
}

// 지원서 (개편)
interface Application {
  id: string;
  postingId: string;            // InstitutionPosting ID
  positionId: string;           // PositionEntry ID
  teacherId: string;
  resumeId: string;             // 자동 첨부될 이력서
  message: string;
  answers: string[];            // customQuestions 답변
  status: '검토중' | '면접요청' | '합격' | '불합격';
  appliedAt: string;
}

// 내부 알림
interface Notification {
  id: string;
  userId: string;
  type: 'application_received'    // 기관: 지원서 도착
      | 'status_changed'          // 구직자: 상태 변경
      | 'interview_request'       // 구직자: 면접 요청
      | 'result_notification';    // 구직자: 합격/불합격
  title: string;
  message: string;
  link: string;                   // 클릭 시 이동할 경로
  read: boolean;
  createdAt: string;
}
```

---

## Phase 1: 인증 (회원가입 / 로그인)

### 1-1. 가입유형 선택 페이지
- **라우트**: `/signup`
- **파일**: `src/app/signup/page.tsx` (신규)
- **UI**: 좌/우 2분할 — 왼쪽 "구직자(교사)", 오른쪽 "구인자(기관)"
- 각각 클릭 시 `/signup/teacher` 또는 `/signup/institution`으로 이동

### 1-2. 구직자 회원가입
- **라우트**: `/signup/teacher`
- **파일**: `src/app/signup/teacher/page.tsx` (신규)
- **폼 필드**:
  - 이름 (필수)
  - 생년월일 (필수, date picker)
  - 주소 (필수)
  - 전화번호 (필수)
  - 이메일 (필수)
  - 비밀번호 / 비밀번호 확인 (필수)
  - 소속기관 (선택)
  - 프로필 사진 (JPG, 파일 업로드 UI)
- **상단**: 카카오 가입 버튼 (UI only, 클릭 시 "준비 중" 토스트)
- **하단**: "이미 계정이 있으신가요? 로그인" 링크

### 1-3. 구인자(기관) 회원가입
- **라우트**: `/signup/institution`
- **파일**: `src/app/signup/institution/page.tsx` (신규)
- **폼 필드**:
  - 기관명 (필수)
  - 주소 (필수)
  - 전화번호 (필수)
  - 사업자번호 (필수)
  - 이메일 (필수)
  - 비밀번호 / 비밀번호 확인 (필수)
  - 가입목적 — 체크박스 2개 중 택 (교원모집 / 구인)
  - 등록번호 (기관 고유번호)
  - 정경사진 (JPG, 다중 파일 업로드 UI)
- **상단**: 카카오 가입 버튼 (UI only)

### 1-4. 로그인 개편
- **라우트**: `/login` (기존 개편)
- **파일**: `src/app/login/page.tsx`
- **변경**:
  - 회원가입 탭 제거 (별도 페이지로 분리했으므로)
  - 이메일 + 비밀번호 입력
  - 카카오 로그인 버튼 (UI only)
  - "계정이 없으신가요? 회원가입" → `/signup`으로 링크
  - 로그인 시 mock으로 userType에 따라 분기 (localStorage 또는 context)

### 1-5. 인증 상태 관리
- **파일**: `src/contexts/AuthContext.tsx` (신규)
- **역할**: 현재 로그인된 유저 정보(mock) + userType 관리
- Provider를 layout.tsx에 감싸기
- Header에서 로그인 상태에 따라 UI 전환 (로그인/회원가입 ↔ 마이페이지/로그아웃/알림)

---

## Phase 2: 기관 & 공고

### 2-1. 기관 상세 페이지
- **라우트**: `/institutions/[id]`
- **파일**: `src/app/institutions/[id]/page.tsx` (신규)
- **UI**:
  - 기관 정경사진 (상단 갤러리)
  - 기관명, 설립유형, 주소, 연락처, 원장명
  - 원생수, 학급수, 평가등급
  - 기관 소개
  - 현재 진행중인 공고 (해당 기관의 InstitutionPosting → 포지션 태그들)
  - 지도 (기존 Google Maps iframe)

### 2-2. 공고 등록 개편
- **라우트**: `/jobs/new` (기존 개편)
- **파일**: `src/app/jobs/new/page.tsx`
- **핵심 변경**:
  - 기관당 1개 공고 구조 → 공고 기본정보 + 포지션 여러 개 추가 UI
  - 기관정보는 로그인된 기관 프로필에서 자동 로드
  - 포지션 추가 UI: "포지션 추가" 버튼 → 담임/보조/원감/방과후/특별활동 선택 → 각 포지션별 세부(연령, 고용형태, 급여, 근무시간, 조건 등) 폼
  - 포지션 태그 형태로 추가/삭제 가능
  - 세부질문: 기관 공통 커스텀 질문 최대 5개

### 2-3. 공고 목록 개편
- **라우트**: `/jobs` (기존 개편)
- **파일**: `src/app/jobs/page.tsx`
- **핵심 변경**:
  - 기관 기반 공고 카드 (기관사진 + 기관명 + 포지션 태그들)
  - 포지션 태그 클릭 시 해당 포지션만 하이라이트/필터
  - 기존 필터 유지 (지역, 직종, 설립유형, 고용형태)
  - v2 디자인 톤 적용 (라운드 카드, 초록 태그)

### 2-4. 공고 상세 개편
- **라우트**: `/jobs/[id]` (기존 개편)
- **파일**: `src/app/jobs/[id]/page.tsx`
- **핵심 변경**:
  - 상단: 기관정보 + 기관 사진
  - 포지션 태그 탭 (담임교사 | 보조교사 | 원감 …) → 클릭 시 해당 포지션 상세로 전환
  - 각 포지션 상세: 급여, 근무시간, 조건, 우대사항
  - 지원하기 버튼 → 지원 모달
  - 사이드바: 기관 요약 (클릭 시 `/institutions/[id]`로)

### 2-5. 지원하기 모달 개편
- **파일**: `src/app/jobs/[id]/page.tsx` 내 모달 또는 `src/components/ApplyModal.tsx` (신규)
- **UI**:
  - 상단: "내 이력서가 자동으로 전송됩니다" 안내 + 이력서 미리보기 링크
  - 지원 메시지 (textarea)
  - 기관별 세부질문 (customQuestions 기반 동적 textarea 목록)
  - 제출 버튼

---

## Phase 3: 이력서

### 3-1. 이력서 작성/수정
- **라우트**: `/resume/edit`
- **파일**: `src/app/resume/edit/page.tsx` (신규)
- **폼 필드** (와이어프레임 기반):
  - 사진 업로드
  - 이름, 생년월일, 나이 (자동계산), 전화번호
  - 자격증 목록 (자격명 + 발급기관, 동적 추가/삭제)
  - 현재 소속
  - 경력사항 (기관명, 기간, 역할, 담당연령, 동적 추가/삭제)
  - 자기소개 (textarea)
  - 자기개발/포트폴리오 (textarea 또는 파일 첨부 UI)

### 3-2. 이력서 조회
- **라우트**: `/resume/[id]` 또는 기존 `/talents/[id]` 개편
- **파일**: `src/app/talents/[id]/page.tsx` (기존 개편)
- **UI**: 이력서 정보를 읽기 전용으로 표시. 기관 사용자가 지원자 이력서를 볼 때 사용

---

## Phase 4: 마이페이지

### 4-1. 마이페이지 분기
- **라우트**: `/mypage` (기존 개편)
- **파일**: `src/app/mypage/page.tsx`
- **로직**: AuthContext의 userType에 따라 구직자/구인자 뷰 분기

### 4-2. 구직자 마이페이지
- 내 프로필 요약 (이름, 연락처, 사진)
- 내 이력서 보기/수정 버튼 → `/resume/edit`
- 지원 내역 리스트 (공고명, 기관명, 지원일, 상태 배지)
- 알림 목록

### 4-3. 구인자(기관) 마이페이지
- 기관 프로필 요약 (기관명, 주소, 사진)
- 내 공고 관리 → 공고 수정 링크 (`/jobs/new` 편집모드)
- 들어온 지원서 목록 (지원자명, 지원 포지션, 지원일, 상태)
  - 각 지원서 클릭 → 이력서 보기 + 상태 변경 (검토중 → 면접요청 → 합격/불합격)
- 알림 목록

---

## Phase 5: 알림

### 5-1. 알림 시스템
- **파일**: `src/data/mock.ts`에 Notification 타입 + mock 알림 데이터 추가
- **컴포넌트**: `src/components/NotificationBell.tsx` (신규)
  - Header 우측에 벨 아이콘 + 미읽은 개수 뱃지
  - 클릭 시 드롭다운 — 최근 알림 5개 + "전체보기" 링크
- **라우트**: `/notifications` (신규) — 전체 알림 목록 페이지
- **알림 유형**:
  - 기관 → "새 지원서가 도착했습니다" (지원서 상세로 링크)
  - 구직자 → "면접 요청이 왔습니다" / "합격을 축하합니다" / "결과가 통보되었습니다"

---

## Phase 6: 공통 컴포넌트 & 마무리

### 6-1. v2 디자인 톤 전체 적용
- 기존 페이지들(jobs, talents, login, mypage 등) 모두 v2 톤으로 통일
- 라운드 카드, 초록 그라디언트 태그, Pretendard, 부드러운 그림자
- 모바일 반응형 검증

### 6-2. 공통 컴포넌트 추가
| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| ApplyModal | `src/components/ApplyModal.tsx` | 지원하기 모달 |
| NotificationBell | `src/components/NotificationBell.tsx` | 헤더 알림 벨 |
| FileUpload | `src/components/FileUpload.tsx` | 사진/파일 업로드 UI (공통) |
| PositionTag | `src/components/PositionTag.tsx` | 포지션 태그 칩 |
| StatusBadge | `src/components/StatusBadge.tsx` | 지원 상태 뱃지 |
| Toast | `src/components/Toast.tsx` | "준비 중" 등 간단 토스트 |

### 6-3. Header 개편
- **파일**: `src/components/Header.tsx`
- **변경**:
  - 로그인 전: 로그인 | 회원가입
  - 로그인 후: 알림벨 | 마이페이지 | 로그아웃
  - 기관 로그인 시: 내 공고 관리 메뉴 추가

---

## 라우트 전체 맵

```
/                           메인 홈 (v2)
/login                      로그인
/signup                     가입유형 선택 (구직/구인 분기)
/signup/teacher             구직자 회원가입
/signup/institution         구인자(기관) 회원가입
/jobs                       공고 목록
/jobs/[id]                  공고 상세 (포지션 탭)
/jobs/new                   공고 등록 (기관 전용)
/institutions/[id]          기관 상세
/talents                    인재 목록
/talents/[id]               이력서 조회
/resume/edit                이력서 작성/수정 (구직자 전용)
/mypage                     마이페이지 (구직/구인 분기)
/notifications              알림 전체보기
/admin                      관리자 (기존 유지)
```

---

## 데이터 흐름

```
[구인자(기관)]
  가입 → InstitutionProfile 생성
  공고 등록 → InstitutionPosting 생성 (포지션 N개)
  지원서 확인 → Application 조회 → 이력서(Resume) 열람 → 상태 변경
  상태 변경 → Notification 생성 (구직자에게)

[구직자(교사)]
  가입 → TeacherProfile 생성
  이력서 작성 → Resume 생성
  공고 탐색 → 공고 상세 → 지원하기
  지원 → Application 생성 (Resume 자동 첨부 + 세부질문 답변)
       → Notification 생성 (기관에게)
  알림 확인 → 상태 변경 확인
```

---

## 엣지케이스

1. **이력서 미작성 상태에서 지원** → "이력서를 먼저 작성해주세요" 안내 + `/resume/edit` 이동
2. **기관이 공고를 이미 등록한 경우** → `/jobs/new` 진입 시 기존 공고 편집 모드
3. **마감된 공고** → 지원 버튼 비활성화, "마감된 공고입니다" 표시
4. **구직자가 공고 등록 시도** → 접근 차단, "기관 계정으로 로그인해주세요"
5. **기관이 이력서 작성 시도** → 접근 차단
6. **중복 지원** → 같은 공고에 이미 지원한 경우 "이미 지원한 공고입니다" 표시

---

## 가정 (확인 필요)

1. **인증은 mock** — 실제 서버/DB 없이 localStorage + Context로 상태 시뮬레이션. 가입/로그인 시 mock 데이터에서 매칭.
2. **파일 업로드는 UI만** — 실제 업로드 없이 파일 선택 UI + 미리보기만 제공.
3. **카카오 로그인은 버튼만** — 클릭 시 "준비 중입니다" 토스트.
4. **기관당 공고 1개 제한** — 기존 공고가 있으면 새 공고 등록 불가, 편집만 가능.

---

## 구현 순서 (권장)

1. **Phase 0** — 기반 (v2 홈 적용, 푸터, mock 구조 개편)
2. **Phase 1** — 인증 (가입 분기, 구직/구인 가입, 로그인, AuthContext)
3. **Phase 2** — 공고 (등록 개편, 목록 개편, 상세 개편, 기관 상세, 지원 모달)
4. **Phase 3** — 이력서 (작성/수정, 조회)
5. **Phase 4** — 마이페이지 (구직/구인 분기)
6. **Phase 5** — 알림 (벨, 드롭다운, 전체보기)
7. **Phase 6** — 디자인 톤 통일 + 반응형 + 마무리
