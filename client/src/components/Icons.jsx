export function DotsIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M15 18l-6-6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CaretIcon({ direction = "down", ...props }) {
  const rotation = direction === "right" ? "rotate(-90 12 12)" : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M7 10l5 5 5-5"
        transform={rotation}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FolderIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M3.5 7.25A2.75 2.75 0 0 1 6.25 4.5h4.1c.7 0 1.36.27 1.85.76l1.06 1.06c.2.2.47.31.76.31h3.78A2.75 2.75 0 0 1 20.55 9.4v7.85A2.75 2.75 0 0 1 17.8 20H6.25A2.75 2.75 0 0 1 3.5 17.25V7.25Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M4.75 7.5A2 2 0 0 1 6.75 5.5h3.6c.5 0 .98.2 1.33.55l1.3 1.3c.28.28.66.44 1.06.44h3.76a2 2 0 0 1 2 2v7.46a2.25 2.25 0 0 1-2.25 2.25H6.75A2 2 0 0 1 4.75 17.5V7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UploadIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M12 15V4m0 0l-4 4m4-4l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17.5A2.5 2.5 0 0 0 6.5 20h11A2.5 2.5 0 0 0 20 17.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SunIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2m0 16v2M4 12H2m20 0h-2M5.1 5.1l1.4 1.4m11 11 1.4 1.4M18.9 5.1l-1.4 1.4m-11 11-1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoonIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7.5 7.5 0 1 0 11.5 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BoxIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M21 8.5V15.5a2 2 0 0 1-1.1 1.8l-7 3.5a2 2 0 0 1-1.8 0l-7-3.5A2 2 0 0 1 3 15.5V8.5a2 2 0 0 1 1.1-1.8l7-3.5a2 2 0 0 1 1.8 0l7 3.5A2 2 0 0 1 21 8.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M3.4 7.2l8.6 4.3 8.6-4.3M12 11.7v9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DriveIcon(props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="64"
      height="64"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M14 22c0-4.4 3.6-8 8-8h20c4.4 0 8 3.6 8 8v18c0 6.6-5.4 12-12 12H26c-6.6 0-12-5.4-12-12V22Z"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 24h20M22 32h16"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="44" cy="44" r="3.5" fill="currentColor" />
    </svg>
  );
}
