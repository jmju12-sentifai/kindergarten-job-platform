// Chibi-proportioned kindergarten kid. Big head, tiny body. Minimal features.

export function KidFlat({ size = 220 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      {/* soft backdrop */}
      <circle cx="100" cy="100" r="92" fill="#EAF5EC" />

      {/* tiny body */}
      <path
        d="M72 170 Q72 140 100 140 Q128 140 128 170 Z"
        fill="#66c477"
      />

      {/* face */}
      <circle cx="100" cy="92" r="46" fill="#FFE4D1" />

      {/* hair — simple bowl cut */}
      <path
        d="M54 92 Q54 50 100 50 Q146 50 146 92 Q146 82 138 80 Q126 72 100 72 Q74 72 62 80 Q54 82 54 92 Z"
        fill="#2F7A3F"
      />

      {/* eyes */}
      <circle cx="84" cy="96" r="3.2" fill="#1F2B1F" />
      <circle cx="116" cy="96" r="3.2" fill="#1F2B1F" />

      {/* smile */}
      <path
        d="M92 112 Q100 118 108 112"
        stroke="#1F2B1F"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Kid3D({ size = 220 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id="k3bg" cx="30%" cy="25%" r="90%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#EAF5EC" />
          <stop offset="100%" stopColor="#A5D6A7" />
        </radialGradient>
        <radialGradient id="k3face" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFF4E6" />
          <stop offset="65%" stopColor="#FFE0C8" />
          <stop offset="100%" stopColor="#E9B994" />
        </radialGradient>
        <radialGradient id="k3hair" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#66c477" />
          <stop offset="60%" stopColor="#3D8B4C" />
          <stop offset="100%" stopColor="#1E5C2B" />
        </radialGradient>
        <radialGradient id="k3body" cx="30%" cy="25%" r="95%">
          <stop offset="0%" stopColor="#BFE8C6" />
          <stop offset="45%" stopColor="#66c477" />
          <stop offset="100%" stopColor="#2F7A3F" />
        </radialGradient>
        <filter id="k3soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* backdrop orb */}
      <circle cx="100" cy="100" r="94" fill="url(#k3bg)" />

      {/* ground shadow */}
      <ellipse cx="100" cy="176" rx="44" ry="5" fill="#1F2B1F" opacity="0.18" filter="url(#k3soft)" />

      {/* body shadow */}
      <path
        d="M72 170 Q72 140 100 140 Q128 140 128 170 Z"
        fill="#1F2B1F"
        opacity="0.12"
        transform="translate(1.5 2)"
        filter="url(#k3soft)"
      />
      {/* body */}
      <path d="M72 170 Q72 140 100 140 Q128 140 128 170 Z" fill="url(#k3body)" />

      {/* face shadow */}
      <circle cx="102" cy="94" r="46" fill="#1F2B1F" opacity="0.12" filter="url(#k3soft)" />
      {/* face */}
      <circle cx="100" cy="92" r="46" fill="url(#k3face)" />
      {/* face highlight */}
      <ellipse cx="84" cy="76" rx="11" ry="6" fill="#FFFFFF" opacity="0.55" />

      {/* hair */}
      <path
        d="M54 92 Q54 50 100 50 Q146 50 146 92 Q146 82 138 80 Q126 72 100 72 Q74 72 62 80 Q54 82 54 92 Z"
        fill="url(#k3hair)"
      />
      {/* hair shine */}
      <path
        d="M74 62 Q92 56 110 58"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* eyes */}
      <ellipse cx="84" cy="96" rx="3.3" ry="3.7" fill="#1F2B1F" />
      <ellipse cx="116" cy="96" rx="3.3" ry="3.7" fill="#1F2B1F" />
      <circle cx="85" cy="94.5" r="1" fill="#FFFFFF" />
      <circle cx="117" cy="94.5" r="1" fill="#FFFFFF" />

      {/* subtle cheeks */}
      <circle cx="78" cy="104" r="5" fill="#F4A7A7" opacity="0.45" />
      <circle cx="122" cy="104" r="5" fill="#F4A7A7" opacity="0.45" />

      {/* smile */}
      <path
        d="M92 112 Q100 120 108 112"
        stroke="#1F2B1F"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
