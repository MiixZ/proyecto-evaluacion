import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ColumnDef<T extends Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface SortState {
  column: string;
  direction: "ASC" | "DESC";
}

export interface ServerDataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T>[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSortChange?: (column: string, direction: "ASC" | "DESC") => void;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  getRowKey: (item: T) => string;
  isLoading?: boolean;
  loadingRows?: number;
  filterOptions?: FilterOption[];
  onFilterChange?: (filters: Record<string, string>) => void;
  sortState?: SortState;
}

export function ServerDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onSortChange,
  onSearchChange,
  searchValue,
  searchPlaceholder,
  emptyMessage,
  getRowKey,
  isLoading = false,
  loadingRows = 5,
  filterOptions = [],
  onFilterChange,
  sortState,
}: ServerDataTableProps<T>) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState("");
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleSort = (column: string) => {
    if (!onSortChange) return;

    const isSameColumn = sortState?.column === column;
    const newDirection: "ASC" | "DESC" =
      isSameColumn && sortState?.direction === "ASC" ? "DESC" : "ASC";

    onSortChange(column, newDirection);
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortState || sortState.column !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortState.direction === "ASC" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const LoadingSkeleton = () => (
    <>
      {Array.from({ length: loadingRows }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          {columns.map((col) => (
            <TableCell key={col.key}>
              <div className="h-4 bg-muted animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      {(onSearchChange || filterOptions.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || t("common.search")}
                className="pl-8"
                value={searchValue !== undefined ? searchValue : localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          )}

          {filterOptions.map((filter) => (
            <Select
              key={filter.key}
              value={localFilters[filter.key] || "all"}
              onValueChange={(value) => handleFilterChange(filter.key, value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.headerClassName}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{
                    cursor: column.sortable ? "pointer" : "default",
                  }}>
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && onSortChange && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground h-24">
                  {emptyMessage || t("common.no_data")}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={getRowKey(item)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {t("common.showing")}{" "}
          {data.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, totalItems)} {t("common.of")}{" "}
          {totalItems} {t("common.results")}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}>
            {t("common.previous")}
          </Button>

          <div className="flex items-center gap-1">
            {totalPages <= 7 ? (
              // Mostrar todas las páginas si son 7 o menos
              Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    disabled={isLoading}>
                    {page}
                  </Button>
                )
              )
            ) : (
              // Mostrar páginas con elipsis
              <>
                {currentPage > 3 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(1)}
                      disabled={isLoading}>
                      1
                    </Button>
                    {currentPage > 4 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                  </>
                )}

                {Array.from({ length: 5 }, (_, i) => {
                  const page = currentPage - 2 + i;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      disabled={isLoading}>
                      {page}
                    </Button>
                  );
                })}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(totalPages)}
                      disabled={isLoading}>
                      {totalPages}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || isLoading}>
            {t("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
