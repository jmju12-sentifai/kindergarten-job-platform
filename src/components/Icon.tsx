type IconName =
  | 'search'
  | 'leaf'
  | 'home'
  | 'mail'
  | 'target'
  | 'user'
  | 'users'
  | 'clock'
  | 'sparkle'
  | 'flame'
  | 'pencil'
  | 'megaphone'
  | 'building'
  | 'school'
  | 'sprout'
  | 'palm'
  | 'bowl'
  | 'bookmark'
  | 'star'
  | 'check'
  | 'bell';

const paths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  leaf: <path d="M4 20c8 0 16-6 16-16-8 0-16 6-16 16Zm0 0 8-8" />,
  home: <path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15 20c0-2.5 2-4.5 4-4.5s2 1 2 2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  sparkle: <path d="M12 3v6m0 6v6M3 12h6m6 0h6M6 6l3 3m6 6 3 3M18 6l-3 3m-6 6-3 3" />,
  flame: <path d="M12 3c1 3 4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 1-5 2 1 3-2 3-4Z" />,
  pencil: <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Zm10-13 3 3" />,
  megaphone: <path d="M4 10v4h3l7 4V6l-7 4H4Zm14-2a6 6 0 0 1 0 8" />,
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M10 21v-3h4v3" />
    </>
  ),
  school: <path d="M3 10 12 5l9 5-9 5-9-5Zm4 3v4c0 1 2 3 5 3s5-2 5-3v-4M20 11v6" />,
  sprout: <path d="M12 20v-6m0 0c0-3-3-4-6-4 0 3 3 6 6 6Zm0 0c0-3 3-5 6-5 0 3-3 5-6 5Z" />,
  palm: <path d="M12 21v-9m0 0c-2-4-7-4-9-2 2-1 5 0 6 2m3 0c2-4 7-3 9-1-2-1-5 0-6 2m-3 0c-1-3-4-5-7-4 1 2 4 4 7 4Zm0 0c1-3 4-5 7-4-1 2-4 4-7 4Z" />,
  bowl: <path d="M3 11h18a9 9 0 0 1-18 0Zm-1 0h20M8 7c0-2 2-2 2-4m4 4c0-2 2-2 2-4" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  star: <path d="m12 3 2.7 5.7 6.3.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.3-.9L12 3Z" />,
  check: <path d="m5 12 4 4 10-10" />,
  bell: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0" />,
};

export default function Icon({
  name,
  size = 20,
  stroke = 2,
  className = '',
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
