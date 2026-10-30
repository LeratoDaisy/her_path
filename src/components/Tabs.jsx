/** Accessible tab bar (arrow keys move between tabs). Panels are rendered by the parent. */
export default function Tabs({ tabs, value, onChange, label }) {
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === value);
    let next = null;
    if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
    if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
    if (next) {
      e.preventDefault();
      onChange(next.id);
      requestAnimationFrame(() => document.getElementById(`tab-${next.id}`)?.focus());
    }
  };
  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKey}>
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          className={value === t.id ? "tab on" : "tab"}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <t.icon size={16} aria-hidden="true" />} {t.label}
        </button>
      ))}
    </div>
  );
}
