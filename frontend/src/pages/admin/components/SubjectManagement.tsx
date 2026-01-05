import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academicService } from "@/services/academic.service";
import { Subject } from "@/types/academic.types";
import { useForm } from "react-hook-form";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Button } from "@/components/ui/forms/button";
import { Plus, Loader2, Pencil, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay/dialog";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { toast } from "sonner";

const SubjectForm = ({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Subject;
  onSubmit: (data: Subject) => void;
  isPending: boolean;
}) => {
  const { register, handleSubmit, setValue } = useForm<Subject>({
    defaultValues,
  });

  const { data: degrees = [] } = useQuery({
    queryKey: ["degrees"],
    queryFn: academicService.getDegrees,
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          ...data,
          credits: Number(data.credits),
          semester: Number(data.semester),
        })
      )}
      className="space-y-4">
      <div className="space-y-2">
        <Label>Titulación</Label>
        <Select
          onValueChange={(val) => setValue("degreeId", val)}
          defaultValue={defaultValues?.degreeId}
          required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona..." />
          </SelectTrigger>
          <SelectContent>
            {degrees.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input
          {...register("name")}
          placeholder="Ej: Programación I"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <textarea
          {...register("description")}
          placeholder="Descripción de la asignatura..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input {...register("code")} placeholder="PR1" required />
        </div>
        <div className="space-y-2">
          <Label>Créditos ECTS</Label>
          <Input type="number" {...register("credits")} defaultValue={6} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Semestre (Plan)</Label>
        <Input type="number" {...register("semester")} placeholder="1-8" />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues ? "Guardar Cambios" : "Crear Asignatura"}
      </Button>
    </form>
  );
};

export default function SubjectManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  const { data: degrees = [] } = useQuery({
    queryKey: ["degrees"],
    queryFn: academicService.getDegrees,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Subject) =>
      editingItem
        ? academicService.updateSubject(editingItem.id, data)
        : academicService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success(
        `Asignatura ${editingItem ? "actualizada" : "creada"} correctamente`
      );
      closeDialog();
    },
    onError: () => toast.error("Error al guardar asignatura"),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Subject) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const getDegreeName = (id: string) =>
    degrees.find((d) => d.id === id)?.name || "Desconocida";

  // Filtrado y paginación
  const filtered = subjects.filter((subject) => {
    const searchLower = search.toLowerCase();
    return (
      subject.name?.toLowerCase().includes(searchLower) ||
      subject.code?.toLowerCase().includes(searchLower)
    );
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Asignatura
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Crear"} Asignatura
            </DialogTitle>
          </DialogHeader>
          <SubjectForm
            defaultValues={editingItem || undefined}
            onSubmit={(data) => saveMutation.mutate(data)}
            isPending={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Asignaturas</CardTitle>
          <CardDescription>Catálogo de asignaturas base.</CardDescription>
          <div className="flex justify-between items-center gap-4 mt-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar asignatura..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={limit.toString()}
              onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 filas</SelectItem>
                <SelectItem value="10">10 filas</SelectItem>
                <SelectItem value="20">20 filas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Titulación</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground">
                        No se encontraron asignaturas
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-mono">
                          {subject.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {subject.name}
                        </TableCell>
                        <TableCell>{getDegreeName(subject.degreeId)}</TableCell>
                        <TableCell>{subject.credits} ECTS</TableCell>
                        <TableCell>{subject.semester}º</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(subject)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}>
                  Anterior
                </Button>
                <div className="flex items-center text-sm text-muted-foreground">
                  Pág {page} de {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages || 1, p + 1))
                  }
                  disabled={page >= (totalPages || 1)}>
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
