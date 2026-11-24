import { SHELF_SORTS, type ShelfSort } from "@/lib/catalog";

export function SortRow({ value, onChange }: { value: ShelfSort; onChange: (next: ShelfSort) => void }) {
  return (
    <label className="flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
      <span className="shrink-0 text-sm text-muted">Sort</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ShelfSort)} className="h-full min-w-0 flex-1 truncate bg-transparent text-base outline-none">
        {SHELF_SORTS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
