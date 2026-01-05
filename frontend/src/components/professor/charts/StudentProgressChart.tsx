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
import { StudentProgressData } from "@/services/dashboard.professor.service";
import { GraduationCap } from "lucide-react";

interface StudentProgressChartProps {
  data: StudentProgressData[];
}

export function StudentProgressChart({ data }: StudentProgressChartProps) {
  const { t } = useTranslation();

  const formatStudentName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return fullName;

    const firstName = parts[0];
    const lastNames = parts.slice(1);
    const initials = lastNames
      .map((name) => name.charAt(0).toUpperCase() + ".")
      .join(" ");

    return `${firstName} ${initials}`;
  };

  const chartData = data
    .map((student) => ({
      ...student,
      studentName: formatStudentName(student.studentName),
      completionRate:
        (student.exercisesCompleted / student.totalExercises) * 100,
    }))
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {t("professor.charts.student_progress.title")}
        </CardTitle>
        <CardDescription>
          {t("professor.charts.student_progress.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              type="category"
              dataKey="studentName"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(
                value: number,
                name: string,
                props: {
                  payload: StudentProgressData & { completionRate: number };
                }
              ) => {
                const item = props.payload;
                return [
                  `${value.toFixed(1)}% (${item.exercisesCompleted}/${
                    item.totalExercises
                  })`,
                  name,
                ];
              }}
            />
            <Legend />
            <Bar
              dataKey="completionRate"
              name={t("professor.charts.student_progress.completion")}
              fill="hsl(var(--chart-3))"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
