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
        <Label>{t("admin.courses.status")}</Label>
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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

  // Filtrado y paginación
  const filtered = useMemo(() => {
    let items = courses;
    if (selectedYearFilter !== "all") {
      items = items.filter((c) => c.academicYear === selectedYearFilter);
    }

    const searchLower = search.toLowerCase();
    items = items.filter((course) => {
      const subject = subjects.find((s) => s.id === course.subjectId);
      return (
        course.academicYear?.toLowerCase().includes(searchLower) ||
        subject?.name?.toLowerCase().includes(searchLower) ||
        subject?.code?.toLowerCase().includes(searchLower)
      );
    });

    return items;
  }, [courses, selectedYearFilter, search, subjects]);

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
          <div className="flex justify-between items-center gap-4 mt-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.courses.search_course")}
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
                    <TableHead>{t("admin.courses.year")}</TableHead>
                    <TableHead>{t("admin.courses.subject")}</TableHead>
                    <TableHead>{t("admin.courses.degree")}</TableHead>
                    <TableHead>{t("admin.courses.semester")}</TableHead>
                    <TableHead>{t("admin.courses.status")}</TableHead>
                    <TableHead className="text-right">
                      {t("admin.courses.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground">
                        {t("admin.courses.no_courses")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((course) => {
                      const subject = subjects.find(
                        (s) => s.id === course.subjectId
                      );
                      return (
                        <TableRow key={course.id}>
                          <TableCell className="font-mono">
                            {course.academicYear}
                          </TableCell>
                          <TableCell className="font-medium">
                            {subject
                              ? `${subject.name} (${subject.code})`
                              : t("admin.courses.unknown")}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {subject ? getDegreeName(subject.degreeId) : "-"}
                          </TableCell>
                          <TableCell>
                            {course.semester === 1 ? "1º" : "2º"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                course.status === "active"
                                  ? "default"
                                  : "outline"
                              }>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(course)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
