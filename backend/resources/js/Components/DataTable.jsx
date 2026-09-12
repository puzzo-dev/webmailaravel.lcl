import { useState } from 'react';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi';
import Pagination from './Pagination';
import EmptyState from './EmptyState';

export default function DataTable({
    columns,
    data,
    pagination,
    onSort,
    rowKey = 'id',
    emptyTitle = 'No data found',
    emptyDescription = 'There are no items to display.',
    onRowClick,
}) {
    const [sortField, setSortField] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const handleSort = (column) => {
        if (!column.sortable) return;
        const field = column.sortKey || column.key;
        const newDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(newDir);
        if (onSort) onSort(field, newDir);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                        col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                                    } ${col.className || ''}`}
                                    onClick={() => handleSort(col)}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.label}
                                        {col.sortable && sortField === (col.sortKey || col.key) && (
                                            sortDir === 'asc' ? <HiArrowUp className="h-3 w-3" /> : <HiArrowDown className="h-3 w-3" />
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <EmptyState title={emptyTitle} description={emptyDescription} />
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={row[rowKey] || row.id}
                                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={`px-5 py-3 text-sm text-gray-700 ${col.className || ''}`}>
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {pagination?.links && (
                <div className="px-5 py-3 border-t border-gray-200">
                    <Pagination links={pagination.links} />
                </div>
            )}
        </div>
    );
}
