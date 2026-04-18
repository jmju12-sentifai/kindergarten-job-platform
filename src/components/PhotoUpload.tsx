'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';

const MAX_SIZE_MB = 10;
const TARGET_SIZE_MB = 1;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface Preview { url: string; name: string; size: string }

async function compressFile(file: File): Promise<File> {
  if (file.size <= TARGET_SIZE_MB * 1024 * 1024) return file;
  try {
    return await imageCompression(file, { maxSizeMB: TARGET_SIZE_MB, maxWidthOrHeight: 1920, useWebWorker: true });
  } catch {
    return file;
  }
}

export interface PhotoUploadHandle {
  uploadFiles: (bucket: string, folder: string) => Promise<string[]>;
}

/**
 * deferred=false (기본): 선택 즉시 Supabase Storage에 업로드
 * deferred=true: 선택 시 로컬 미리보기만, uploadFiles()로 나중에 업로드
 */
const PhotoUpload = forwardRef<PhotoUploadHandle, {
  label?: string;
  multiple?: boolean;
  iconName?: 'user' | 'home';
  bucket?: 'avatars' | 'photos';
  folder?: string;
  existingUrls?: string[];
  onUploaded?: (urls: string[]) => void;
  deferred?: boolean;
}>(function PhotoUpload({
  label = '사진을 선택해주세요',
  multiple = false,
  iconName = 'user',
  bucket = 'avatars',
  folder = '',
  existingUrls = [],
  onUploaded,
  deferred = false,
}, ref) {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFiles = useRef<File[]>([]);

  useEffect(() => {
    if (existingUrls.length > 0 && previews.length === 0) {
      setPreviews(existingUrls.map((url) => ({ url, name: '저장된 사진', size: '' })));
    }
  }, [existingUrls]); // eslint-disable-line react-hooks/exhaustive-deps

  // deferred 모드: 외부에서 호출하여 업로드
  useImperativeHandle(ref, () => ({
    uploadFiles: async (b: string, f: string) => {
      const supabase = createClient();
      const urls: string[] = [];
      for (const file of pendingFiles.current) {
        const processed = await compressFile(file);
        const ext = processed.name.split('.').pop() || 'jpg';
        const path = `${f}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(b).upload(path, processed, { cacheControl: '3600', upsert: false });
        if (!error) {
          const { data } = supabase.storage.from(b).getPublicUrl(path);
          urls.push(data.publicUrl);
        }
      }
      return urls;
    },
  }));

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: Preview[] = [];

    if (deferred) {
      // deferred: 로컬 미리보기만
      const compressed: File[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) { alert(`${file.name}: ${MAX_SIZE_MB}MB를 초과합니다.`); continue; }
        const processed = await compressFile(file);
        compressed.push(processed);
        newPreviews.push({ url: URL.createObjectURL(processed), name: processed.name, size: formatSize(processed.size) });
      }
      pendingFiles.current = multiple ? [...pendingFiles.current, ...compressed] : compressed;
      setPreviews(multiple ? [...previews, ...newPreviews] : newPreviews);
    } else {
      // 즉시 업로드
      setUploading(true);
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) { alert(`${file.name}: ${MAX_SIZE_MB}MB를 초과합니다.`); continue; }
        const processed = await compressFile(file);
        const ext = processed.name.split('.').pop() || 'jpg';
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, processed, { cacheControl: '3600', upsert: false });
        if (!error) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
          newPreviews.push({ url: data.publicUrl, name: processed.name, size: formatSize(processed.size) });
        }
      }

      const allPreviews = multiple ? [...previews, ...newPreviews] : newPreviews;
      setPreviews(allPreviews);
      setUploading(false);
      if (onUploaded) onUploaded(multiple ? [...existingUrls, ...uploadedUrls] : uploadedUrls);
    }
  };

  const handleRemove = (idx: number) => {
    setPreviews((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0 && inputRef.current) inputRef.current.value = '';
      if (deferred) pendingFiles.current = pendingFiles.current.filter((_, i) => i !== idx);
      else if (onUploaded) onUploaded(next.map((p) => p.url));
      return next;
    });
  };

  return (
    <div>
      <label className="flex items-center gap-2 h-[42px] px-4 bg-[#F7FAF6] border border-border rounded-[10px] cursor-pointer hover:border-[#66c477] transition-colors">
        <Icon name={iconName} size={16} className="text-muted flex-shrink-0" />
        <span className="text-sm text-muted truncate flex-1">
          {uploading
            ? '업로드 중...'
            : previews.length === 0
              ? label
              : multiple
                ? `${previews.length}장 선택됨`
                : previews[0].name}
        </span>
        <span className="text-[11px] font-semibold text-[#4EA85E] flex-shrink-0">
          {uploading ? '' : '찾아보기'}
        </span>
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handleChange} disabled={uploading} />
      </label>

      {previews.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {previews.map((p, i) => (
            <div key={i} className="relative group">
              <img src={p.url} alt={p.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
              {p.size && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-px rounded-b-lg">{p.size}</span>
              )}
              <button type="button" onClick={() => handleRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-border rounded-full text-muted hover:text-danger text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default PhotoUpload;
