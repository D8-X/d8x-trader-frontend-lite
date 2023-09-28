export const FilterIcon = ({ isActive, className }: { isActive: boolean; className?: string }) => {
  return isActive ? (
    <svg
      width="24"
      height="24"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_114_883)">
        <g>
          <path
            d="M2.83333 3.74002C4.18 5.46669 6.66666 8.66669 6.66666 8.66669V12.6667C6.66666 13.0334 6.96666 13.3334 7.33333 13.3334H8.66666C9.03333 13.3334 9.33333 13.0334 9.33333 12.6667V8.66669C9.33333 8.66669 11.8133 5.46669 13.16 3.74002C13.5 3.30002 13.1867 2.66669 12.6333 2.66669H3.36C2.80666 2.66669 2.49333 3.30002 2.83333 3.74002Z"
            fill="#6649DF"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_114_883">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg
      width="24"
      height="24"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_124_892)">
        <g>
          <path
            d="M4.66666 4.00002H11.3333L7.99333 8.20002L4.66666 4.00002ZM2.83333 3.74002C4.18 5.46669 6.66666 8.66669 6.66666 8.66669V12.6667C6.66666 13.0334 6.96666 13.3334 7.33333 13.3334H8.66666C9.03333 13.3334 9.33333 13.0334 9.33333 12.6667V8.66669C9.33333 8.66669 11.8133 5.46669 13.16 3.74002C13.5 3.30002 13.1867 2.66669 12.6333 2.66669H3.36C2.80666 2.66669 2.49333 3.30002 2.83333 3.74002Z"
            fill="#6649DF"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_124_892">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
