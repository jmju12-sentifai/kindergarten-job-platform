export const REGIONS: Record<string, string[]> = {
  '서울': [],
  '경기': [
    '가평', '고양', '과천', '광명', '광주', '구리', '군포', '김포',
    '남양주', '동두천', '부천', '성남', '수원', '시흥', '안산', '안성',
    '안양', '양주', '양평', '여주', '연천', '오산', '용인', '의왕',
    '의정부', '이천', '파주', '평택', '포천', '하남', '화성',
  ],
  '인천': [],
  '부산': [],
  '대구': [],
  '대전': [],
  '광주': [],
  '세종': [],
};

export type Region = keyof typeof REGIONS;
export const REGION_LIST = Object.keys(REGIONS) as Region[];
