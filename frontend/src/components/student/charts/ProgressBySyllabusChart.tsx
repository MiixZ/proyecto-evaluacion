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
import { ProgressBySyllabusData } from "@/services/dashboard.student.service";
import { BookOpen } from "lucide-react";

interface ProgressBySyllabusChartProps {
  data: ProgressBySyllabusData[];
}

export function ProgressBySyllabusChart({
  data,
}: ProgressBySyllabusChartProps) {
  const { t } = useTranslation();

  const truncateTitle = (title: string, maxLength: number = 25) => {
    return title.length > maxLength
      ? title.substring(0, maxLength) + "..."
      : title;
  };

  const chartData = data.map((item) => ({
    ...item,
    shortTitle: truncateTitle(item.syllabusTitle),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {t("student.charts.progress_by_syllabus.title")}
        </CardTitle>
        <CardDescription>
          {t("student.charts.progress_by_syllabus.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
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
                  return payload[0].payload.syllabusTitle;
                }
                return label;
              }}
              formatter={(
                value: number,
                name: string,
                props: {
                  payload: {
                    completed: number;
                    total: number;
                  };
                }
              ) => {
                const item = props.payload;
                return [
                  `${value.toFixed(1)}% (${item.completed}/${item.total})`,
                  name,
                ];
              }}
            />
            <Legend />
            <Bar
              dataKey="percentage"
              name={t("student.charts.progress_by_syllabus.progress")}
              fill="hsl(var(--chart-3))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
