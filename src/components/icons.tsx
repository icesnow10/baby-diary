import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export function DiaperIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 7.5h16l-1.1 7.1A4 4 0 0 1 15 18H9a4 4 0 0 1-3.9-3.4L4 7.5Z" />
      <path d="M4.8 9.5c2.4 1.4 4.8 2.1 7.2 2.1s4.8-.7 7.2-2.1" />
      <path d="M8.2 8.1v2.3" />
      <path d="M15.8 8.1v2.3" />
      <path d="M9.7 15h4.6" />
    </svg>
  );
}

export function BottleIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <g transform="rotate(18 12 12)">
        <path d="M10 2.8h4" />
        <path d="M10.8 3v2.8" />
        <path d="M13.2 3v2.8" />
        <path d="M9 5.8h6l-1 3v9.1a3 3 0 0 1-6 0V8.8l1-3Z" />
        <path d="M8.6 10h6.8" />
        <path d="M10.2 13.2h3.6" />
        <path d="M10.2 16h3.6" />
      </g>
    </svg>
  );
}

export function PumpBottleIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M8.8 2.8h6.4a1.8 1.8 0 0 1 0 3.6H8.8a1.8 1.8 0 0 1 0-3.6Z" />
      <path d="M10 6.4v2" />
      <path d="M14 6.4v2" />
      <path d="M8.6 8.4h6.8l-1 3v6.9a3.4 3.4 0 0 1-6.8 0v-6.9l1-3Z" />
      <path d="M7.8 12h8.4" />
      <path d="M10.2 15.2h3.6" />
      <path d="M10.2 18h3.6" />
    </svg>
  );
}
