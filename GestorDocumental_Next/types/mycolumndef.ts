import { ColumnDef as TanstackColumnDef, RowData } from '@tanstack/react-table';

export type MyColumnDef<TData extends RowData, TValue = unknown> = TanstackColumnDef<TData, TValue> & {
  name_exporter?: string;
  value_exporter?: string;
  filterConfig?: any;
};
