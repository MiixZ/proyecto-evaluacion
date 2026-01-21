import { UseFormReturn, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Code } from "lucide-react";
import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import { Textarea } from "@/components/ui/forms/textarea";
import { Checkbox } from "@/components/ui/forms/checkbox";
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
import { CreateExerciseFormValues } from "@/schemas/exercise.schema";
import { CodeEditor } from "@/components/code/CodeEditor";

interface TestCasesSectionProps {
  form: UseFormReturn<CreateExerciseFormValues>;
}

export function TestCasesSection({ form }: TestCasesSectionProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testCases",
  });

  const handleAddTestCase = () => {
    append({
      input: "",
      expectedOutput: "",
      runnerCode: "",
      isHidden: true,
      timeLimitSeconds: 2,
      memoryLimitMb: 128,
      hintText: "",
      hintPenaltyPercent: 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {t("professor.create_exercise.test_cases_title")}
            </CardTitle>
            <CardDescription>
              {t("professor.create_exercise.test_cases_desc")}
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleAddTestCase}
            variant="outline"
            size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t("professor.create_exercise.add_case")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {t("professor.create_exercise.case_number", {
                    number: index + 1,
                  })}
                </CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Oculto */}
              <FormField
                control={form.control}
                name={`testCases.${index}.isHidden`}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("professor.create_exercise.hidden_label")}
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Input */}
              <FormField
                control={form.control}
                name={`testCases.${index}.input`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("professor.create_exercise.input_label")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          "professor.create_exercise.input_placeholder",
                        )}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expected Output */}
              <FormField
                control={form.control}
                name={`testCases.${index}.expectedOutput`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("professor.create_exercise.output_label")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          "professor.create_exercise.output_placeholder",
                        )}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Runner Code */}
              <FormField
                control={form.control}
                name={`testCases.${index}.runnerCode`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      {t("professor.create_exercise.runner_code_label")}
                    </FormLabel>
                    <FormControl>
                      <div className="border rounded-md overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                        <CodeEditor
                          initialCode={field.value || ""}
                          onChange={field.onChange}
                          language={form.watch("language") || "python"}
                          showSubmitButton={false}
                          readOnly={false}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t("professor.create_exercise.runner_code_help")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Límites y Pista */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FormField
                  control={form.control}
                  name={`testCases.${index}.timeLimitSeconds`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("professor.create_exercise.time_label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`testCases.${index}.memoryLimitMb`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("professor.create_exercise.memory_label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={64}
                          max={1024}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`testCases.${index}.hintPenaltyPercent`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("professor.create_exercise.hint_penalty_label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Hint Text */}
              <FormField
                control={form.control}
                name={`testCases.${index}.hintText`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("professor.create_exercise.hint_label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "professor.create_exercise.hint_placeholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
