// ==================== TYPES ====================

export interface Kindergarten {
  id: string;
  name: string;
  type: '국공립(단설)' | '국공립(병설)' | '사립(개인)' | '사립(법인)' | '사립(종교)';
  address: string;
  addressShort: string;
  lat: number;
  lng: number;
  directorName: string;
  phone: string;
  studentCount: number;
  classCount: number;
  evaluationGrade: 'A' | 'B' | 'C' | 'D';
  description: string;
}

export interface JobPosting {
  id: string;
  kindergarten: Kindergarten;
  title: string;
  position: '원감' | '담임교사' | '보조교사' | '방과후교사' | '특별활동강사';
  ageGroup: '만3세' | '만4세' | '만5세' | '혼합연령' | '무관';
  employmentType: '정규직' | '기간제' | '시간제';
  salary: string;
  salaryNegotiable: boolean;
  workHours: string;
  benefits: string[];
  requirements: string[];
  preferred: string[];
  description: string;
  customQuestions: string[];
  hasVacation: boolean;
  vacationInfo: string;
  insuranceProvided: boolean;
  retirementPayProvided: boolean;
  mealProvided: boolean;
  postedAt: string;
  deadline: string;
  applicantCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  photo: string;
  birthYear: number;
  region: string;
  certificates: string[];
  education: string;
  university: string;
  experienceYears: number;
  experiences: {
    institution: string;
    type: string;
    period: string;
    role: string;
    ageGroup: string;
  }[];
  skills: string[];
  desiredSalary: string;
  desiredEmploymentType: string;
  desiredRegion: string;
  introduction: string;
  available: boolean;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  teacherId: string;
  message: string;
  answers: string[];
  status: '검토중' | '면접요청' | '합격' | '불합격';
  appliedAt: string;
}

// ==================== MOCK DATA ====================

export const kindergartens: Kindergarten[] = [
  {
    id: 'k1',
    name: '햇살유치원',
    type: '사립(법인)',
    address: '서울특별시 강남구 역삼동 123-45',
    addressShort: '서울 강남구',
    lat: 37.4979,
    lng: 127.0276,
    directorName: '김영희',
    phone: '02-1234-5678',
    studentCount: 120,
    classCount: 6,
    evaluationGrade: 'A',
    description: '자연친화적 교육을 지향하는 햇살유치원입니다. 넓은 운동장과 텃밭을 갖추고 있으며, 아이들의 창의력과 인성 발달에 중점을 둡니다.',
  },
  {
    id: 'k2',
    name: '꿈나무유치원',
    type: '국공립(단설)',
    address: '서울특별시 서초구 반포동 67-89',
    addressShort: '서울 서초구',
    lat: 37.5045,
    lng: 127.0048,
    directorName: '박미숙',
    phone: '02-2345-6789',
    studentCount: 90,
    classCount: 5,
    evaluationGrade: 'A',
    description: '국공립 유치원으로 누리과정을 충실히 운영합니다. 안정적인 교육환경과 다양한 체험활동 프로그램을 제공합니다.',
  },
  {
    id: 'k3',
    name: '별빛유치원',
    type: '사립(개인)',
    address: '경기도 성남시 분당구 정자동 45-12',
    addressShort: '경기 성남시',
    lat: 37.3595,
    lng: 127.1052,
    directorName: '이정아',
    phone: '031-3456-7890',
    studentCount: 80,
    classCount: 4,
    evaluationGrade: 'B',
    description: '몬테소리 교육철학을 기반으로 운영되는 별빛유치원입니다. 아이 개개인의 발달 속도에 맞춘 개별화 교육을 실시합니다.',
  },
  {
    id: 'k4',
    name: '푸른숲유치원',
    type: '사립(법인)',
    address: '서울특별시 송파구 잠실동 234-56',
    addressShort: '서울 송파구',
    lat: 37.5133,
    lng: 127.1001,
    directorName: '최은영',
    phone: '02-4567-8901',
    studentCount: 150,
    classCount: 8,
    evaluationGrade: 'A',
    description: '숲체험 교육과 놀이중심 교육과정으로 유명한 푸른숲유치원입니다. 넓은 실내외 놀이 공간을 보유하고 있습니다.',
  },
  {
    id: 'k5',
    name: '사랑유치원',
    type: '국공립(병설)',
    address: '인천광역시 연수구 송도동 78-90',
    addressShort: '인천 연수구',
    lat: 37.3807,
    lng: 126.6609,
    directorName: '정수현',
    phone: '032-5678-9012',
    studentCount: 60,
    classCount: 3,
    evaluationGrade: 'B',
    description: '초등학교 병설 유치원으로 초등 연계 교육이 강점입니다. 소규모 학급 운영으로 세심한 돌봄을 제공합니다.',
  },
];

