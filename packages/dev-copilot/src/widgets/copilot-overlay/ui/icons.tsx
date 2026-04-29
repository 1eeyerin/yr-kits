import type { ComponentPropsWithoutRef } from "react";

type SvgIconProps = ComponentPropsWithoutRef<"svg">;

export const SparklesIcon = (props: SvgIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3.75 13.68 8.32 18.25 10 13.68 11.68 12 16.25 10.32 11.68 5.75 10 10.32 8.32 12 3.75Z" />
      <path d="M18.5 3.75 19.08 5.42 20.75 6 19.08 6.58 18.5 8.25 17.92 6.58 16.25 6 17.92 5.42 18.5 3.75Z" />
      <path d="M6 15.5 7 18.25 9.75 19.25 7 20.25 6 23 5 20.25 2.25 19.25 5 18.25 6 15.5Z" />
    </svg>
  );
};

export const PanelRightOpenIcon = (props: SvgIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2.25" />
      <path d="M8.75 4.75v14.5" />
      <path d="m13 9.25 3 2.75-3 2.75" />
    </svg>
  );
};

export const PanelRightCloseIcon = (props: SvgIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2.25" />
      <path d="M15.25 4.75v14.5" />
      <path d="m11 9.25-3 2.75 3 2.75" />
    </svg>
  );
};
