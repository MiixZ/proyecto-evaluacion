import {
  Zap,
  Shield,
  BarChart3,
  Users,
  FileCode,
  GraduationCap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/layout/card";

const features = [
  {
    icon: Zap,
    title: "Evaluación Instantánea",
    description:
      "Feedback inmediato sobre tu código mediante análisis estático y dinámico.",
  },
  {
    icon: Shield,
    title: "Ejecución Segura",
    description:
      "Entornos aislados (Sandboxing) que garantizan la seguridad del servidor.",
  },
  {
    icon: BarChart3,
    title: "Métricas de Progreso",
    description:
      "Visualiza tu evolución con estadísticas detalladas por lenguaje y tema.",
  },
  {
    icon: Users,
    title: "Gestión Docente",
    description:
      "Herramientas para profesores: creación de cursos, grupos y seguimiento.",
  },
  {
    icon: FileCode,
    title: "Multi-lenguaje",
    description: "Soporte nativo para Python, Java, C++, C y JavaScript.",
  },
  {
    icon: GraduationCap,
    title: "Malla Curricular",
    description:
      "Organización académica jerárquica: Titulación > Asignatura > Tema.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-muted-foreground text-lg">
            Una suite completa diseñada específicamente para el entorno
            académico.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 border-primary/10 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