export const jobPostings: JobPosting[] = [
  {
    id: 'j1',
    kindergarten: kindergartens[0],
    title: '만4세반 담임교사 모집',
    position: '담임교사',
    ageGroup: '만4세',
    employmentType: '정규직',
    salary: '월 250만원 ~ 280만원',
    salaryNegotiable: false,
    workHours: '09:00 ~ 18:00 (주 5일)',
    benefits: ['4대보험', '퇴직금', '중식 제공', '교통비 지원', '교육연수비 지원', '경조사비', '하계/동계 방학'],
    requirements: ['유치원 정교사 2급 이상', '경력 2년 이상'],
    preferred: ['정교사 1급 소지자', '피아노 가능자', '몬테소리 교육 이수자'],
    description: '햇살유치원에서 만4세반을 담당할 담임교사를 모집합니다. 자연친화적 교육과정에 관심 있는 열정적인 선생님의 지원을 기다립니다.\n\n주요 업무:\n- 만4세반 누리과정 운영\n- 학부모 상담 및 소통\n- 교육계획안 작성 및 실행\n- 행사 기획 및 참여',
    customQuestions: [
      '자연친화 교육에 대한 본인의 교육 철학을 간략히 서술해주세요.',
      '이전 근무지에서 가장 보람 있었던 교육 활동은 무엇인가요?',
    ],
    hasVacation: true,
    vacationInfo: '하계 2주, 동계 3주',
    insuranceProvided: true,
    retirementPayProvided: true,
    mealProvided: true,
    postedAt: '2026-04-01',
    deadline: '2026-04-30',
    applicantCount: 12,
  },
  {
    id: 'j2',
    kindergarten: kindergartens[1],
    title: '만5세반 담임교사 채용',
    position: '담임교사',
    ageGroup: '만5세',
    employmentType: '정규직',
    salary: '호봉제 적용',
    salaryNegotiable: false,
    workHours: '08:30 ~ 16:30 (주 5일)',
    benefits: ['4대보험', '퇴직금', '중식 제공', '교통비 지원', '건강검진', '연수비 지원', '하계/동계 방학', '근속수당'],
    requirements: ['유치원 정교사 2급 이상', '임용고시 합격자'],
    preferred: ['특수교육 자격증 소지자'],
    description: '꿈나무유치원 만5세반 담임교사를 모집합니다. 누리과정 운영 경험이 있으신 선생님을 환영합니다.',
    customQuestions: [
      '초등 연계 교육에 대한 경험이나 계획을 말씀해주세요.',
    ],
    hasVacation: true,
    vacationInfo: '하계 3주, 동계 4주',
    insuranceProvided: true,
    retirementPayProvided: true,
    mealProvided: true,
    postedAt: '2026-04-03',
    deadline: '2026-04-25',
    applicantCount: 8,
  },
  {
    id: 'j3',
    kindergarten: kindergartens[2],
    title: '보조교사 모집 (만3세반)',
    position: '보조교사',
    ageGroup: '만3세',
    employmentType: '기간제',
    salary: '월 210만원',
    salaryNegotiable: true,
    workHours: '09:00 ~ 17:00 (주 5일)',
    benefits: ['4대보험', '퇴직금', '중식 제공'],
    requirements: ['보육교사 2급 이상'],
    preferred: ['유아교육 관련 전공자', '경력자 우대'],
    description: '별빛유치원 만3세반 보조교사를 모집합니다. 몬테소리 교구 활용 교육에 관심 있는 분을 환영합니다.',
    customQuestions: [],
    hasVacation: true,
    vacationInfo: '하계 2주, 동계 2주',
    insuranceProvided: true,
    retirementPayProvided: true,
    mealProvided: true,
    postedAt: '2026-04-05',
    deadline: '2026-05-05',
    applicantCount: 5,
  },
  {
    id: 'j4',
    kindergarten: kindergartens[3],
    title: '방과후과정 전담교사 모집',
    position: '방과후교사',
    ageGroup: '혼합연령',
    employmentType: '정규직',
    salary: '월 230만원 ~ 260만원',
    salaryNegotiable: false,
    workHours: '13:00 ~ 19:00 (주 5일)',
    benefits: ['4대보험', '퇴직금', '석식 제공', '교통비 지원'],
    requirements: ['유치원 정교사 2급 이상 또는 보육교사 1급 이상'],
    preferred: ['방과후과정 운영 경험자', '체육/미술/음악 특기자'],
    description: '푸른숲유치원에서 방과후과정을 전담할 교사를 모집합니다. 놀이 중심의 방과후 프로그램을 기획하고 운영하실 분을 찾습니다.',
    customQuestions: [
      '방과후과정에서 운영하고 싶은 프로그램을 2가지 제안해주세요.',
      '혼합연령 학급 운영 경험이 있으신가요?',
      '본인의 특기와 이를 교육에 어떻게 활용할 수 있는지 말씀해주세요.',
    ],
    hasVacation: true,
    vacationInfo: '하계 1주, 동계 2주',
    insuranceProvided: true,
    retirementPayProvided: true,
    mealProvided: true,
    postedAt: '2026-04-07',
    deadline: '2026-05-10',
    applicantCount: 3,
  },
  {
    id: 'j5',
    kindergarten: kindergartens[4],
    title: '원감 모집',
    position: '원감',
    ageGroup: '무관',
    employmentType: '정규직',
    salary: '협의',
    salaryNegotiable: true,
    workHours: '08:30 ~ 17:30 (주 5일)',
    benefits: ['4대보험', '퇴직금', '중식 제공', '교통비 지원', '건강검진', '자녀 교육비 지원'],
    requirements: ['유치원 정교사 1급', '경력 5년 이상', '원감 자격증 소지자'],
    preferred: ['국공립 유치원 근무 경험자', '행정 업무 경험자'],
    description: '사랑유치원에서 원감 선생님을 모집합니다. 교육과정 운영 총괄 및 교사 관리, 학부모 소통 등의 업무를 담당하게 됩니다.',
    customQuestions: [
      '유치원 교육과정 운영에 대한 본인의 비전을 말씀해주세요.',
    ],
    hasVacation: true,
    vacationInfo: '하계 2주, 동계 3주',
    insuranceProvided: true,
    retirementPayProvided: true,
    mealProvided: true,
    postedAt: '2026-04-02',
    deadline: '2026-04-20',
    applicantCount: 2,
  },
  {
    id: 'j6',
    kindergarten: kindergartens[0],
    title: '특별활동 영어강사 모집',
    position: '특별활동강사',
    ageGroup: '무관',
    employmentType: '시간제',
    salary: '시간당 3만원',
    salaryNegotiable: true,
    workHours: '10:00 ~ 14:00 (주 3일)',
    benefits: ['4대보험', '중식 제공'],
    requirements: ['영어교육 관련 자격증', 'TOEIC 900점 이상 또는 동등'],
    preferred: ['유아 영어교육 경험자', '원어민 수준 영어 구사자'],
    description: '햇살유치원에서 유아 대상 영어 특별활동 강사를 모집합니다. 놀이와 노래를 활용한 영어 수업을 진행합니다.',
    customQuestions: [],
    hasVacation: false,
    vacationInfo: '',
    insuranceProvided: true,
    retirementPayProvided: false,
    mealProvided: true,
    postedAt: '2026-04-08',
    deadline: '2026-05-15',
    applicantCount: 7,
  },
];

