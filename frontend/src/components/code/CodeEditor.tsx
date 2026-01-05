import { useState, useEffect, useRef, useMemo } from "react";
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
import { languageService } from "@/services/language.service";

import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onSubmit?: (code: string, language: string) => void;
  readOnly?: boolean;
  isSubmitting?: boolean;
  onChange?: (code: string) => void;
  showSubmitButton?: boolean;
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
  onChange,
  showSubmitButton = true,
}: CodeEditorProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  const getLanguageExtension = (langCode: string) => {
    switch (langCode) {
      case "python":
        return python();
      case "javascript":
      case "js":
        return javascript();
      case "java":
        return java();
      case "c":
      case "cpp":
        return cpp();
      default:
        return python();
    }
  };

  const extensions = useMemo(() => {
    return [getLanguageExtension(selectedLanguage)];
  }, [selectedLanguage]);

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

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col h-full shadow-sm">
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
              <SelectValue placeholder={t("editor.language")} />
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
              {showSubmitButton && (
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor Area usando CodeMirror */}
      <div className="flex-1 relative min-h-[400px] overflow-hidden bg-[#1e1e1e]">
        <CodeMirror
          value={code}
          height="100%"
          theme={vscodeDark}
          extensions={extensions}
          onChange={(value) => {
            setCode(value);
            onChange?.(value);
          }}
          editable={!readOnly && !isSubmitting}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightActiveLine: true,
          }}
          className="h-full text-sm font-mono"
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
