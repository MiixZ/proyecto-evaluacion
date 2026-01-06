import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { rankingService } from "@/services/ranking.service";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Mail,
  Sparkles,
  Crown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Badge } from "@/components/ui/data/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { RankingStudent } from "@/types/ranking.types";

export default function RankingPage() {
  const { t } = useTranslation();
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const {
    data: rankingData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ranking", selectedSubject, selectedGroup],
    queryFn: () =>
      rankingService.getRanking(
        selectedSubject !== "all" ? selectedSubject : undefined,
        selectedGroup !== "all" ? selectedGroup : undefined
      ),
  });

  // Cargar grupos cuando se selecciona una asignatura
  const { data: subjectGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["subjectGroups", selectedSubject],
    queryFn: () => rankingService.getSubjectGroups(selectedSubject),
    enabled: selectedSubject !== "all",
  });

  // Resetear grupo cuando cambia la asignatura
  useEffect(() => {
    setSelectedGroup("all");
  }, [selectedSubject]);

  const topThree = rankingData?.students.slice(0, 3) || [];
  const restOfStudents = rankingData?.students.slice(3) || [];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-7 w-7 text-slate-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:border-yellow-700";
      case 2:
        return "bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 dark:from-slate-800/30 dark:to-slate-700/30 dark:border-slate-600";
      case 3:
        return "bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 dark:from-amber-900/30 dark:to-amber-800/30 dark:border-amber-700";
      default:
        return "";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{t("ranking_page.error")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("ranking_page.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("ranking_page.subtitle")}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue
                placeholder={t("ranking_page.filters.select_subject")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("ranking_page.filters.all_subjects")}
              </SelectItem>
              {rankingData?.filters.subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedGroup}
            onValueChange={setSelectedGroup}
            disabled={selectedSubject === "all" || isLoadingGroups}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue
                placeholder={t("ranking_page.filters.select_group")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("ranking_page.filters.all_groups")}
              </SelectItem>
              {selectedSubject !== "all" &&
                subjectGroups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({group.academicYear})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - Ranking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Podio Top 3 */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center items-end gap-4 min-h-[300px]">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : topThree.length > 0 ? (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>{t("ranking_page.podium.title")}</CardTitle>
                </div>
                <CardDescription>
                  {t("ranking_page.podium.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex justify-center items-end gap-2 sm:gap-4 min-h-[320px]">
                  {/* Segundo lugar */}
                  {topThree[1] && (
                    <PodiumCard student={topThree[1]} position={2} />
                  )}

                  {/* Primer lugar */}
                  {topThree[0] && (
                    <PodiumCard student={topThree[0]} position={1} />
                  )}

                  {/* Tercer lugar */}
                  {topThree[2] && (
                    <PodiumCard student={topThree[2]} position={3} />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Lista del resto de estudiantes */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : restOfStudents.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("ranking_page.list.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {restOfStudents.map((student) => (
                  <StudentRankCard key={student.studentId} student={student} />
                ))}
              </CardContent>
            </Card>
          ) : (
            !isLoading && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {t("ranking_page.empty")}
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Tarjeta del Profesor */}
          {rankingData?.teacher && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {t("ranking_page.teacher.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarImage
                      src={rankingData.teacher.teacherImage || undefined}
                      alt={rankingData.teacher.teacherName}
                    />
                    <AvatarFallback className="text-lg bg-primary/10">
                      {getInitials(
                        rankingData.teacher.teacherName.split(" ")[0],
                        rankingData.teacher.teacherName.split(" ")[1] || ""
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                      {rankingData.teacher.teacherName}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Mail className="h-3 w-3" />
                      {rankingData.teacher.teacherEmail}
                    </p>
                  </div>
                  <div className="w-full pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("ranking_page.teacher.subject")}
                      </span>
                      <span className="font-medium">
                        {rankingData.teacher.subjectName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("ranking_page.teacher.courses")}
                      </span>
                      <Badge variant="secondary">
                        {rankingData.teacher.courseCount}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas Generales */}
          {rankingData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t("ranking_page.stats.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatItem
                  icon={<Users className="h-4 w-4" />}
                  label={t("ranking_page.stats.total_students")}
                  value={rankingData.students.length}
                />
                <StatItem
                  icon={<Target className="h-4 w-4" />}
                  label={t("ranking_page.stats.avg_completion")}
                  value={`${Math.round(
                    rankingData.students.reduce(
                      (sum, s) =>
                        sum +
                        (s.stats.totalExercises > 0
                          ? (s.stats.exercisesCompleted /
                              s.stats.totalExercises) *
                            100
                          : 0),
                      0
                    ) / (rankingData.students.length || 1)
                  )}%`}
                />
                <StatItem
                  icon={<Trophy className="h-4 w-4" />}
                  label={t("ranking_page.stats.perfect_scores")}
                  value={rankingData.students.reduce(
                    (sum, s) => sum + s.stats.perfectScores,
                    0
                  )}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para el podio
function PodiumCard({
  student,
  position,
}: {
  student: RankingStudent;
  position: number;
}) {
  const { t } = useTranslation();
  const heights = { 1: "h-64", 2: "h-48", 3: "h-40" };
  const orders = { 1: "order-2", 2: "order-1", 3: "order-3" };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-400/20 to-yellow-600/20 border-yellow-500/50";
      case 2:
        return "from-slate-400/20 to-slate-600/20 border-slate-500/50";
      case 3:
        return "from-amber-400/20 to-amber-600/20 border-amber-500/50";
      default:
        return "";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-7 w-7 text-slate-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-3 flex-1 ${
        orders[position as keyof typeof orders]
      }`}>
      <div className="relative">
        <Avatar
          className={`${position === 1 ? "h-24 w-24" : "h-20 w-20"} border-4 ${
            position === 1
              ? "border-yellow-500"
              : position === 2
              ? "border-slate-400"
              : "border-amber-600"
          }`}>
          <AvatarImage
            src={student.profileImageUrl || undefined}
            alt={`${student.firstName} ${student.lastName}`}
          />
          <AvatarFallback className="text-lg">
            {getInitials(student.firstName, student.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 border-2 shadow-lg">
          {getRankIcon(position)}
        </div>
      </div>

      <div
        className={`w-full ${
          heights[position as keyof typeof heights]
        } bg-gradient-to-t ${getRankColor(
          position
        )} border-2 rounded-t-xl p-4 flex flex-col items-center justify-start gap-2`}>
        <div className="text-center">
          <p className="font-bold text-sm sm:text-base truncate max-w-[120px]">
            {student.firstName}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
            {student.lastName}
          </p>
        </div>

        <div className="space-y-1 text-center mt-2">
          <div className="flex items-center gap-1 justify-center">
            <Trophy className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">
              {student.stats.exercisesCompleted}/{student.stats.totalExercises}
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-primary">
            {student.stats.avgScore.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("ranking_page.podium.avg_score")}
          </p>
        </div>

        {student.stats.perfectScores > 0 && (
          <Badge variant="secondary" className="mt-2">
            <Sparkles className="h-3 w-3 mr-1" />
            {student.stats.perfectScores} {t("ranking_page.podium.perfect")}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Componente para las tarjetas de estudiantes en la lista
function StudentRankCard({ student }: { student: RankingStudent }) {
  const { t } = useTranslation();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const completionRate =
    student.stats.totalExercises > 0
      ? Math.round(
          (student.stats.exercisesCompleted / student.stats.totalExercises) *
            100
        )
      : 0;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 text-center">
          <span className="text-lg font-bold text-muted-foreground">
            #{student.rank}
          </span>
        </div>

        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage
            src={student.profileImageUrl || undefined}
            alt={`${student.firstName} ${student.lastName}`}
          />
          <AvatarFallback>
            {getInitials(student.firstName, student.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">
            {student.firstName} {student.lastName}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{student.email}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="hidden sm:flex flex-col items-center">
          <span className="text-xs text-muted-foreground">
            {t("ranking_page.list.exercises")}
          </span>
          <span className="font-semibold">
            {student.stats.exercisesCompleted}/{student.stats.totalExercises}
          </span>
        </div>

        <div className="hidden md:flex flex-col items-center">
          <span className="text-xs text-muted-foreground">
            {t("ranking_page.list.completion")}
          </span>
          <Badge variant={completionRate >= 75 ? "default" : "secondary"}>
            {completionRate}%
          </Badge>
        </div>

        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-xs text-muted-foreground">
            {t("ranking_page.list.avg_score")}
          </span>
          <span className="text-lg font-bold text-primary">
            {student.stats.avgScore.toFixed(1)}
          </span>
        </div>

        {student.stats.perfectScores > 0 && (
          <Badge variant="secondary" className="hidden lg:flex">
            <Sparkles className="h-3 w-3 mr-1" />
            {student.stats.perfectScores}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Componente para items de estadísticas
function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
