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
import { SubmissionTrendData } from "@/services/dashboard.professor.service";
import { Clock } from "lucide-react";

interface SubmissionTrendChartProps {
  data: SubmissionTrendData[];
}

export function SubmissionTrendChart({ data }: SubmissionTrendChartProps) {
  const { t } = useTranslation();

  const chartData = data.map((item) => ({
    ...item,
    hourLabel: `${item.hour.toString().padStart(2, "0")}:00`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("professor.charts.submission_trend.title")}
        </CardTitle>
        <CardDescription>
          {t("professor.charts.submission_trend.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hourLabel"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="count"
              name={t("professor.charts.submission_trend.submissions")}
              fill="hsl(var(--chart-4))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
