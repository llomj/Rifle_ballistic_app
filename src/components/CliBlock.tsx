import React from 'react';

/** CLI-style color roles (syntax highlighting). Accent roles (yellow, amber, blue, sky) use theme. */
const roleClass = {
  yellow: 'text-theme-accent',
  cyan: 'text-cyan-400',
  white: 'text-slate-300',
  green: 'text-emerald-400',
  red: 'text-red-400',
  blue: 'text-theme-accent',
  amber: 'text-theme-accent-90',
  sky: 'text-theme-accent',
} as const;

type Role = keyof typeof roleClass;

const xs = 'text-xs';

export function CliLine({
  children,
  role = 'white',
  wrap = false,
}: {
  children: React.ReactNode;
  role?: Role;
  /** When true, text wraps to multiple lines instead of staying on one. */
  wrap?: boolean;
}) {
  return (
    <p
      className={`font-mono ${xs} ${wrap ? 'whitespace-normal break-words' : 'whitespace-pre'} ${roleClass[role]}`}
    >
      {children}
    </p>
  );
}

/** Separator line. */
export function CliSep() {
  return <div className="border-t border-white/10 my-2" />;
}

/** Pre block: smaller text, tabular. */
export function CliPre({ lines }: { lines: string[] }) {
  return (
    <pre className={`font-mono ${xs} text-slate-300 tabular-nums overflow-x-auto rounded border border-white/10 bg-black/20 px-2 py-1.5`}>
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre">{line}</div>
      ))}
    </pre>
  );
}

/** Neat column table: fixed layout, even alignment, horizontal scroll. */
export function CliTable({
  columnRoles,
  rows,
  header,
  headerRoles,
  colWidths = [],
}: {
  columnRoles: Role[];
  rows: React.ReactNode[][];
  header?: React.ReactNode[];
  headerRoles?: Role[];
  colWidths?: string[];
}) {
  const hasWidths = colWidths.length > 0;
  return (
    <div className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded border border-white/10 bg-black/20 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded">
      <table
        className={`font-mono ${xs} border-collapse ${hasWidths ? '' : 'w-full'}`}
        style={hasWidths ? { tableLayout: 'fixed', minWidth: 'max-content' } : undefined}
      >
        {hasWidths && (
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: w, minWidth: w }} />
            ))}
          </colgroup>
        )}
        {header && (
          <thead>
            <tr className="border-b border-white/10">
              {header.map((cell, c) => (
                <th
                  key={c}
                  className={`text-left py-1 px-2 tabular-nums ${roleClass[headerRoles?.[c] ?? columnRoles[c] ?? 'white']}`}
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-white/5 last:border-0">
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={`py-0.5 px-2 tabular-nums whitespace-nowrap ${roleClass[columnRoles[c] ?? 'white']}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default { CliLine, CliPre, CliSep, CliTable };
