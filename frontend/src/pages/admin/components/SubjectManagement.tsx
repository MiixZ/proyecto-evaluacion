import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";
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
  const { t } = useTranslation();

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
        <Label>{t("admin.subjects.degree")}</Label>
        <Select
          onValueChange={(val) => setValue("degreeId", val)}
          defaultValue={defaultValues?.degreeId}
          required>
          <SelectTrigger>
            <SelectValue placeholder={t("admin.subjects.select_degree")} />
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
        <Label>{t("admin.subjects.name")}</Label>
        <Input
          {...register("name")}
          placeholder={t("admin.subjects.name_placeholder")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.subjects.description")}</Label>
        <textarea
          {...register("description")}
          placeholder={t("admin.subjects.description_placeholder")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.subjects.code")}</Label>
          <Input
            {...register("code")}
            placeholder={t("admin.subjects.code_placeholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.subjects.credits")}</Label>
          <Input type="number" {...register("credits")} defaultValue={6} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("admin.subjects.semester")}</Label>
        <Input
          type="number"
          {...register("semester")}
          placeholder={t("admin.subjects.semester_placeholder")}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues
          ? t("admin.subjects.save_changes")
          : t("admin.subjects.create_subject")}
      </Button>
    </form>
  );
};

export default function SubjectManagement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);

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
        t("admin.subjects.subject_saved", {
          action: editingItem
            ? t("admin.subjects.updated")
            : t("admin.subjects.created"),
        })
      );
      closeDialog();
    },
    onError: () => toast.error(t("admin.subjects.save_error")),
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
    degrees.find((d) => d.id === id)?.name ||
    t("admin.subjects.unknown_degree");

  // Definir columnas para DataTable
  const subjectColumns: ColumnDef<Subject>[] = [
    {
      key: "code",
      label: t("admin.subjects.code"),
      sortable: true,
      className: "font-mono",
    },
    {
      key: "name",
      label: t("admin.subjects.name"),
      sortable: true,
      className: "font-medium",
    },
    {
      key: "degreeId",
      label: t("admin.subjects.degree"),
      sortable: true,
      render: (item) => getDegreeName(item.degreeId),
    },
    {
      key: "credits",
      label: t("admin.subjects.credits"),
      sortable: true,
      render: (item) => `${item.credits} ECTS`,
    },
    {
      key: "semester",
      label: t("admin.subjects.semester"),
      sortable: true,
      render: (item) => `${item.semester}º`,
    },
    {
      key: "actions",
      label: t("admin.subjects.actions"),
      headerClassName: "text-right",
      className: "text-right",
      render: (item) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openEditDialog(item)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> {t("admin.subjects.new_subject")}
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? t("admin.subjects.edit")
                : t("admin.subjects.create")}{" "}
              {t("admin.subjects.title")}
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
          <CardTitle>{t("admin.subjects.title")}</CardTitle>
          <CardDescription>{t("admin.subjects.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<Subject>
            data={subjects}
            columns={subjectColumns}
            searchKeys={["name", "code"]}
            searchPlaceholder={t("admin.subjects.search_subject")}
            pageSize={10}
            emptyMessage={t("admin.subjects.no_subjects")}
            getRowKey={(item) => item.id}
            isLoading={isLoading}
            loadingRows={5}
          />
        </CardContent>
      </Card>
    </>
  );
}
