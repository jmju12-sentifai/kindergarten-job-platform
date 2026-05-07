export const REGIONS: Record<string, string[]> = {
  '인천': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구'],
  '부천': ['오정구', '소사구', '원미구'],
};

export type Region = keyof typeof REGIONS;
export const REGION_LIST = Object.keys(REGIONS) as Region[];
