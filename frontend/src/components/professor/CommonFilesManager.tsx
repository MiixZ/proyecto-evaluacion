import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, FileCode, Edit, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/code/CodeEditor";

import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import { Textarea } from "@/components/ui/forms/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/overlay/dialog";
import {
  commonFilesService,
  CommonFile,
} from "@/services/common-files.service";

interface CommonFilesManagerProps {
  exerciseId?: string;
  syllabusId?: string;
  disabled?: boolean;
  files?: CommonFile[];
  onChange?: (files: CommonFile[]) => void;
}

export function CommonFilesManager({
  exerciseId,
  syllabusId,
  disabled = false,
  files: propFiles,
  onChange,
}: CommonFilesManagerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<CommonFile | null>(null);

  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState<
    "source" | "data" | "config" | "header"
  >("source");
  const [description, setDescription] = useState("");

  const entityId = exerciseId || syllabusId;
  const entityType = exerciseId ? "exercise" : "syllabus";
  const isLocalMode = !entityId && !!onChange;

  const { data: apiFiles = [], isLoading } = useQuery({
    queryKey: ["commonFiles", entityType, entityId],
    queryFn: () =>
      exerciseId
        ? commonFilesService.getExerciseFiles(exerciseId)
        : commonFilesService.getSyllabusFiles(syllabusId!),
    enabled: !!entityId && !isLocalMode,
  });

  const files = isLocalMode ? propFiles || [] : apiFiles;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (isLocalMode) {
        const newFile: CommonFile = {
          id: crypto.randomUUID(),
          filename,
          content,
          fileType,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onChange?.([...files, newFile]);
        return newFile;
      }

      if (exerciseId) {
        return commonFilesService.createExerciseFile(exerciseId, {
          filename,
          content,
          fileType,
          description: description || undefined,
        });
      } else {
        return commonFilesService.createSyllabusFile(syllabusId!, {
          filename,
          content,
          fileType,
          description: description || undefined,
        });
      }
    },
    onSuccess: () => {
      if (!isLocalMode) {
        queryClient.invalidateQueries({
          queryKey: ["commonFiles", entityType, entityId],
        });
      }
      toast.success(t("common_files.created", "Archivo creado correctamente"));
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error(t("common_files.create_error", "Error al crear archivo"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingFile) return;

      if (isLocalMode) {
        const updatedFile = {
          ...editingFile,
          filename,
          content,
          fileType,
          description,
          updatedAt: new Date().toISOString(),
        };
        const newFiles = files.map((f) =>
          f.id === editingFile.id ? updatedFile : f,
        );
        onChange?.(newFiles);
        return updatedFile;
      }

      if (exerciseId) {
        return commonFilesService.updateExerciseFile(editingFile.id, {
          filename,
          content,
          fileType,
          description: description || undefined,
        });
      } else {
        return commonFilesService.updateSyllabusFile(editingFile.id, {
          filename,
          content,
          fileType,
          description: description || undefined,
        });
      }
    },
    onSuccess: () => {
      if (!isLocalMode) {
        queryClient.invalidateQueries({
          queryKey: ["commonFiles", entityType, entityId],
        });
      }
      toast.success(t("common_files.updated", "Archivo actualizado"));
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error(t("common_files.update_error", "Error al actualizar"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (isLocalMode) {
        const newFiles = files.filter((f) => f.id !== fileId);
        onChange?.(newFiles);
        return;
      }

      if (exerciseId) {
        return commonFilesService.deleteExerciseFile(fileId);
      } else {
        return commonFilesService.deleteSyllabusFile(fileId);
      }
    },
    onSuccess: () => {
      if (!isLocalMode) {
        queryClient.invalidateQueries({
          queryKey: ["commonFiles", entityType, entityId],
        });
      }
      toast.success(t("common_files.deleted", "Archivo eliminado"));
    },
    onError: () => {
      toast.error(t("common_files.delete_error", "Error al eliminar"));
    },
  });

  const resetForm = () => {
    setFilename("");
    setContent("");
    setFileType("source");
    setDescription("");
    setEditingFile(null);
  };

  const handleEdit = (file: CommonFile) => {
    setEditingFile(file);
    setFilename(file.filename);
    setContent(file.content);
    setFileType(file.fileType);
    setDescription(file.description || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!filename.trim() || !content.trim()) {
      toast.error(
        t("common_files.required_fields", "Nombre y contenido requeridos"),
      );
      return;
    }

    if (editingFile) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (!entityId && !isLocalMode) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center text-muted-foreground">
          {t(
            "common_files.save_first",
            "Guarda el ejercicio primero para añadir archivos",
          )}
        </CardContent>
      </Card>
    );
  }

  // Detect proper language for CodeEditor based on filename or fileType
  const getEditorLanguage = () => {
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".js")) return "javascript";
    if (filename.endsWith(".java")) return "java";
    if (
      filename.endsWith(".cpp") ||
      filename.endsWith(".h") ||
      filename.endsWith(".hpp")
    )
      return "cpp";
    if (filename.endsWith(".c")) return "cpp"; // Approximate
    return "python"; // Default
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            {t("common_files.title", "Archivos Comunes")}
          </CardTitle>
          <CardDescription>
            {t(
              "common_files.description",
              "Archivos que se copiarán junto al código del estudiante",
            )}
          </CardDescription>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}>
              <Plus className="h-4 w-4 mr-1" />
              {t("common_files.add", "Añadir")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingFile
                  ? t("common_files.edit_file", "Editar Archivo")
                  : t("common_files.new_file", "Nuevo Archivo")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "common_files.dialog_desc",
                  "Este archivo se copiará al contenedor de ejecución",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 flex flex-col gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {t("common_files.filename", "Nombre de archivo")}
                  </Label>
                  <Input
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="utils.py"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common_files.file_type", "Tipo")}</Label>
                  <Select
                    value={fileType}
                    onValueChange={(v: any) => setFileType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source">Source (Código)</SelectItem>
                      <SelectItem value="data">Data (Datos/Txt)</SelectItem>
                      <SelectItem value="config">Config (JSON/Yaml)</SelectItem>
                      <SelectItem value="header">Header (H/HPP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  {t(
                    "common_files.description_label",
                    "Descripción (opcional)",
                  )}
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t(
                    "common_files.description_placeholder",
                    "Funciones auxiliares...",
                  )}
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <Label>{t("common_files.content", "Contenido")}</Label>
                <div className="flex-1 border rounded-md overflow-hidden">
                  <CodeEditor
                    initialCode={content}
                    language={getEditorLanguage()}
                    onChange={setContent}
                    showSubmitButton={false}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-1" />
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-1" />
                {t("common.save", "Guardar")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading && !isLocalMode ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("common_files.empty", "No hay archivos comunes")}
          </p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {file.filename}
                    </p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground">
                        {file.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(file)}
                    disabled={disabled}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={disabled || deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
