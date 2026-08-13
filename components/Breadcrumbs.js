import Link from "next/link";

export default function Breadcrumbs({ module, moduleId, unit, unitId, deck }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/library">Modules</Link>{module ? <><span>›</span><Link href={moduleId ? `/subjects/${moduleId}` : "/library"}>{module}</Link></> : null}{unit ? <><span>›</span><Link href={unitId ? `/study-units/${unitId}` : "/library"}>{unit}</Link></> : null}{deck ? <><span>›</span><strong>{deck}</strong></> : null}</nav>;
}
