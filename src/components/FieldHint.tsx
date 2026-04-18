export default function FieldHint({ status, messages }: {
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  messages: { checking?: string; valid: string; invalid: string };
}) {
  if (status === 'idle') return null;

  return (
    <p className={`text-[11px] mt-0.5 ${
      status === 'checking' ? 'text-muted' :
      status === 'valid' ? 'text-[#4EA85E]' :
      'text-danger'
    }`}>
      {status === 'checking' ? (messages.checking || '확인 중...') : status === 'valid' ? messages.valid : messages.invalid}
    </p>
  );
}
