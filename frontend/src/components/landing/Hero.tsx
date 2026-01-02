import { Link } from "react-router-dom";
import { Button } from "@/components/ui/forms/button"; // Nota: Ruta actualizada según la reorganización de abajo
import { ArrowRight, Play, Code2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Hero Background"
          className="w-full h-full object-cover opacity-50" // Subido de 20 a 50 para ver más imagen
        />
        {/* Gradiente suavizado: empieza transparente y solo oscurece abajo para fusionarse con el contenido */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm">
            <Code2 className="h-4 w-4" />
            <span className="animate-pulse">v1.0 Disponible</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground drop-shadow-lg">
            Aprende a programar con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              retroalimentación instantánea
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-shadow-sm">
            Plataforma educativa integral para la evaluación automática de
            ejercicios. Envía tu código, recibe análisis detallado y mejora tus
            habilidades.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="text-lg px-8 h-12 rounded-full shadow-xl shadow-primary/10 transition-transform hover:scale-105"
              asChild>
              <Link to="/login">
                Comenzar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 h-12 rounded-full border-primary/20 bg-background/50 backdrop-blur-md hover:bg-primary/10"
              asChild>
              <Link to="/demo">
                <Play className="mr-2 h-5 w-5" />
                Ver demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
