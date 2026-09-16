export function CollapseToggle({ expanded }: { expanded: boolean }) {
  return (
    <span className="shrink-0 text-[11px] text-faint">
      {expanded ? 'Collapse ↑' : 'Expand ↓'}
    </span>
  )
}
