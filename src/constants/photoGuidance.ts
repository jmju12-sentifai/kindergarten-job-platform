export const PHOTO_GUIDANCE = {
  institution: {
    recommendedSize: '500 × 500px',
    aspectRatio: '1:1 정사각',
    description: '구인글 작성 시 기관 정보로 사진이 자동 노출됩니다. 유치원 마크 혹은 전경사진을 올려주세요.',
  },
  teacherProfile: {
    recommendedSize: '300 × 400px',
    aspectRatio: '3:4 증명사진',
    description: '이력서 제작 시 자동으로 등록되는 사진입니다. AI 편집/생성 사진은 사용 불가합니다. 그 외에는 노출되지 않습니다.',
  },
} as const;