export const teachers: Teacher[] = [
  {
    id: 't1',
    name: '이수진',
    photo: '',
    birthYear: 1995,
    region: '서울 강남구',
    certificates: ['유치원 정교사 2급', '보육교사 1급'],
    education: '학사',
    university: '이화여자대학교 유아교육과',
    experienceYears: 4,
    experiences: [
      { institution: '하늘유치원', type: '사립(법인)', period: '2022.03 ~ 2025.02', role: '담임교사', ageGroup: '만4세' },
      { institution: '무지개어린이집', type: '민간', period: '2021.03 ~ 2022.02', role: '보조교사', ageGroup: '만3세' },
    ],
    skills: ['피아노', '미술활동', '동화구연'],
    desiredSalary: '월 250만원 이상',
    desiredEmploymentType: '정규직',
    desiredRegion: '서울 강남/서초',
    introduction: '4년간 유치원에서 담임교사로 근무하며 다양한 연령의 아이들과 함께했습니다. 아이들의 눈높이에서 소통하며, 창의적인 놀이 중심 교육을 지향합니다. 특히 미술활동과 동화를 활용한 통합교육에 강점이 있습니다.',
    available: true,
    updatedAt: '2026-04-05',
  },
  {
    id: 't2',
    name: '박지현',
    photo: '',
    birthYear: 1990,
    region: '경기 성남시',
    certificates: ['유치원 정교사 1급', '보육교사 1급', '놀이치료사'],
    education: '석사',
    university: '중앙대학교 유아교육과 석사',
    experienceYears: 8,
    experiences: [
      { institution: '꿈동산유치원', type: '사립(법인)', period: '2020.03 ~ 2026.02', role: '담임교사', ageGroup: '만5세' },
      { institution: '초록유치원', type: '국공립(단설)', period: '2017.03 ~ 2020.02', role: '담임교사', ageGroup: '만4세' },
      { institution: '행복어린이집', type: '국공립', period: '2016.03 ~ 2017.02', role: '보조교사', ageGroup: '만3세' },
    ],
    skills: ['피아노', '우쿨렐레', '체육활동', '코딩교육'],
    desiredSalary: '월 300만원 이상',
    desiredEmploymentType: '정규직',
    desiredRegion: '서울/경기',
    introduction: '8년 경력의 유치원 정교사 1급 소지자입니다. 놀이치료사 자격을 활용하여 특별한 돌봄이 필요한 아이들도 세심하게 지도합니다. 최근 유아 코딩교육에도 관심을 가지고 관련 연수를 이수했습니다.',
    available: true,
    updatedAt: '2026-04-03',
  },
  {
    id: 't3',
    name: '김하은',
    photo: '',
    birthYear: 1998,
    region: '서울 송파구',
    certificates: ['유치원 정교사 2급'],
    education: '학사',
    university: '한국교원대학교 유아교육과',
    experienceYears: 1,
    experiences: [
      { institution: '나래유치원', type: '사립(개인)', period: '2025.03 ~ 2026.02', role: '담임교사', ageGroup: '만3세' },
    ],
    skills: ['피아노', '영어회화', '그림책 읽어주기'],
    desiredSalary: '월 220만원 이상',
    desiredEmploymentType: '정규직',
    desiredRegion: '서울 송파/강동',
    introduction: '한국교원대 유아교육과를 졸업하고 1년간 만3세반 담임을 맡았습니다. 아이들과 함께 성장하는 교사가 되고 싶습니다. 영어회화가 가능하여 영어 놀이 활동도 진행할 수 있습니다.',
    available: true,
    updatedAt: '2026-04-07',
  },
  {
    id: 't4',
    name: '정다은',
    photo: '',
    birthYear: 1993,
    region: '인천 연수구',
    certificates: ['유치원 정교사 1급', '보육교사 1급', '특수교육 정교사 2급'],
    education: '학사',
    university: '부산대학교 유아교육과',
    experienceYears: 6,
    experiences: [
      { institution: '바다유치원', type: '사립(법인)', period: '2021.03 ~ 2026.02', role: '담임교사', ageGroup: '만5세' },
      { institution: '솔빛유치원', type: '국공립(병설)', period: '2019.03 ~ 2021.02', role: '담임교사', ageGroup: '만4세' },
    ],
    skills: ['특수교육', '미술치료', '체육활동'],
    desiredSalary: '월 280만원 이상',
    desiredEmploymentType: '정규직',
    desiredRegion: '인천/경기 서부',
    introduction: '통합교육에 전문성을 갖춘 교사입니다. 특수교육 자격과 미술치료 경험을 바탕으로 모든 아이가 함께 성장하는 교실을 만들어갑니다.',
    available: true,
    updatedAt: '2026-04-01',
  },
  {
    id: 't5',
    name: '오서연',
    photo: '',
    birthYear: 1997,
    region: '서울 마포구',
    certificates: ['유치원 정교사 2급', '보육교사 2급'],
    education: '학사',
    university: '숙명여자대학교 아동복지학과',
    experienceYears: 2,
    experiences: [
      { institution: '하모니유치원', type: '사립(개인)', period: '2024.03 ~ 2026.02', role: '담임교사', ageGroup: '만4세' },
    ],
    skills: ['피아노', '동요작곡', '율동'],
    desiredSalary: '월 230만원 이상',
    desiredEmploymentType: '정규직',
    desiredRegion: '서울 마포/용산/서대문',
    introduction: '음악을 활용한 교육에 특기가 있습니다. 직접 동요를 작곡하여 수업에 활용하며, 아이들이 음악을 통해 즐겁게 배울 수 있는 환경을 만듭니다.',
    available: false,
    updatedAt: '2026-03-28',
  },
];

