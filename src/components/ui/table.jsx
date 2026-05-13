export default function Table({ columns, data, onRowClick, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-neutral-100 ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-50/80">
            {columns.map(col => (
              <th key={col.key} className={`text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider ${col.className || ''}`}
                style={col.width ? { width: col.width } : undefined}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)}
              className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-lime-50/30' : 'hover:bg-neutral-50/40'}`}>
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3.5 text-sm text-neutral-700 ${col.cellClass || ''}`}>
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
