// 이력서 PDF 생성 유틸 — html2canvas + jsPDF + 교집합 로고 워터마크
// 이력서 편집 화면과 인재 상세 뷰 양쪽에서 공용으로 사용한다.

const WATERMARK_URL = '/logo1_gyo.png';
const WATERMARK_SIZE_MM = 18;
const WATERMARK_MARGIN_MM = 8;

async function loadImageDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateResumePdf(element: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = '800px';
  clone.style.zIndex = '-9999';
  clone.style.background = '#ffffff';
  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollY: 0,
    scrollX: 0,
    windowWidth: 800,
  });
  document.body.removeChild(clone);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = (canvas.height * pdfW) / canvas.width;
  const pageH = pdf.internal.pageSize.getHeight();

  if (pdfH <= pageH) {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  } else {
    let offset = 0;
    while (offset < pdfH) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -offset, pdfW, pdfH);
      offset += pageH;
    }
  }

  // 모든 페이지에 교집합 로고 워터마크 (좌상단)
  try {
    const watermark = await loadImageDataUrl(WATERMARK_URL);
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.addImage(
        watermark,
        'PNG',
        WATERMARK_MARGIN_MM,
        WATERMARK_MARGIN_MM,
        WATERMARK_SIZE_MM,
        WATERMARK_SIZE_MM,
      );
    }
  } catch {
    // 워터마크 로딩 실패해도 본문은 그대로 저장
  }

  pdf.save(filename);
}

export function printResume() {
  window.print();
}
