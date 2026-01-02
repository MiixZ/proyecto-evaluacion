import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/layout/card";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Badge } from "./badge";
import { Button } from "../forms/button";

export type ExerciseStatus = "completed" | "failed" | "pending" | "locked";
export type ExerciseDifficulty = "easy" | "medium" | "hard";

interface ExerciseCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: ExerciseDifficulty;
  status: ExerciseStatus;
  timeLimit?: number;
  attempts?: number;
  maxAttempts?: number;
  dueDate?: string;
}

const difficultyConfig = {
  easy: {
    label: "Fácil",
    className: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  },
  medium: {
    label: "Media",
    className: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  },
  hard: {
    label: "Difícil",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
};

const statusConfig = {
  completed: { icon: CheckCircle2, label: "Completado", color: "text-primary" },
  failed: { icon: XCircle, label: "Fallido", color: "text-destructive" },
  pending: { icon: AlertCircle, label: "Pendiente", color: "text-chart-4" },
  locked: { icon: Clock, label: "Bloqueado", color: "text-muted-foreground" },
};

export const ExerciseCard = ({
  id,
  title,
  description,
  difficulty,
  status,
  timeLimit,
  attempts = 0,
  maxAttempts,
  dueDate,
}: ExerciseCardProps) => {
  const diffConfig = difficultyConfig[difficulty];
  const statConfig = statusConfig[status];
  const StatusIcon = statConfig.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={diffConfig.className}>
                {diffConfig.label}
              </Badge>
              {dueDate && (
                <span className="text-xs text-muted-foreground">
                  Entrega: {dueDate}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
          <div className={`flex items-center gap-1.5 ${statConfig.color}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{statConfig.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {timeLimit && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {timeLimit} min
              </span>
            )}
            {maxAttempts && (
              <span>
                Intentos: {attempts}/{maxAttempts}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="group-hover:bg-primary group-hover:text-primary-foreground"
            asChild
            disabled={status === "locked"}>
            <Link to={`/dashboard/exercise/${id}`}>
              {status === "locked" ? "Bloqueado" : "Ver ejercicio"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
