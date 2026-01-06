/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { academicService } from "@/services/academic.service";
import { Course } from "@/types/academic.types";
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
import { Plus, Loader2, Pencil, Search, Filter } from "lucide-react";
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

const CourseForm = ({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Course;
  onSubmit: (data: Course) => void;
  isPending: boolean;
}) => {
  const { register, handleSubmit, setValue } = useForm<Course>({
    defaultValues,
  });
  const { t } = useTranslation();

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          ...data,
          semester: Number(data.semester),
        })
      )}
      className="space-y-4">
      <div className="space-y-2">
        <Label>{t("admin.courses.subject")}</Label>
        <Select
          onValueChange={(val) => setValue("subjectId", val)}
          defaultValue={defaultValues?.subjectId}
          required>
          <SelectTrigger>
            <SelectValue placeholder={t("admin.courses.select_subject")} />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.courses.academic_year")}</Label>
          <Input
            {...register("academicYear")}
            placeholder={t("admin.courses.academic_year_placeholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.courses.semester")}</Label>
          <Select
            onValueChange={(val) => setValue("semester", Number(val))}
            defaultValue={defaultValues?.semester?.toString() || "1"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                {t("admin.courses.first_semester")}
              </SelectItem>
              <SelectItem value="2">
                {t("admin.courses.second_semester")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("admin.courses.status.name")}</Label>
        <Select
          onValueChange={(val: any) => setValue("status", val)}
          defaultValue={defaultValues?.status || "planning"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">
              {t("admin.courses.planning")}
            </SelectItem>
            <SelectItem value="active">{t("admin.courses.active")}</SelectItem>
            <SelectItem value="closed">{t("admin.courses.closed")}</SelectItem>
            <SelectItem value="archived">
              {t("admin.courses.archived")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues
          ? t("admin.courses.save_changes")
          : t("admin.courses.create_course")}
      </Button>
    </form>
  );
};

export default function CourseManagement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Course | null>(null);

  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: academicService.getCourses,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  const { data: degrees = [] } = useQuery({
    queryKey: ["degrees"],
    queryFn: academicService.getDegrees,
  });

  const uniqueYears = useMemo(() => {
    const years = Array.from(new Set(courses.map((c) => c.academicYear)));
    return years.sort().reverse();
  }, [courses]);

  const saveMutation = useMutation({
    mutationFn: (data: Course) =>
      editingItem
        ? academicService.updateCourse(editingItem.id, data)
        : academicService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(
        t("admin.courses.course_saved", {
          action: editingItem
            ? t("admin.courses.updated")
            : t("admin.courses.created"),
        })
      );
      closeDialog();
    },
    onError: () => toast.error(t("admin.courses.save_error")),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Course) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const getDegreeName = (id: string) =>
    degrees.find((d) => d.id === id)?.name || t("admin.courses.unknown");

  // Filtrado externo por año académico
  const filteredCourses = useMemo(() => {
    if (selectedYearFilter === "all") return courses;
    return courses.filter((c) => c.academicYear === selectedYearFilter);
  }, [courses, selectedYearFilter]);

  // Definir columnas para DataTable
  const courseColumns: ColumnDef<Course>[] = [
    {
      key: "academicYear",
      label: t("admin.courses.year"),
      sortable: true,
      className: "font-mono",
    },
    {
      key: "subjectId",
      label: t("admin.courses.subject"),
      sortable: true,
      className: "font-medium",
      render: (item) => {
        const subject = subjects.find((s) => s.id === item.subjectId);
        return subject
          ? `${subject.name} (${subject.code})`
          : t("admin.courses.unknown");
      },
    },
    {
      key: "degree",
      label: t("admin.courses.degree"),
      render: (item) => {
        const subject = subjects.find((s) => s.id === item.subjectId);
        return subject ? getDegreeName(subject.degreeId) : "-";
      },
      className: "text-muted-foreground text-sm",
    },
    {
      key: "semester",
      label: t("admin.courses.semester"),
      sortable: true,
      render: (item) => (item.semester === 1 ? "1º" : "2º"),
    },
    {
      key: "status",
      label: t("admin.courses.status.name"),
      sortable: true,
      render: (item) => (
        <Badge variant={item.status === "active" ? "default" : "outline"}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: t("admin.courses.actions"),
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("admin.courses.year")}:
          </span>
          <Select
            value={selectedYearFilter}
            onValueChange={setSelectedYearFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("admin.courses.all_years")}
              </SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> {t("admin.courses.new_course")}
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? t("admin.courses.edit")
                : t("admin.courses.create")}{" "}
              {t("admin.courses.create_course")}
            </DialogTitle>
          </DialogHeader>
          <CourseForm
            defaultValues={editingItem || undefined}
            onSubmit={(data) => saveMutation.mutate(data)}
            isPending={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.courses.title")}</CardTitle>
          <CardDescription>{t("admin.courses.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<Course>
            data={filteredCourses}
            columns={courseColumns}
            searchKeys={["academicYear"]}
            searchPlaceholder={t("admin.courses.search_course")}
            pageSize={10}
            emptyMessage={t("admin.courses.no_courses")}
            getRowKey={(item) => item.id}
            isLoading={isLoading}
            loadingRows={5}
          />
        </CardContent>
      </Card>
    </>
  );
}
