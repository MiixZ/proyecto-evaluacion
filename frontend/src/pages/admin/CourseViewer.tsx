import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BookOpen, Loader2, Search } from "lucide-react";
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
import { Input } from "@/components/ui/forms/input";
import { academicService } from "@/services/academic.service";

export default function CourseViewer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener asignaturas
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  // Obtener cursos de la asignatura seleccionada
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courseHistory", selectedSubject],
    queryFn: () => academicService.getCourseHistory(selectedSubject),
    enabled: !!selectedSubject,
  });

  // Filtrar cursos por búsqueda
  const filteredCourses = courses.filter(
    (course) =>
      course.academic_year.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navegar al curso seleccionado
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    if (courseId) {
      navigate(`/dashboard/courses/${courseId}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          {t("admin.courses.viewer.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("admin.courses.viewer.subtitle")}
        </p>
      </div>

      {/* Selector de asignatura */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.courses.viewer.selectSubject")}</CardTitle>
          <CardDescription>
            {t("admin.courses.viewer.selectSubjectDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t("admin.courses.viewer.selectSubjectPlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Selector de curso */}
      {selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.courses.viewer.selectCourse")}</CardTitle>
            <CardDescription>
              {t("admin.courses.viewer.selectCourseDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.courses.viewer.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {loadingCourses ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("admin.courses.viewer.noCourses")}</p>
              </div>
            ) : (
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      "admin.courses.viewer.selectCoursePlaceholder"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.academic_year} -{" "}
                      {t("admin.courses.migration.semesterLabel", {
                        number: course.semester,
                      })}{" "}
                      ({course.syllabi_count}{" "}
                      {t("admin.courses.viewer.syllabi")},{" "}
                      {course.exercises_count}{" "}
                      {t("admin.courses.viewer.exercises")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
