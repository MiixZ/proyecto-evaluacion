/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";
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
  const { t } = useTranslation();

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
        <Label>{t("admin.degrees.degree_name")}</Label>
        <Input
          {...register("name")}
          placeholder={t("admin.degrees.degree_name_placeholder")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.degrees.description")}</Label>
        <textarea
          {...register("description")}
          placeholder={t("admin.degrees.description_placeholder")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.degrees.code")}</Label>
          <Input
            {...register("code")}
            placeholder={t("admin.degrees.code_placeholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.degrees.duration_years")}</Label>
          <Input
            type="number"
            {...register("durationYears")}
            defaultValue={4}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("admin.degrees.total_credits")}</Label>
        <Input type="number" {...register("totalCredits")} defaultValue={240} />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.degrees.status")}</Label>
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
            <SelectItem value="active">{t("admin.degrees.active")}</SelectItem>
            <SelectItem value="archived">
              {t("admin.degrees.archived")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues
          ? t("admin.degrees.save_changes")
          : t("admin.degrees.create_degree")}
      </Button>
    </form>
  );
};

export default function DegreeManagement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Degree | null>(null);

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
        t("admin.degrees.degree_saved", {
          action: editingItem
            ? t("admin.degrees.updated")
            : t("admin.degrees.created"),
        })
      );
      closeDialog();
    },
    onError: () => toast.error(t("admin.degrees.save_error")),
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

  // Definir columnas para DataTable
  const degreeColumns: ColumnDef<Degree>[] = [
    {
      key: "code",
      label: t("admin.degrees.code"),
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
      key: "durationYears",
      label: t("admin.degrees.duration_years"),
      sortable: true,
      render: (item) => `${item.durationYears} ${t("admin.degrees.years")}`,
    },
    {
      key: "totalCredits",
      label: t("admin.subjects.credits"),
      sortable: true,
      render: (item) => `${item.totalCredits} ECTS`,
    },
    {
      key: "status",
      label: t("admin.degrees.status"),
      sortable: true,
      render: (item) => (
        <Badge variant={item.status === "active" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: t("admin.degrees.actions"),
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
          <Plus className="mr-2 h-4 w-4" /> {t("admin.degrees.new_degree")}
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? t("admin.degrees.edit")
                : t("admin.degrees.create")}{" "}
              {t("admin.degrees.create_degree")}
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
          <CardTitle>{t("admin.degrees.title")}</CardTitle>
          <CardDescription>{t("admin.degrees.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<Degree>
            data={degrees}
            columns={degreeColumns}
            searchKeys={["name", "code"]}
            searchPlaceholder={t("admin.degrees.search_degree")}
            pageSize={10}
            emptyMessage={t("admin.degrees.no_degrees")}
            getRowKey={(item) => item.id}
            isLoading={isLoading}
            loadingRows={5}
          />
        </CardContent>
      </Card>
    </>
  );
}
