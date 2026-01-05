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
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { AcceptanceRateByDifficultyData } from "@/services/dashboard.admin.service";
import { Target } from "lucide-react";

interface AcceptanceRateChartProps {
  data: AcceptanceRateByDifficultyData[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "hsl(142, 76%, 36%)",
  intermediate: "hsl(48, 96%, 53%)",
  advanced: "hsl(0, 84%, 60%)",
};

export function AcceptanceRateChart({ data }: AcceptanceRateChartProps) {
  const { t } = useTranslation();

  const translatedData = data.map((item) => ({
    ...item,
    difficultyLabel: t(`exercise.difficulty.${item.difficulty}`),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t("admin.charts.acceptance_rate.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.charts.acceptance_rate.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={translatedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="difficultyLabel"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
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
              name={t("admin.charts.acceptance_rate.rate")}
              radius={[8, 8, 0, 0]}>
              {translatedData.map((entry) => (
                <Cell
                  key={entry.difficulty}
                  fill={
                    DIFFICULTY_COLORS[entry.difficulty] || "hsl(var(--primary))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
