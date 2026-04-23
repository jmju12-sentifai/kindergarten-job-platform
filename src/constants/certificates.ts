export const CERTIFICATES = [
  '유치원 정교사 2급',
  '유치원 정교사 1급',
  '유치원 원감',
  '유치원 원장',
  '보육교사',
] as const;
export type CertificateType = typeof CERTIFICATES[number];

// UI에서 '기타' 선택 시 직접 입력. 저장 시에는 입력값이 그대로 name에 들어간다.
export const CERT_OTHER = '기타' as const;

export function isFixedCertificate(name: string): boolean {
  return (CERTIFICATES as readonly string[]).includes(name);
}

