/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { academicService } from "@/services/academic.service";
import { groupService } from "@/services/group.service";
import { GroupDetails } from "@/services/group.service";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/layout/card";
import { Button } from "@/components/ui/forms/button";
import { Plus, Loader2, Pencil } from "lucide-react";
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
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const GroupForm = ({ defaultValues, onSubmit, isPending }: any) => {
  const { register, handleSubmit } = useForm({ defaultValues });
  const { t } = useTranslation();

  const handle = handleSubmit((data) => {
    if (data.capacity !== undefined && data.capacity !== null) {
      const num = Number(data.capacity);
      if (Number.isNaN(num)) {
        delete data.capacity;
      } else {
        data.capacity = num;
      }
    }

    onSubmit(data);
  });

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("admin.groups.name", "Nombre del Grupo")}</Label>
        <Input
          {...register("name")}
          placeholder={t("admin.groups.name_placeholder", "Ej: Grupo A")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{t("admin.groups.description", "Descripción")}</Label>
        <Input
          {...register("description")}
          placeholder={t(
            "admin.groups.description_placeholder",
            "Descripción del grupo"
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("admin.groups.capacity", "Capacidad")}</Label>
        <Input type="number" {...register("capacity")} />
      </div>

      <div className="space-y-2">
        <Label>{t("admin.groups.status", "Estado")}</Label>
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
            <SelectItem value="active">
              {t("admin.groups.active", "Activo")}
            </SelectItem>
            <SelectItem value="archived">
              {t("admin.groups.archived", "Archivado")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues
          ? t("admin.groups.save_changes")
          : t("admin.groups.create_group")}
      </Button>
    </form>
  );
};

export default function GroupsManagement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupDetails | null>(null);

  const { data: courses = [] } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: academicService.getCourses,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["adminSubjects"],
    queryFn: () => academicService.getSubjects(),
  });

  const subjectMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subjects || []) m.set(s.id, s.name || s.id);
    return m;
  }, [subjects]);

  const { data: groups = [], refetch } = useQuery({
    queryKey: ["groups", selectedCourse],
    queryFn: () =>
      selectedCourse ? groupService.listByCourse(selectedCourse) : [],
    enabled: !!selectedCourse,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? groupService.updateGroup(editingItem.id, data)
        : groupService.createGroup({ ...data, courseId: selectedCourse }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", selectedCourse] });
      toast.success(
        t("admin.groups.group_saved", {
          action: editingItem
            ? t("admin.groups.updated")
            : t("admin.groups.created"),
        })
      );
      closeDialog();
    },
    onError: () => toast.error(t("admin.groups.save_error")),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: GroupDetails) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<GroupDetails>[] = [
    {
      key: "name",
      label: t("admin.groups.name"),
      sortable: true,
      className: "font-medium",
    },
    {
      key: "description",
      label: t("admin.groups.description"),
      sortable: false,
    },
    { key: "capacity", label: t("admin.groups.capacity"), sortable: true },
    { key: "status", label: t("admin.groups.status"), render: (g) => g.status },
    {
      key: "actions",
      label: t("admin.groups.actions"),
      headerClassName: "text-right",
      className: "text-right",
      render: (g) => (
        <Button variant="ghost" size="icon" onClick={() => openEditDialog(g)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between mb-4">
        <div className="w-1/3">
          <Label>{t("admin.groups.select_course", "Selecciona Curso")}</Label>
          <Select
            value={selectedCourse || ""}
            onValueChange={(v: string) => setSelectedCourse(v || null)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {`${
                    subjectMap.get(c.subjectId) ??
                    c.subject?.name ??
                    c.subject_name ??
                    c.subjectId
                  } - ${c.academicYear ?? c.academic_year ?? ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={openCreateDialog} disabled={!selectedCourse}>
            <Plus className="mr-2 h-4 w-4" /> {t("admin.groups.create_group")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.groups.title")}</CardTitle>
          <CardDescription>{t("admin.groups.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<GroupDetails>
            data={groups}
            columns={columns}
            pageSize={10}
            emptyMessage={t("admin.groups.no_groups")}
            getRowKey={(g) => g.id}
          />
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? t("admin.groups.edit_group")
                : t("admin.groups.create_group")}
            </DialogTitle>
          </DialogHeader>

          <GroupForm
            defaultValues={editingItem ?? undefined}
            onSubmit={(data: any) => saveMutation.mutate(data)}
            isPending={saveMutation.status === "pending"}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