export const applications: Application[] = [
  { id: 'a1', jobId: 'j1', teacherId: 't1', message: '자연친화 교육에 깊은 관심을 가지고 있습니다. 이전 근무지에서도 텃밭 활동을 진행한 경험이 있어 햇살유치원의 교육 철학에 공감합니다.', answers: ['자연은 최고의 교실이라고 생각합니다. 아이들이 직접 흙을 만지고 식물을 키우며 생명의 소중함을 배울 수 있도록 돕고 싶습니다.', '만4세반에서 텃밭 프로젝트를 진행했을 때, 아이들이 직접 기른 채소로 요리활동까지 연계하여 큰 보람을 느꼈습니다.'], status: '검토중', appliedAt: '2026-04-05' },
  { id: 'a2', jobId: 'j1', teacherId: 't2', message: '8년 경력을 바탕으로 햇살유치원의 교육에 기여하고 싶습니다.', answers: ['숲 교육과 자연물을 활용한 미술활동을 접목한 통합교육을 추구합니다.', '만5세반에서 1년간 프로젝트 수업을 진행하며 아이들의 탐구력이 크게 향상된 경험이 있습니다.'], status: '면접요청', appliedAt: '2026-04-04' },
  { id: 'a3', jobId: 'j3', teacherId: 't3', message: '몬테소리 교육에 관심이 많아 지원합니다. 관련 연수를 이수 중입니다.', answers: [], status: '검토중', appliedAt: '2026-04-06' },
  { id: 'a4', jobId: 'j4', teacherId: 't5', message: '음악을 활용한 방과후 프로그램을 기획하고 싶습니다.', answers: ['1) 동요 창작 교실: 아이들이 직접 가사를 만들고 노래하는 활동\n2) 리듬놀이 체육: 음악에 맞춰 신체활동을 하는 프로그램', '담임 시절 혼합연령 그룹 활동을 주 2회 진행한 경험이 있습니다.', '피아노와 동요작곡이 특기이며, 율동을 결합한 음악교육으로 아이들의 표현력과 신체발달을 동시에 도울 수 있습니다.'], status: '검토중', appliedAt: '2026-04-08' },
];

// ==================== STATS (Admin) ====================

export const adminStats = {
  totalUsers: 342,
  totalKindergartens: 128,
  totalTeachers: 214,
  totalJobPostings: 89,
  activeJobPostings: 37,
  totalApplications: 456,
  newUsersThisMonth: 28,
  newPostingsThisMonth: 15,
};
