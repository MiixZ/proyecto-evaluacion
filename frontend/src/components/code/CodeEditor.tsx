import { useState } from "react";
import { RotateCcw, Upload, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@radix-ui/react-select";
import { Button } from "../ui/forms/button";

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
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
            disabled={readOnly}>
            <SelectTrigger className="w-36 h-9">
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
          <span className="text-sm text-muted-foreground">
            {code.split("\n").length} líneas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {!readOnly && (
            <>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
              <Button size="sm" onClick={handleSubmit}>
                <Upload className="h-4 w-4 mr-1" />
                Enviar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex bg-card min-h-[400px] max-h-[600px] overflow-auto font-mono text-sm">
        {/* Line Numbers */}
        <div className="px-4 py-4 bg-muted/20 text-muted-foreground select-none border-r border-border text-right min-w-[3rem]">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          className="flex-1 p-4 bg-transparent resize-none outline-none leading-6 text-foreground placeholder:text-muted-foreground"
          placeholder="Escribe tu código aquí..."
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-sm text-muted-foreground">
        <span>Editor de código</span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Listo
        </span>
      </div>
    </div>
  );
};
