import React, { useMemo, useState, useRef, useEffect } from 'react';

export interface SearchComboboxProps<T> {
  items: T[];
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  value: string | null;
  onSelect: (item: T | null) => void;
  /** When value is set but item may not be in current items (e.g. filtered list), use this to show label. */
  getLabelForId?: (id: string) => string;
  placeholder?: string;
  disabled?: boolean;
  search: (query: string, limit?: number) => T[];
  limit?: number;
  className?: string;
  inputClassName?: string;
}

export function SearchCombobox<T>({
  items,
  getItemId,
  getItemLabel,
  value,
  onSelect,
  getLabelForId,
  placeholder = 'Search…',
  disabled = false,
  search,
  limit = 20,
  className = '',
  inputClassName = '',
}: SearchComboboxProps<T>): React.ReactElement {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Some catalogs are large; avoid running full search/filter work when the dropdown is closed.
  const filteredRaw = useMemo(() => {
    if (!open && query.length === 0) return [];
    return search(query, limit);
  }, [open, query, limit, search]);
  // Ensure current value appears in list (e.g. default rifle) even if not in search results
  const currentItem = value ? items.find((i) => getItemId(i) === value) : null;
  const filtered =
    currentItem && !filteredRaw.some((i) => getItemId(i) === value)
      ? [currentItem, ...filteredRaw].slice(0, limit)
      : filteredRaw;
  const displayLabel =
    value &&
    (getLabelForId
      ? getLabelForId(value)
      : (() => {
          const item = items.find((i) => getItemId(i) === value);
          return item ? getItemLabel(item) : value;
        })());
  const showList = open && (query.length > 0 || filtered.length > 0);

  useEffect(() => {
    if (!showList) setFocusedIndex(0);
  }, [showList, query]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || focusedIndex < 0) return;
    const child = el.children[focusedIndex] as HTMLElement | undefined;
    child?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, filtered]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) {
      if (e.key === 'ArrowDown' || e.key === 'Backspace') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => (i < filtered.length - 1 ? i + 1 : i));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => (i > 0 ? i - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[focusedIndex];
      if (item) {
        onSelect(item);
        setQuery('');
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className={`relative ${className}`}>
      <input
        type="text"
        value={open ? query : (displayLabel || '')}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onSelect(null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded bg-black/40 border border-white/20 px-3 py-2 text-theme-accent font-mono text-xs placeholder-slate-500 ${inputClassName}`}
      />
      {showList && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-[50vh] min-h-[8rem] w-full overflow-y-auto overscroll-contain rounded border border-white/20 bg-slate-900 py-1 shadow-lg touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-slate-500 text-xs">No results</li>
          ) : (
            filtered.map((item, i) => (
              <li
                key={getItemId(item)}
                role="option"
                aria-selected={i === focusedIndex}
                className={`cursor-pointer px-3 py-2 text-xs ${
                  i === focusedIndex ? 'bg-theme-accent-20 text-theme-accent' : 'text-slate-300 hover:bg-white/5'
                }`}
                onMouseEnter={() => setFocusedIndex(i)}
                onClick={() => {
                  onSelect(item);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {getItemLabel(item)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
