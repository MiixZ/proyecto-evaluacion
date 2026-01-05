import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/forms/form";
import { CodeEditor } from "@/components/code/CodeEditor";
import { CreateExerciseFormValues } from "@/schemas/exercise.schema";

interface TemplateSectionProps {
  form: UseFormReturn<CreateExerciseFormValues>;
  availableLanguages: Array<{ code: string; name: string }>;
  isLoadingLanguages: boolean;
}

export function TemplateSection({
  form,
  availableLanguages,
  isLoadingLanguages,
}: TemplateSectionProps) {
  const { t } = useTranslation();
  const [templateCode, setTemplateCode] = useState(
    form.getValues("templateCode") || ""
  );

  const handleLanguageChange = (newLanguage: string) => {
    form.setValue("language", newLanguage);
  };

  const handleCodeChange = (code: string | undefined) => {
    const newCode = code || "";
    setTemplateCode(newCode);
    form.setValue("templateCode", newCode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("professor.create_exercise.template_title")}</CardTitle>
        <CardDescription>
          {t("professor.create_exercise.template_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de Lenguaje */}
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("professor.create_exercise.language_label")}
              </FormLabel>
              <div className="w-48">
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    handleLanguageChange(val);
                  }}
                  disabled={isLoadingLanguages}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingLanguages
                            ? t("professor.create_exercise.loading")
                            : t("professor.create_exercise.language_label")
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Editor de código */}
        <div className="border rounded-md overflow-hidden h-[300px]">
          <CodeEditor
            language={form.watch("language")}
            initialCode={templateCode}
            onChange={handleCodeChange}
            readOnly={false}
            showSubmitButton={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
