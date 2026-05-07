// 이력서 PDF 생성 유틸 — html2canvas + jsPDF
// 화면(.print-resume DOM)과 PDF가 100% 일치하도록, DOM에 박힌 워터마크
// (.resume-watermark-badge / .resume-watermark-bg)를 그대로 캡쳐에 포함시킨다.
// jsPDF는 캡쳐 이미지만 페이지에 배치하고 워터마크를 따로 그리지 않는다.

export async function generateResumePdf(element: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.zIndex = '-9999';
  clone.style.background = '#ffffff';
  clone.style.transform = 'none';
  // ※ 화면과 동일한 폭 유지를 위해 clone.style.width 를 임의로 늘리지 않는다.
  // 원본 element 의 inline width(RESUME_WIDTH=720)가 그대로 사용된다.

  // html2canvas는 폰트 베이스라인 계산이 브라우저와 미세하게 달라서
  // "이 력 서" 제목 borderBottom, 섹션 h3 아래의 테이블 top border가
  // 헤더 글자에 너무 가깝게 붙어 보인다. PDF 캡쳐 시에만 헤더 아래 여백을 늘림.
  // (셀 내부는 손대지 않음.)
  const overrideStyle = document.createElement('style');
  overrideStyle.textContent = `
    .print-resume h2 {
      padding-bottom: 18px !important;
      margin-bottom: 32px !important;
    }
    .print-resume h3 {
      margin-bottom: 14px !important;
    }
  `;
  clone.insertBefore(overrideStyle, clone.firstChild);

  document.body.appendChild(clone);

  // 폰트가 아직 로딩 중이면 fallback 메트릭으로 캡쳐돼 베이스라인이 어긋난다.
  // Pretendard Variable이 준비됐는지 확인 후 캡쳐.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollY: 0,
    scrollX: 0,
  });
  document.body.removeChild(clone);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // 좌우/상하 6mm 여백 — 컨테이너가 페이지 끝에 닿지 않게 가운데 정렬
  const marginX = 6;
  const marginY = 6;
  const contentW = pdfW - marginX * 2;
  const contentH = (canvas.height * contentW) / canvas.width;
  const pageContentH = pageH - marginY * 2;

  if (contentH <= pageContentH) {
    // 1페이지에 본문이 다 들어감 — 일반적인 이력서 케이스
    pdf.addImage(imgData, 'PNG', marginX, marginY, contentW, contentH);
  } else {
    // 멀티페이지 — 같은 캡쳐 이미지를 페이지마다 -offset 위치로 박아서 분할.
    // 페이지 경계의 위/아래 마진 영역은 흰 사각형으로 마스킹해 잔상 차단.
    let offset = 0;
    let isFirst = true;
    while (offset < contentH) {
      if (!isFirst) pdf.addPage();
      pdf.addImage(imgData, 'PNG', marginX, marginY - offset, contentW, contentH);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfW, marginY, 'F');
      pdf.rect(0, pageH - marginY, pdfW, marginY, 'F');
      offset += pageContentH;
      isFirst = false;
    }
  }

  pdf.save(filename);
}

export function printResume() {
  window.print();
}
