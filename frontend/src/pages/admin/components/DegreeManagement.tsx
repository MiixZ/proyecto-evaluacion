/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academicService } from "@/services/academic.service";
import { Degree } from "@/types/academic.types";
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
import { Badge } from "@/components/ui/data/badge";
import { toast } from "sonner";

const DegreeForm = ({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Degree;
  onSubmit: (data: Degree) => void;
  isPending: boolean;
}) => {
  const { register, handleSubmit } = useForm<Degree>({ defaultValues });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          ...data,
          durationYears: Number(data.durationYears),
          totalCredits: Number(data.totalCredits),
        })
      )}
      className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre de la Titulación</Label>
        <Input
          {...register("name")}
          placeholder="Ej: Ingeniería Informática"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <textarea
          {...register("description")}
          placeholder="Descripción de la titulación..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código Oficial</Label>
          <Input {...register("code")} placeholder="GII" required />
        </div>
        <div className="space-y-2">
          <Label>Años Duración</Label>
          <Input
            type="number"
            {...register("durationYears")}
            defaultValue={4}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Créditos Totales</Label>
        <Input type="number" {...register("totalCredits")} defaultValue={240} />
      </div>
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          defaultValue={defaultValues?.status || "active"}
          onValueChange={(v: any) =>
            register("status").onChange({
              target: { value: v, name: "status" },
            })
          }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activa</SelectItem>
            <SelectItem value="archived">Archivada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues ? "Guardar Cambios" : "Crear Titulación"}
      </Button>
    </form>
  );
};

export default function DegreeManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Degree | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: degrees = [], isLoading } = useQuery({
    queryKey: ["degrees"],
    queryFn: academicService.getDegrees,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Degree) =>
      editingItem
        ? academicService.updateDegree(editingItem.id, data)
        : academicService.createDegree(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["degrees"] });
      toast.success(
        `Titulación ${editingItem ? "actualizada" : "creada"} correctamente`
      );
      closeDialog();
    },
    onError: () => toast.error("Error al guardar titulación"),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Degree) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  // Filtrado y paginación
  const filtered = degrees.filter((degree) => {
    const searchLower = search.toLowerCase();
    return (
      degree.name?.toLowerCase().includes(searchLower) ||
      degree.code?.toLowerCase().includes(searchLower)
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
          <Plus className="mr-2 h-4 w-4" /> Nueva Titulación
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Crear"} Titulación
            </DialogTitle>
          </DialogHeader>
          <DegreeForm
            defaultValues={editingItem || undefined}
            onSubmit={(data) => saveMutation.mutate(data)}
            isPending={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Titulaciones Ofertadas</CardTitle>
          <CardDescription>Grados y másteres disponibles.</CardDescription>
          <div className="flex justify-between items-center gap-4 mt-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar titulación..."
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
                    <TableHead>Duración</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground">
                        No se encontraron titulaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((degree) => (
                      <TableRow key={degree.id}>
                        <TableCell className="font-mono">
                          {degree.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {degree.name}
                        </TableCell>
                        <TableCell>{degree.durationYears} años</TableCell>
                        <TableCell>{degree.totalCredits} ECTS</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              degree.status === "active"
                                ? "default"
                                : "secondary"
                            }>
                            {degree.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(degree)}>
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
