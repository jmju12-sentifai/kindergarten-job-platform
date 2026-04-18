/**
 * 전화번호 자동 포매팅: 01054834160 → 010-5483-4160
 * 하이픈 있든 없든 숫자만 추출해서 포매팅
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * 날짜 포매팅: yyyy/mm/dd
 * input[type=date]는 브라우저마다 다르므로 텍스트 입력으로 처리
 * 숫자만 추출해서 yyyy/mm/dd 형태로 포매팅
 */
export function formatDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
}

/**
 * yyyy/mm/dd → yyyy-mm-dd (DB 저장용)
 */
export function dateToISO(formatted: string): string {
  return formatted.replace(/\//g, '-');
}

/**
 * yyyy-mm-dd → yyyy/mm/dd (UI 표시용)
 */
export function dateFromISO(iso: string): string {
  return iso.replace(/-/g, '/');
}

/**
 * 사업자번호 포매팅: 1475101159 → 147-51-01159
 */
export function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}
