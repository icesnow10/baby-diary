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
      <path d="M3 6h18l-1.6 7.2c-.5 2.2-2.5 3.8-4.7 3.8H10.3c-2.2 0-4.2-1.6-4.7-3.8L3 6Z" />
      <path d="M9 10h6" />
    </svg>
  );
}

export function BottleIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M9 2h6" />
      <path d="M10 2v3" />
      <path d="M14 2v3" />
      <path d="M8 5h8l-1 3v11a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3V8L8 5Z" />
      <path d="M9 11h6" />
    </svg>
  );
}
