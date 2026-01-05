import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { UsersByRoleData } from "@/services/dashboard.admin.service";
import { Users } from "lucide-react";

interface UsersByRoleChartProps {
  data: UsersByRoleData[];
}

const ROLE_COLORS: Record<string, string> = {
  student: "hsl(var(--chart-1))",
  teacher: "hsl(var(--chart-2))",
  admin: "hsl(var(--chart-3))",
};

export function UsersByRoleChart({ data }: UsersByRoleChartProps) {
  const { t } = useTranslation();

  const translatedData = data.map((item) => ({
    ...item,
    roleLabel: t(`auth.roles.${item.role}`),
  }));

  const renderLabel = (entry: {
    roleLabel: string;
    count: number;
    percentage: number;
  }) => {
    return `${entry.roleLabel}: ${entry.count} (${entry.percentage.toFixed(
      1
    )}%)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("admin.charts.users_by_role.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.charts.users_by_role.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={translatedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count">
              {translatedData.map((entry) => (
                <Cell
                  key={entry.role}
                  fill={ROLE_COLORS[entry.role] || "hsl(var(--primary))"}
                />
              ))}
            </Pie>
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
                    count: number;
                    percentage: number;
                    roleLabel: string;
                  };
                }
              ) => {
                return [
                  `${value} usuarios (${props.payload.percentage.toFixed(1)}%)`,
                  props.payload.roleLabel,
                ];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
