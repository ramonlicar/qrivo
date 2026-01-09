
import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    width?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    className?: string;
}

export function Table<T>({ columns, data, className = '' }: TableProps<T>) {
    return (
        <div className={`w-full overflow-hidden border border-neutral-200 rounded-xl bg-white shadow-sm ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-neutral-25/50 border-b border-neutral-100">
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className="px-6 py-4 text-[11px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap"
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 font-medium">
                        {data.map((item, i) => (
                            <tr key={i} className="group hover:bg-neutral-25/30 transition-colors">
                                {columns.map((col, j) => (
                                    <td key={j} className="px-6 py-4 text-[13px] text-neutral-700 tracking-tight">
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
