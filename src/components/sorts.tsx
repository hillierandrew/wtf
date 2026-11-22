import { SHELF_SORTS, type ShelfSort } from "@/lib/catalog";

export function SortRow({ value, onChange }: { value: ShelfSort; onChange: (next: ShelfSort) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {SHELF_SORTS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`h-10 shrink-0 rounded-lg border px-3 text-sm ${value === item.id ? "border-accent bg-subtle text-fg" : "border-line bg-elevated text-muted"}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
