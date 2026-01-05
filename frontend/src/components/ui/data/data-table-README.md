# DataTable Component

Componente de tabla genérico y reutilizable con filtrado, ordenamiento y paginación.

## Características

- ✅ **Búsqueda**: Búsqueda en múltiples campos
- ✅ **Filtros**: Filtros selectores personalizables
- ✅ **Ordenamiento**: Ordenamiento por columnas (ascendente/descendente)
- ✅ **Paginación**: Paginación con navegación completa
- ✅ **Responsive**: Diseño adaptativo para móviles y desktop
- ✅ **Loading states**: Estados de carga con skeleton
- ✅ **Empty states**: Estados vacíos informativos
- ✅ **TypeScript**: Tipado completo con genéricos

## Uso Básico

```tsx
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";

interface MyData {
  id: number;
  name: string;
  email: string;
  status: string;
}

const columns: ColumnDef<MyData>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    render: (item) => <Badge>{item.status}</Badge>,
  },
];

export function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["myData"],
    queryFn: fetchMyData,
  });

  return (
    <DataTable<MyData>
      data={data || []}
      columns={columns}
      searchKeys={["name", "email"]}
      getRowKey={(item) => item.id}
      isLoading={isLoading}
    />
  );
}
```

## Props

### DataTableProps<T>

| Prop                | Tipo                            | Requerido | Descripción                                                  |
| ------------------- | ------------------------------- | --------- | ------------------------------------------------------------ |
| `data`              | `T[]`                           | ✅        | Array de datos a mostrar                                     |
| `columns`           | `ColumnDef<T>[]`                | ✅        | Definición de columnas                                       |
| `getRowKey`         | `(item: T) => string \| number` | ✅        | Función para obtener ID único de cada fila                   |
| `searchKeys`        | `(keyof T)[]`                   | ❌        | Campos en los que buscar (default: `[]`)                     |
| `filterOptions`     | `FilterOption[]`                | ❌        | Opciones de filtrado (default: `[]`)                         |
| `pageSize`          | `number`                        | ❌        | Tamaño de página (default: `10`)                             |
| `emptyMessage`      | `string`                        | ❌        | Mensaje cuando no hay datos (default: `"No data available"`) |
| `searchPlaceholder` | `string`                        | ❌        | Placeholder del buscador (default: `"Search..."`)            |
| `isLoading`         | `boolean`                       | ❌        | Estado de carga (default: `false`)                           |
| `loadingRows`       | `number`                        | ❌        | Filas de skeleton al cargar (default: `5`)                   |

### ColumnDef<T>

| Propiedad         | Tipo                     | Requerido | Descripción                                   |
| ----------------- | ------------------------ | --------- | --------------------------------------------- |
| `key`             | `string`                 | ✅        | Clave del campo en el objeto de datos         |
| `label`           | `string`                 | ✅        | Etiqueta de la columna (header)               |
| `sortable`        | `boolean`                | ❌        | Si la columna es ordenable (default: `false`) |
| `render`          | `(item: T) => ReactNode` | ❌        | Función custom de renderizado                 |
| `className`       | `string`                 | ❌        | Clases CSS para las celdas                    |
| `headerClassName` | `string`                 | ❌        | Clases CSS para el header                     |

### FilterOption

| Propiedad | Tipo                                 | Requerido | Descripción               |
| --------- | ------------------------------------ | --------- | ------------------------- |
| `key`     | `string`                             | ✅        | Clave del campo a filtrar |
| `label`   | `string`                             | ✅        | Etiqueta del filtro       |
| `options` | `{ value: string; label: string }[]` | ✅        | Opciones del selector     |

## Ejemplos Avanzados

### Con Custom Renderers y Múltiples Filtros

```tsx
const columns: ColumnDef<Submission>[] = [
  {
    key: "createdAt",
    label: t("submissions.date"),
    sortable: true,
    render: (item) => format(new Date(item.createdAt), "PPpp"),
    className: "text-muted-foreground text-sm",
  },
  {
    key: "language",
    label: t("submissions.language"),
    sortable: true,
    render: (item) => (
      <span className="font-mono uppercase">{item.language}</span>
    ),
  },
  {
    key: "verdict",
    label: t("submissions.verdict"),
    render: (item) => <VerdictBadge verdict={item.verdict} />,
  },
  {
    key: "actions",
    label: t("common.actions"),
    render: (item) => (
      <Link to={`/submission/${item.id}`}>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
];

<DataTable<Submission>
  data={submissions}
  columns={columns}
  searchKeys={["exerciseTitle", "subjectName"]}
  filterOptions={[
    {
      key: "verdict",
      label: t("submissions.filter_verdict"),
      options: [
        { value: "accepted", label: t("verdicts.accepted") },
        { value: "wrong_answer", label: t("verdicts.wrong_answer") },
        { value: "compilation_error", label: t("verdicts.compilation_error") },
      ],
    },
    {
      key: "language",
      label: t("submissions.filter_language"),
      options: [
        { value: "python", label: "Python" },
        { value: "javascript", label: "JavaScript" },
        { value: "cpp", label: "C++" },
      ],
    },
  ]}
  getRowKey={(item) => item.id}
  searchPlaceholder={t("submissions.search")}
  emptyMessage={t("submissions.no_results")}
  isLoading={isLoading}
  pageSize={15}
/>;
```

### Con Alineación de Texto

```tsx
const columns: ColumnDef<ProgressItem>[] = [
  {
    key: "exerciseTitle",
    label: "Exercise",
    sortable: true,
    className: "font-medium",
  },
  {
    key: "score",
    label: "Score",
    sortable: true,
    render: (item) => `${item.score}%`,
    headerClassName: "text-right",
    className: "text-right font-mono",
  },
  {
    key: "attempts",
    label: "Attempts",
    sortable: true,
    headerClassName: "text-center",
    className: "text-center",
  },
];
```

## Internacionalización

El componente utiliza las siguientes claves de traducción:

```json
{
  "common": {
    "all": "Todos",
    "showing": "Mostrando",
    "of": "de",
    "results": "resultados",
    "page": "Página",
    "clear_filters": "Limpiar filtros"
  }
}
```

## Estilos y Temas

El componente utiliza las clases de Tailwind y las variables CSS de Radix UI, por lo que se adapta automáticamente al tema (claro/oscuro) de tu aplicación.

## Comportamiento

### Ordenamiento

- Click en header con icono de ordenamiento
- Primer click: orden ascendente (⬆️)
- Segundo click: orden descendente (⬇️)
- Tercer click: sin ordenamiento

### Búsqueda

- Búsqueda en tiempo real
- Case-insensitive
- Busca en todos los campos especificados en `searchKeys`

### Filtros

- Múltiples filtros independientes
- Valor "all" ignora el filtro
- Se resetea la paginación al filtrar

### Paginación

- Navegación: primera página, anterior, siguiente, última página
- Información: muestra rango actual y total
- Se resetea al buscar o filtrar

## Notas

- El componente es **client-side**, procesa todos los datos localmente
- Para datasets grandes (>1000 items), considera implementar paginación server-side
- Todas las operaciones (filtrado, búsqueda, ordenamiento) respetan el estado anterior
- El componente es completamente tipado con TypeScript genéricos
