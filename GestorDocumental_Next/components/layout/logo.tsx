import Link from "next/link";

type LogoProps = {
  className?: string;
  stateSidebar?: string;
  width?: string;
};

export default function Logo({ className, stateSidebar, width = "w-40" }: LogoProps) {
  return (
    <Link href="/" className={className}>
      {stateSidebar !== undefined && stateSidebar == "collapsed" ? (
        <img src="/ledmon_logo_small_old.png" className="w-20" alt="Ledmon Small" />
      ) : (
        <img src="/ledmon_logo_old.svg" className={width} alt="Ledmon" />
      )}
    </Link>
  );
}
