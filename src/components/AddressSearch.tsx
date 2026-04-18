'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
          sido: string;
          sigungu: string;
        }) => void;
      }) => { open: () => void };
    };
  }
}

export default function AddressSearch({
  value,
  onChange,
  placeholder = '주소를 검색해주세요',
}: {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}) {
  const scriptLoaded = useRef(false);
  const detailRef = useRef<HTMLInputElement>(null);
  const [baseAddress, setBaseAddress] = useState('');
  const [detail, setDetail] = useState('');

  // 기존 값에서 base/detail 분리 (초기 로드 시)
  useEffect(() => {
    if (value && !baseAddress) {
      // "도로명주소 상세주소" 형태로 저장되므로, 첫 로드시는 통째로 base에
      setBaseAddress(value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scriptLoaded.current) return;
    if (document.getElementById('daum-postcode-script')) { scriptLoaded.current = true; return; }

    const script = document.createElement('script');
    script.id = 'daum-postcode-script';
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => { scriptLoaded.current = true; };
    document.head.appendChild(script);
  }, []);

  const handleSearch = () => {
    if (!window.daum) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.roadAddress || data.jibunAddress || data.address;
        setBaseAddress(addr);
        setDetail('');
        onChange(addr);
        // 검색 후 상세주소 입력란으로 포커스
        setTimeout(() => detailRef.current?.focus(), 100);
      },
    }).open();
  };

  const handleDetailChange = (v: string) => {
    setDetail(v);
    const full = v.trim() ? `${baseAddress} ${v.trim()}` : baseAddress;
    onChange(full);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={baseAddress}
          readOnly
          onClick={handleSearch}
          placeholder={placeholder}
          className="input-field flex-1 cursor-pointer"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="h-[42px] px-4 text-xs font-semibold bg-[#EAF5EC] text-[#4EA85E] rounded-[10px] hover:bg-[#A5D6A7]/40 flex-shrink-0 flex items-center gap-1"
        >
          <Icon name="search" size={14} />
          검색
        </button>
      </div>
      {baseAddress && (
        <input
          ref={detailRef}
          type="text"
          value={detail}
          onChange={(e) => handleDetailChange(e.target.value)}
          placeholder="상세주소 입력 (동/호수)"
          className="input-field"
        />
      )}
    </div>
  );
}
