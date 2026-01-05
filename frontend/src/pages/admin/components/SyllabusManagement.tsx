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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { Badge } from "@/components/ui/data/badge";
import { Switch } from "@/components/ui/forms/switch";
import { toast } from "sonner";

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
        })
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

  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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
        })
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

  // Filtrado y paginación
  const filtered = useMemo(() => {
    let items = syllabi;
    if (selectedCourseFilter !== "all") {
      items = items.filter((s) => s.courseId === selectedCourseFilter);
    }

    const searchLower = search.toLowerCase();
    items = items.filter((syllabus) => {
      return (
        syllabus.title?.toLowerCase().includes(searchLower) ||
        syllabus.description?.toLowerCase().includes(searchLower)
      );
    });

    return items;
  }, [syllabi, selectedCourseFilter, search]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

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

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.syllabus.title")}</CardTitle>
          <CardDescription>{t("admin.syllabus.subtitle")}</CardDescription>
          <div className="flex justify-between items-center gap-4 mt-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.syllabus.search_topic")}
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
                <SelectItem value="5">5 {t("common.rows")}</SelectItem>
                <SelectItem value="10">10 {t("common.rows")}</SelectItem>
                <SelectItem value="20">20 {t("common.rows")}</SelectItem>
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
                    <TableHead>{t("admin.syllabus.course")}</TableHead>
                    <TableHead>{t("admin.syllabus.order")}</TableHead>
                    <TableHead>{t("admin.syllabus.title_column")}</TableHead>
                    <TableHead>{t("admin.syllabus.type")}</TableHead>
                    <TableHead>{t("admin.syllabus.visibility")}</TableHead>
                    <TableHead className="text-right">
                      {t("admin.syllabus.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground">
                        {t("admin.syllabus.no_topics")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((syllabus) => (
                      <TableRow key={syllabus.id}>
                        <TableCell className="text-sm font-medium text-muted-foreground">
                          {getCourseLabel(syllabus.courseId)}
                        </TableCell>
                        <TableCell>{syllabus.orderIndex}</TableCell>
                        <TableCell className="font-semibold">
                          {syllabus.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {syllabus.contentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              syllabus.isPublic ? "default" : "secondary"
                            }>
                            {syllabus.isPublic
                              ? t("admin.syllabus.public")
                              : t("admin.syllabus.hidden")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(syllabus)}>
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
                  {t("common.previous")}
                </Button>
                <div className="flex items-center text-sm text-muted-foreground">
                  {t("common.page")} {page} {t("common.of")} {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages || 1, p + 1))
                  }
                  disabled={page >= (totalPages || 1)}>
                  {t("common.next")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
