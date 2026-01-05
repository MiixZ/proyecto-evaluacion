/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  FileCode,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

import { Card, CardContent, CardHeader } from "@/components/ui/layout/card";
import { Button } from "@/components/ui/forms/button";
import { Badge } from "@/components/ui/data/badge";
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/overlay/dropdown-menu";

import { toast } from "@/hooks/use-toast";
import { exerciseService } from "@/services/exercise.service";

interface Exercise {
  id: string;
  title: string;
  subject: string;
  syllabus: string;
  difficulty: string;
  isPublished: boolean;
  createdAt: string;
  submissionCount: number;
}

export default function ExercisesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["my-exercises"],
    queryFn: exerciseService.getMyExercises,
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      exerciseService.togglePublish(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-exercises"] });
      toast({
        title: t("exercise_list.toast.status_updated"),
        description: t("exercise_list.toast.status_updated_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("exercise_list.toast.status_error"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => exerciseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-exercises"] });
      toast({ title: t("exercise_list.toast.deleted") });
    },
    onError: (err: any) => {
      const serverMessage = err.response?.data?.message;
      const description = serverMessage || "No se pudo realizar la acción.";

      toast({
        title: "Error",
        description: description,
        variant: "destructive",
      });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => exerciseService.clone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-exercises"] });
      toast({
        title: t("exercise_list.toast.duplicated"),
        description: t("exercise_list.toast.duplicated_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("exercise_list.toast.clone_error"),
        variant: "destructive",
      });
    },
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "beginner":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "advanced":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case "beginner":
        return t("exercise_list.difficulty.easy");
      case "intermediate":
        return t("exercise_list.difficulty.medium");
      case "advanced":
        return t("exercise_list.difficulty.hard");
      default:
        return diff;
    }
  };

  const columns: ColumnDef<Exercise>[] = [
    {
      key: "title",
      label: t("exercise_list.table.title"),
      sortable: true,
      render: (ex) => (
        <div>
          <div className="font-medium">{ex.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {t("exercise_list.created_on")}{" "}
            {format(new Date(ex.createdAt), "d MMM yyyy", {
              locale: i18n.language === "es" ? es : enUS,
            })}
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      label: t("exercise_list.table.subject"),
      sortable: true,
      render: (ex) => (
        <div>
          <div className="font-medium text-sm">{ex.subject}</div>
          <div className="text-xs text-muted-foreground">{ex.syllabus}</div>
        </div>
      ),
    },
    {
      key: "difficulty",
      label: t("exercise_list.table.difficulty"),
      sortable: true,
      render: (ex) => (
        <Badge variant="outline" className={getDifficultyColor(ex.difficulty)}>
          {getDifficultyLabel(ex.difficulty)}
        </Badge>
      ),
    },
    {
      key: "isPublished",
      label: t("exercise_list.table.status"),
      sortable: true,
      render: (ex) =>
        ex.isPublished ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Eye className="mr-1 h-3 w-3" />
            {t("exercise_list.status_published")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <EyeOff className="mr-1 h-3 w-3" />
            {t("exercise_list.status_draft")}
          </Badge>
        ),
    },
    {
      key: "submissionCount",
      label: t("exercise_list.table.submissions"),
      sortable: true,
      render: (ex) => (
        <span className="text-muted-foreground">{ex.submissionCount || 0}</span>
      ),
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "actions",
      label: "",
      render: (ex) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/dashboard/exercises/${ex.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("exercise_list.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => cloneMutation.mutate(ex.id)}>
              <Copy className="mr-2 h-4 w-4" />
              {t("exercise_list.actions.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                togglePublishMutation.mutate({
                  id: ex.id,
                  status: !ex.isPublished,
                })
              }>
              {ex.isPublished ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  {t("exercise_list.actions.unpublish")}
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("exercise_list.actions.publish")}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (window.confirm(t("exercise_list.delete_confirm"))) {
                  deleteMutation.mutate(ex.id);
                }
              }}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("exercise_list.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Preparar datos para filtro de status
  const exercisesWithStatus = useMemo(() => {
    return (exercises || []).map((ex) => ({
      ...ex,
      status: ex.isPublished ? "published" : "draft",
    }));
  }, [exercises]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            {t("exercise_list.title")}
          </h1>
          <p className="text-muted-foreground">{t("exercise_list.subtitle")}</p>
        </div>
        <Button onClick={() => navigate("/dashboard/create")}>
          <Plus className="mr-2 h-4 w-4" /> {t("exercise_list.create_new")}
        </Button>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          <DataTable<Exercise>
            data={exercisesWithStatus}
            columns={columns}
            searchKeys={["title", "subject", "syllabus"]}
            filterOptions={[
              {
                key: "status",
                label: t("exercise_list.filter_status"),
                options: [
                  {
                    value: "published",
                    label: t("exercise_list.filter_published"),
                  },
                  { value: "draft", label: t("exercise_list.filter_draft") },
                ],
              },
            ]}
            getRowKey={(ex) => ex.id}
            searchPlaceholder={t("exercise_list.search_placeholder")}
            emptyMessage={t("exercise_list.no_exercises")}
            isLoading={isLoading}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
