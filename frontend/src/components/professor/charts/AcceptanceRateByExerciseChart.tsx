import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { AcceptanceRateByExerciseData } from "@/services/dashboard.professor.service";
import { Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";

interface AcceptanceRateByExerciseChartProps {
  data: AcceptanceRateByExerciseData[];
  selectedExerciseId?: string;
  onExerciseChange?: (exerciseId: string) => void;
}

export function AcceptanceRateByExerciseChart({
  data,
  selectedExerciseId,
  onExerciseChange,
}: AcceptanceRateByExerciseChartProps) {
  const { t } = useTranslation();

  const displayData = selectedExerciseId
    ? data.filter((item) => item.exerciseId === selectedExerciseId)
    : data.slice(0, 10);

  const truncateTitle = (title: string, maxLength: number = 20) => {
    return title.length > maxLength
      ? title.substring(0, maxLength) + "..."
      : title;
  };

  const chartData = displayData.map((item) => ({
    ...item,
    shortTitle: truncateTitle(item.exerciseTitle),
  }));

  const chartHeight = displayData.length === 1 ? 350 : 300;
  const barSize = displayData.length === 1 ? 60 : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("professor.charts.acceptance_rate.title")}
            </CardTitle>
            <CardDescription>
              {t("professor.charts.acceptance_rate.description")}
            </CardDescription>
          </div>
          {onExerciseChange && (
            <Select
              value={selectedExerciseId || "all"}
              onValueChange={onExerciseChange}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("professor.charts.acceptance_rate.all_exercises")}
                </SelectItem>
                {data.map((exercise) => (
                  <SelectItem
                    key={exercise.exerciseId}
                    value={exercise.exerciseId}>
                    {exercise.exerciseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} barSize={barSize}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="shortTitle"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.exerciseTitle;
                }
                return label;
              }}
              formatter={(
                value: number,
                name: string,
                props: {
                  payload: {
                    totalSubmissions: number;
                    acceptedSubmissions: number;
                  };
                }
              ) => {
                const item = props.payload;
                return [
                  `${value.toFixed(1)}% (${item.acceptedSubmissions}/${
                    item.totalSubmissions
                  })`,
                  name,
                ];
              }}
            />
            <Legend />
            <Bar
              dataKey="acceptanceRate"
              name={t("professor.charts.acceptance_rate.rate")}
              fill="hsl(var(--chart-2))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
