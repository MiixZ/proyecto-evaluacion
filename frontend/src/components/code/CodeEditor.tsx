import { useState } from "react";
import { RotateCcw, Upload, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/forms/select";
import { Button } from "@/components/ui/forms/button";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onSubmit?: (code: string, language: string) => void;
  readOnly?: boolean;
}

const languages = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "javascript", label: "JavaScript" },
];

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
}: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(code, selectedLanguage);
    }
    toast({
      title: "Código enviado",
      description: "Tu solución está siendo evaluada...",
    });
  };

  const handleReset = () => {
    setCode(initialCode);
    toast({
      title: "Código reiniciado",
      description: "El editor ha sido restaurado al código inicial.",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineNumbers = code.split("\n").map((_, i) => i + 1);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col h-full shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
            disabled={readOnly}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground font-mono">
            {code.split("\n").length} líneas
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            title="Copiar código">
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
                onClick={handleReset}>
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Reiniciar
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs px-4"
                onClick={handleSubmit}>
                <Upload className="h-3 w-3 mr-1.5" />
                Enviar
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
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          className={cn(
            "flex-1 p-4 bg-transparent resize-none outline-none leading-6 w-full h-full custom-scrollbar",
            "focus:ring-0 focus:outline-none placeholder:text-zinc-600"
          )}
          placeholder="Escribe tu código aquí..."
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-muted/40 text-xs text-muted-foreground">
        <span>UTF-8</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Listo
        </span>
      </div>
    </div>
  );
};
