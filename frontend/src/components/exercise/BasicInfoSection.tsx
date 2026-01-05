import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/forms/label";
import { Input } from "@/components/ui/forms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/forms/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { CreateExerciseFormValues } from "@/schemas/exercise.schema";

interface BasicInfoSectionProps {
  form: UseFormReturn<CreateExerciseFormValues>;
  groups: Array<{
    groupId: string;
    subjectName: string;
    groupName: string;
    courseId: string;
  }>;
  syllabi?: Array<{ id: string; title: string; contentType: string }>;
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  isLoadingSyllabi: boolean;
}

export function BasicInfoSection({
  form,
  groups,
  syllabi,
  selectedGroupId,
  onGroupChange,
  isLoadingSyllabi,
}: BasicInfoSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("professor.create_exercise.general_info")}</CardTitle>
        <CardDescription>
          {t("professor.create_exercise.general_info_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de Curso/Asignatura */}
        <div className="space-y-2">
          <Label>{t("professor.create_exercise.subject_group")}</Label>
          <Select value={selectedGroupId} onValueChange={onGroupChange}>
            <SelectTrigger>
              <SelectValue
                placeholder={t("professor.create_exercise.select_subject")}
              />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.groupId} value={g.groupId}>
                  {g.subjectName} ({g.groupName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("professor.create_exercise.subject_help")}
          </p>
        </div>

        {/* Título */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("professor.create_exercise.title_label")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("professor.create_exercise.title_placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("professor.create_exercise.description_label")}
              </FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[150px] font-mono text-sm"
                  placeholder={t(
                    "professor.create_exercise.description_placeholder"
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temario y Dificultad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temario */}
          <FormField
            control={form.control}
            name="syllabusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("professor.create_exercise.syllabus_label")}
                </FormLabel>
                <Select
                  disabled={!selectedGroupId || isLoadingSyllabi}
                  onValueChange={field.onChange}
                  value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingSyllabi
                            ? t("professor.create_exercise.loading")
                            : t("professor.create_exercise.select_syllabus")
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {syllabi?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title} ({s.contentType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dificultad */}
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("professor.create_exercise.difficulty_label")}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">
                      {t("professor.create_exercise.difficulty_beginner")}
                    </SelectItem>
                    <SelectItem value="intermediate">
                      {t("professor.create_exercise.difficulty_intermediate")}
                    </SelectItem>
                    <SelectItem value="advanced">
                      {t("professor.create_exercise.difficulty_advanced")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
