import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      {props.children}
    </svg>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M20 8v6M17 11h6" />
    </Icon>
  );
}

export function IconCoin(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </Icon>
  );
}

export function IconLoan(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </Icon>
  );
}

export function IconFine(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3 3 19h18L12 3z" />
      <path d="M12 10v4M12 16.5v.5" />
    </Icon>
  );
}

export function IconShare(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
      <path d="M8 11.2 14.8 8M8 12.8l6.8 3.2" />
    </Icon>
  );
}

export function IconReport(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5M8 13h8M8 17h5" />
    </Icon>
  );
}

export function IconActivity(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </Icon>
  );
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </Icon>
  );
}

export function IconBack(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M15 5 8 12l7 7" />
    </Icon>
  );
}

export function IconPrint(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 8V3h10v5" />
      <path d="M6 16H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1" />
      <path d="M7 13h10v8H7z" />
    </Icon>
  );
}
