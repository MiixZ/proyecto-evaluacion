/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { academicService } from "@/services/academic.service";
import { Syllabus } from "@/types/academic.types";
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
import {
  Plus,
  Loader2,
  Pencil,
  Search,
  Filter,
  Code,
  FileCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Badge } from "@/components/ui/data/badge";
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";
import { Switch } from "@/components/ui/forms/switch";
import { toast } from "sonner";
import { CommonFilesManager } from "@/components/professor/CommonFilesManager";

const SyllabusForm = ({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Syllabus;
  onSubmit: (data: Syllabus) => void;
  isPending: boolean;
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<Syllabus>({
    defaultValues: {
      ...defaultValues,
      isPublic: defaultValues?.isPublic ?? true,
    },
  });
  const isPublic = watch("isPublic");
  const { t } = useTranslation();

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: academicService.getCourses,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          ...data,
          orderIndex: Number(data.orderIndex),
        }),
      )}
      className="space-y-4">
      <div className="space-y-2">
        <Label>{t("admin.syllabus.academic_year")}</Label>
        <Select
          onValueChange={(val) => setValue("courseId", val)}
          defaultValue={defaultValues?.courseId}
          required>
          <SelectTrigger>
            <SelectValue placeholder={t("admin.syllabus.select_course")} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => {
              const subj = subjects.find((s) => s.id === c.subjectId);
              return (
                <SelectItem key={c.id} value={c.id}>
                  {subj?.name} - {c.academicYear}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("admin.syllabus.topic_title")}</Label>
        <Input
          {...register("title")}
          placeholder={t("admin.syllabus.topic_title_placeholder")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.syllabus.description")}</Label>
        <Input
          {...register("description")}
          placeholder={t("admin.syllabus.description_placeholder")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.syllabus.content_type")}</Label>
          <Select
            onValueChange={(val: any) => setValue("contentType", val)}
            defaultValue={defaultValues?.contentType || "module"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="module">
                {t("admin.syllabus.module")}
              </SelectItem>
              <SelectItem value="topic">{t("admin.syllabus.topic")}</SelectItem>
              <SelectItem value="lesson">
                {t("admin.syllabus.lesson")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("admin.syllabus.order")}</Label>
          <Input type="number" {...register("orderIndex")} defaultValue={1} />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={isPublic}
          onCheckedChange={(checked) => setValue("isPublic", checked)}
        />
        <Label>{t("admin.syllabus.visible_students")}</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues
          ? t("admin.syllabus.save_changes")
          : t("admin.syllabus.create_topic")}
      </Button>
    </form>
  );
};

export default function SyllabusManagement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Syllabus | null>(null);
  const [managingFilesSyllabusId, setManagingFilesSyllabusId] = useState<
    string | null
  >(null);

  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>("all");

  const { data: syllabi = [], isLoading } = useQuery({
    queryKey: ["syllabi"],
    queryFn: () => academicService.getSyllabi(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: academicService.getCourses,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Syllabus) =>
      editingItem
        ? academicService.updateSyllabus(editingItem.id, data)
        : academicService.createSyllabus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabi"] });
      toast.success(
        t("admin.syllabus.topic_saved", {
          action: editingItem
            ? t("admin.syllabus.updated")
            : t("admin.syllabus.created"),
        }),
      );
      closeDialog();
    },
    onError: () => toast.error(t("admin.syllabus.save_error")),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Syllabus) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const getCourseLabel = (id: string) => {
    const course = courses.find((c) => c.id === id);
    if (!course) return t("admin.syllabus.unknown_course");
    const subject = subjects.find((s) => s.id === course.subjectId);
    return `${subject?.name} (${course.academicYear})`;
  };

  // Filtrar por curso seleccionado
  const filteredSyllabi = useMemo(() => {
    if (selectedCourseFilter === "all") return syllabi;
    return syllabi.filter((s) => s.courseId === selectedCourseFilter);
  }, [syllabi, selectedCourseFilter]);

  // Definir columnas para DataTable
  const syllabusColumns: ColumnDef<Syllabus>[] = [
    {
      key: "courseId",
      label: t("admin.syllabus.course"),
      sortable: true,
      render: (item) => (
        <span className="text-sm font-medium text-muted-foreground">
          {getCourseLabel(item.courseId)}
        </span>
      ),
    },
    {
      key: "orderIndex",
      label: t("admin.syllabus.order"),
      sortable: true,
    },
    {
      key: "title",
      label: t("admin.syllabus.title_column"),
      sortable: true,
      className: "font-semibold",
    },
    {
      key: "contentType",
      label: t("admin.syllabus.type"),
      sortable: true,
      render: (item) => <Badge variant="outline">{item.contentType}</Badge>,
    },
    {
      key: "isPublic",
      label: t("admin.syllabus.visibility"),
      sortable: true,
      render: (item) => (
        <Badge variant={item.isPublic ? "default" : "secondary"}>
          {item.isPublic
            ? t("admin.syllabus.public")
            : t("admin.syllabus.hidden")}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: t("admin.syllabus.actions"),
      headerClassName: "text-right",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setManagingFilesSyllabusId(item.id)}
            title={t(
              "admin.syllabus.manage_files",
              "Gestionar Archivos Comunes",
            )}>
            <FileCode className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("admin.syllabus.filter_by_course")}:
          </span>
          <Select
            value={selectedCourseFilter}
            onValueChange={setSelectedCourseFilter}>
            <SelectTrigger className="w-[280px]">
              <SelectValue
                placeholder={t("admin.syllabus.select_course_filter")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("admin.syllabus.all_courses")}
              </SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {getCourseLabel(c.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> {t("admin.syllabus.new_topic")}
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? t("admin.syllabus.edit")
                : t("admin.syllabus.create")}{" "}
              {t("admin.syllabus.topic")}
            </DialogTitle>
          </DialogHeader>
          <SyllabusForm
            defaultValues={editingItem || undefined}
            onSubmit={(data) => saveMutation.mutate(data)}
            isPending={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!managingFilesSyllabusId}
        onOpenChange={(open) => !open && setManagingFilesSyllabusId(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t("admin.syllabus.files_title", "Archivos Comunes del Temario")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "admin.syllabus.files_desc",
                "Archivos compartidos por todos los ejercicios de este temario",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto py-2">
            {managingFilesSyllabusId && (
              <CommonFilesManager
                syllabusId={managingFilesSyllabusId}
                disabled={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.syllabus.title")}</CardTitle>
          <CardDescription>{t("admin.syllabus.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<Syllabus>
            data={filteredSyllabi}
            columns={syllabusColumns}
            searchKeys={["title", "description"]}
            searchPlaceholder={t("admin.syllabus.search_topic")}
            pageSize={10}
            emptyMessage={t("admin.syllabus.no_topics")}
            getRowKey={(item) => item.id}
            isLoading={isLoading}
            loadingRows={5}
          />
        </CardContent>
      </Card>
    </>
  );
}
