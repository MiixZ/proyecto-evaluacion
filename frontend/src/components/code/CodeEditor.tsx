import { useState, useEffect, useRef } from "react";
import { RotateCcw, Upload, Copy, Check, Loader2, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/forms/select";
import { Button } from "@/components/ui/forms/button";
import { cn } from "@/lib/utils";
import { languageService } from "@/services/language.service";

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onSubmit?: (code: string, language: string) => void;
  readOnly?: boolean;
  isSubmitting?: boolean;
}

const defaultCode = `# Escribe tu solución aquí
def solution():
    # Tu código aquí
    pass

if __name__ == "__main__":
    solution()
`;

export const CodeEditor = ({
  initialCode = defaultCode,
  language = "python",
  onSubmit,
  readOnly = false,
  isSubmitting = false,
}: CodeEditorProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (language) setSelectedLanguage(language);
  }, [language]);

  const { data: availableLanguages = [] } = useQuery({
    queryKey: ["languages"],
    queryFn: languageService.getActiveLanguages,
    staleTime: 1000 * 60 * 60,
  });

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(code, selectedLanguage);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    toast({
      title: t("editor.toasts.reset_title"),
      description: t("editor.toasts.reset_desc"),
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- LÓGICA DE TABULADOR ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !readOnly && !isSubmitting) {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const spaces = "  ";
      const newCode = code.substring(0, start) + spaces + code.substring(end);

      setCode(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === "string") {
        setCode(content);
        toast({
          title: t("editor.toasts.upload_title"),
          description: t("editor.toasts.upload_desc"),
        });
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  };

  const lineNumbers = code.split("\n").map((_, i) => i + 1);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col h-full shadow-sm">
      {/* Input oculto para subida de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.py,.js,.java,.c,.cpp,.h"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
            disabled={readOnly || isSubmitting}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <SelectValue placeholder="Lenguaje" />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
              {availableLanguages.length === 0 && (
                <SelectItem value={selectedLanguage}>
                  {selectedLanguage}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground font-mono">
            {code.split("\n").length} {t("editor.lines")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Botón de Subida de Archivo */}
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              title={t("editor.upload")}>
              <FileUp className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            title={t("editor.copy")}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleReset}
                disabled={isSubmitting}>
                <RotateCcw className="h-3 w-3 mr-1.5" />
                {t("editor.reset")}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs px-4"
                onClick={handleSubmit}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    {t("editor.submitting")}
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3 mr-1.5" />
                    {t("editor.submit")}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex flex-1 relative min-h-[400px] overflow-hidden bg-[#1e1e1e] text-zinc-100 font-mono text-sm">
        {/* Line Numbers */}
        <div className="px-3 py-4 bg-[#1e1e1e] text-zinc-500 select-none text-right min-w-[3rem] border-r border-zinc-800">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6 text-xs">
              {num}
            </div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly || isSubmitting}
          className={cn(
            "flex-1 p-4 bg-transparent resize-none outline-none leading-6 w-full h-full custom-scrollbar",
            "focus:ring-0 focus:outline-none placeholder:text-zinc-600"
          )}
          placeholder={t("editor.placeholder") || "Escribe tu código aquí..."}
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-muted/40 text-xs text-muted-foreground">
        <span>UTF-8</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t("editor.ready")}
        </span>
      </div>
    </div>
  );
};
