import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={`brand ${compact ? "brandCompact" : ""}`}>Ask<span>Clo</span><i>✦</i></Link>;
}
