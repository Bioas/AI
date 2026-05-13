export default function Table({ columns, data, onRowClick, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-zinc-100 ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            {columns.map(col => (
              <th
                key={col.key}
                className={`text-left px-4 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider ${col.className || ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-zinc-50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-zinc-50/80' : 'hover:bg-zinc-50/50'}`}
            >
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3.5 text-sm text-zinc-700 ${col.cellClass || ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
