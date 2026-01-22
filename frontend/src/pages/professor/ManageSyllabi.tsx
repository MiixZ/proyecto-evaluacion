/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  FileCode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Button } from "@/components/ui/forms/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Badge } from "@/components/ui/data/badge";
import { Switch } from "@/components/ui/forms/switch";
import { Label } from "@/components/ui/forms/label";
import { Input } from "@/components/ui/forms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/overlay/alert-dialog";
import { dashboardService } from "@/services/dashboard.service";
import { syllabusService, SyllabusDTO } from "@/services/syllabus.service";
import { toast } from "sonner";
import { CommonFilesManager } from "@/components/professor/CommonFilesManager";

export default function ManageSyllabi() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initialGroupId = localStorage.getItem("professorLastGroupId");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || "",
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>("");
  const [managingFilesSyllabusId, setManagingFilesSyllabusId] = useState<
    string | null
  >(null);

  // Create form state
  const [newSyllabus, setNewSyllabus] = useState({
    title: "",
    description: "",
    contentType: "module",
  });

  const { data: dashboardData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["professorStats"],
    queryFn: () => dashboardService.getProfessorStats(),
  });

  const groups = useMemo(
    () => dashboardData?.groups || [],
    [dashboardData?.groups],
  );

  const selectedGroup = groups.find((g) => g.groupId === selectedGroupId);

  const {
    data: syllabi = [],
    isLoading: isLoadingSyllabi,
    refetch,
  } = useQuery({
    queryKey: ["syllabi", selectedGroup?.courseId],
    queryFn: () => syllabusService.getByCourse(selectedGroup!.courseId),
    enabled: !!selectedGroup?.courseId,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: (syllabusId: string) =>
      syllabusService.toggleVisibility(syllabusId),
    onSuccess: (data) => {
      toast.success(
        data.isPublic
          ? t("professor.syllabi.visibility_public")
          : t("professor.syllabi.visibility_hidden"),
      );
      queryClient.invalidateQueries({
        queryKey: ["syllabi", selectedGroup?.courseId],
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || t("professor.syllabi.error_toggle"),
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => syllabusService.create(data),
    onSuccess: () => {
      toast.success(t("professor.syllabi.create_success"));
      setCreateDialogOpen(false);
      setNewSyllabus({ title: "", description: "", contentType: "module" });
      queryClient.invalidateQueries({
        queryKey: ["syllabi", selectedGroup?.courseId],
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || t("professor.syllabi.create_error"),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (syllabusId: string) => syllabusService.delete(syllabusId),
    onSuccess: () => {
      toast.success(t("professor.syllabi.delete_success"));
      setDeleteDialogOpen(false);
      setSelectedSyllabusId("");
      queryClient.invalidateQueries({
        queryKey: ["syllabi", selectedGroup?.courseId],
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || t("professor.syllabi.delete_error"),
      );
    },
  });

  const [reordering, setReordering] = useState(false);

  const handleToggleVisibility = (syllabusId: string) => {
    toggleVisibilityMutation.mutate(syllabusId);
  };

  const handleCreateSyllabus = () => {
    if (!newSyllabus.title.trim()) {
      toast.error(t("professor.syllabi.title_required"));
      return;
    }

    const nextOrder =
      syllabi.length > 0
        ? Math.max(...syllabi.map((s: SyllabusDTO) => s.orderIndex || 0)) + 1
        : 1;

    createMutation.mutate({
      courseId: selectedGroup!.courseId,
      title: newSyllabus.title,
      description: newSyllabus.description || null,
      contentType: newSyllabus.contentType,
      orderIndex: nextOrder,
      isPublic: false,
    });
  };

  const handleDeleteSyllabus = (syllabusId: string) => {
    setSelectedSyllabusId(syllabusId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSyllabusId) {
      deleteMutation.mutate(selectedSyllabusId);
    }
  };

  const handleMoveUp = async (syllabus: SyllabusDTO, index: number) => {
    if (index === 0) return;

    const prevSyllabus = syllabi[index - 1];
    const currentOrder = syllabus.orderIndex;
    const prevOrder = prevSyllabus.orderIndex;

    // Update both syllabi to swap positions
    setReordering(true);
    try {
      await syllabusService.updateOrder(syllabus.id, prevOrder);
      await syllabusService.updateOrder(prevSyllabus.id, currentOrder);

      toast.success(t("professor.syllabi.reorder_success"));
      queryClient.invalidateQueries({
        queryKey: ["syllabi", selectedGroup?.courseId],
      });
      refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("professor.syllabi.reorder_error"),
      );
    } finally {
      setReordering(false);
    }
  };

  const handleMoveDown = async (syllabus: SyllabusDTO, index: number) => {
    if (index === syllabi.length - 1) return;

    const nextSyllabus = syllabi[index + 1];
    const currentOrder = syllabus.orderIndex;
    const nextOrder = nextSyllabus.orderIndex;

    // Update both syllabi to swap positions
    setReordering(true);
    try {
      await syllabusService.updateOrder(syllabus.id, nextOrder);
      await syllabusService.updateOrder(nextSyllabus.id, currentOrder);

      toast.success(t("professor.syllabi.reorder_success"));
      queryClient.invalidateQueries({
        queryKey: ["syllabi", selectedGroup?.courseId],
      });
      refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("professor.syllabi.reorder_error"),
      );
    } finally {
      setReordering(false);
    }
  };

  if (isLoadingGroups) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("professor.syllabi.title")}
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t("professor.syllabi.no_groups")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("professor.syllabi.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("professor.syllabi.subtitle")}
            </p>
          </div>
        </div>
        {selectedGroupId && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("professor.syllabi.create_button")}
          </Button>
        )}
      </div>

      {/* Course Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("professor.syllabi.select_course")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue
                placeholder={t("professor.syllabi.select_course_placeholder")}
              />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.groupId} value={g.groupId}>
                  {g.subjectName} ({g.groupName}) - {g.academicYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Syllabi List */}
      {selectedGroupId && (
        <Card>
          <CardHeader>
            <CardTitle>{t("professor.syllabi.topics_list")}</CardTitle>
            <CardDescription>
              {t("professor.syllabi.topics_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSyllabi ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : syllabi.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("professor.syllabi.no_topics")}
              </div>
            ) : (
              <div className="space-y-3">
                {syllabi.map((syllabus: SyllabusDTO, index: number) => (
                  <div
                    key={syllabus.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveUp(syllabus, index)}
                        disabled={index === 0 || reordering}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveDown(syllabus, index)}
                        disabled={index === syllabi.length - 1 || reordering}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Icon */}
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{syllabus.title}</p>
                        <Badge variant="outline" className="shrink-0">
                          {t(
                            `professor.syllabi.type_${
                              syllabus.contentType || "module"
                            }`,
                          )}
                        </Badge>
                      </div>
                      {syllabus.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {syllabus.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Visibility toggle */}
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`visibility-${syllabus.id}`}
                          className="text-sm cursor-pointer">
                          {syllabus.isPublic ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Eye className="h-4 w-4" />
                              {t("professor.syllabi.visible")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="h-4 w-4" />
                              {t("professor.syllabi.hidden")}
                            </span>
                          )}
                        </Label>
                        <Switch
                          id={`visibility-${syllabus.id}`}
                          checked={syllabus.isPublic}
                          onCheckedChange={() =>
                            handleToggleVisibility(syllabus.id)
                          }
                          disabled={toggleVisibilityMutation.isPending}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setManagingFilesSyllabusId(syllabus.id)}
                        title={t(
                          "professor.syllabi.manage_files",
                          "Gestionar Archivos Comunes",
                        )}>
                        <FileCode className="h-4 w-4" />
                      </Button>

                      {/* Delete button (only if no exercises) */}
                      {syllabus.exercisesCount === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSyllabus(syllabus.id)}
                          disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("professor.syllabi.create_dialog_title")}
            </DialogTitle>
            <DialogDescription>
              {t("professor.syllabi.create_dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                {t("professor.syllabi.field_title")}
              </Label>
              <Input
                id="title"
                value={newSyllabus.title}
                onChange={(e) =>
                  setNewSyllabus({ ...newSyllabus, title: e.target.value })
                }
                placeholder={t("professor.syllabi.field_title_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                {t("professor.syllabi.field_description")}
              </Label>
              <Textarea
                id="description"
                value={newSyllabus.description}
                onChange={(e) =>
                  setNewSyllabus({
                    ...newSyllabus,
                    description: e.target.value,
                  })
                }
                placeholder={t(
                  "professor.syllabi.field_description_placeholder",
                )}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentType">
                {t("professor.syllabi.field_type")}
              </Label>
              <Select
                value={newSyllabus.contentType}
                onValueChange={(value) =>
                  setNewSyllabus({ ...newSyllabus, contentType: value })
                }>
                <SelectTrigger id="contentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="module">
                    {t("professor.syllabi.type_module")}
                  </SelectItem>
                  <SelectItem value="topic">
                    {t("professor.syllabi.type_topic")}
                  </SelectItem>
                  <SelectItem value="lesson">
                    {t("professor.syllabi.type_lesson")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateSyllabus}
              disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("professor.syllabi.creating")}
                </>
              ) : (
                t("professor.syllabi.create_button")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Files Dialog */}
      <Dialog
        open={!!managingFilesSyllabusId}
        onOpenChange={(open) => !open && setManagingFilesSyllabusId(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t(
                "professor.syllabi.files_title",
                "Archivos Comunes del Temario",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "professor.syllabi.files_desc",
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("professor.syllabi.delete_confirm_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("professor.syllabi.delete_confirm_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("professor.syllabi.deleting")}
                </>
              ) : (
                t("professor.syllabi.delete_button")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
