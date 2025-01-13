export const FlashIcon = ({ isActive }: { isActive: boolean }) =>
  isActive ? (
    <svg width="20" height="19" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_105_127)">
        <path
          d="M7.42859 2.00003L7.42859 13H10.4286V22L17.4286 10H13.4286L17.4286 2.00003L7.42859 2.00003Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath>
          <rect width="24" height="24" fill="white" transform="translate(0.428589)" />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg width="20" height="19" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_75_1656)">
        <path
          d="M3.69859 3L2.42859 4.27L7.42859 9.27V13H10.4286V22L14.0086 15.86L18.1586 20L19.4286 18.73L3.69859 3ZM17.4286 10H13.4286L17.4286 2H7.42859V4.18L15.8886 12.64L17.4286 10Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath>
          <rect width="24" height="24" fill="white" transform="translate(0.428589)" />
        </clipPath>
      </defs>
    </svg>
  );
