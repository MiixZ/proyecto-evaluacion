/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/layout/tabs";
import { BookOpen, GraduationCap, Calendar, ListTree } from "lucide-react";

import DegreeManagement from "./components/DegreeManagement";
import SubjectManagement from "./components/SubjectManagement";
import CourseManagement from "./components/CourseManagement";
import SyllabusManagement from "./components/SyllabusManagement";

export default function AcademicManagement() {
  const [activeTab, setActiveTab] = useState("degrees");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión Académica
          </h1>
          <p className="text-muted-foreground">
            Administra titulaciones, asignaturas, cursos y temarios.
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4">
        <TabsList>
          <TabsTrigger value="degrees" className="flex gap-2">
            <GraduationCap className="h-4 w-4" /> Titulaciones
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex gap-2">
            <BookOpen className="h-4 w-4" /> Asignaturas
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex gap-2">
            <Calendar className="h-4 w-4" /> Cursos
          </TabsTrigger>
          <TabsTrigger value="syllabi" className="flex gap-2">
            <ListTree className="h-4 w-4" /> Temarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="degrees">
          <DegreeManagement />
        </TabsContent>

        <TabsContent value="subjects">
          <SubjectManagement />
        </TabsContent>

        <TabsContent value="courses">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="syllabi">
          <SyllabusManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
