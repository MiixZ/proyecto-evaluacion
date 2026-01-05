/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye, EyeOff, Loader2, BookOpen } from "lucide-react";
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
import { dashboardService } from "@/services/dashboard.service";
import { syllabusService, SyllabusDTO } from "@/services/syllabus.service";
import { toast } from "sonner";

export default function ManageSyllabi() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initialGroupId = localStorage.getItem("professorLastGroupId");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || ""
  );

  const { data: dashboardData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["professorStats"],
    queryFn: () => dashboardService.getProfessorStats(),
  });

  const groups = useMemo(
    () => dashboardData?.groups || [],
    [dashboardData?.groups]
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
          : t("professor.syllabi.visibility_hidden")
      );
      queryClient.invalidateQueries({
        queryKey: ["syllabi", selectedGroup?.courseId],
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || t("professor.syllabi.error_toggle")
      );
    },
  });

  const handleToggleVisibility = (syllabusId: string) => {
    toggleVisibilityMutation.mutate(syllabusId);
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
                {syllabi.map((syllabus: SyllabusDTO) => (
                  <div
                    key={syllabus.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {syllabus.title}
                          </p>
                          <Badge variant="outline" className="shrink-0">
                            {t(
                              `professor.syllabi.type_${
                                syllabus.contentType || "module"
                              }`
                            )}
                          </Badge>
                        </div>
                        {syllabus.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {syllabus.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
