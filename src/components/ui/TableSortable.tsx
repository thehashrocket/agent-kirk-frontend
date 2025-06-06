import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | string;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableSortableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  initialSort?: { accessor: keyof T | string; direction: 'asc' | 'desc' };
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function TableSortable<T>({ columns, data, initialSort, rowKey, onRowClick, rowClassName }: TableSortableProps<T>) {
  const [sort, setSort] = useState<{
    accessor: keyof T | string;
    direction: 'asc' | 'desc';
  }>(
    initialSort || {
      accessor: columns.find(col => col.sortable)?.accessor || columns[0].accessor,
      direction: 'desc',
    }
  );

  const handleSort = (accessor: keyof T | string) => {
    setSort(prev =>
      prev.accessor === accessor
        ? { accessor, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { accessor, direction: 'desc' }
    );
  };

  const sortedData = React.useMemo(() => {
    const col = columns.find(c => c.accessor === sort.accessor);
    if (!col || !col.sortable) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[col.accessor];
      const bVal = (b as any)[col.accessor];
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [data, sort, columns]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead
                key={col.accessor as string}
                className={
                  col.align === 'right'
                    ? 'text-right cursor-pointer select-none'
                    : col.align === 'center'
                    ? 'text-center cursor-pointer select-none'
                    : 'text-left cursor-pointer select-none'
                }
                onClick={col.sortable ? () => handleSort(col.accessor) : undefined}
                aria-sort={
                  col.sortable && sort.accessor === col.accessor
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                tabIndex={col.sortable ? 0 : -1}
                role={col.sortable ? 'button' : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sort.accessor === col.accessor && (
                    sort.direction === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    )
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map(row => {
            const clickable = !!onRowClick;
            const rowClasses = [
              rowClassName ? rowClassName(row) : '',
              clickable ? 'cursor-pointer hover:bg-gray-50 focus:bg-gray-100 outline-none transition-colors' : '',
            ].join(' ');
            return (
              <TableRow
                key={rowKey(row)}
                className={rowClasses}
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? 'button' : undefined}
                aria-label={clickable ? 'View details' : undefined}
                onClick={clickable ? () => onRowClick!(row) : undefined}
                onKeyDown={clickable ? (e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick!(row);
                  }
                }) : undefined}
              >
                {columns.map(col => (
                  <TableCell
                    key={col.accessor as string}
                    className={
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }
                  >
                    {col.render
                      ? col.render((row as any)[col.accessor], row)
                      : (row as any)[col.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 