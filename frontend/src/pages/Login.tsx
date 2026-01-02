import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/layout/tabs";
import { Code2, Mail, Lock, User, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent, role: string) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido a CodeEval como ${role}`,
      });

      // Navigate based on role
      if (role === "student") {
        navigate("/dashboard");
      } else if (role === "professor") {
        navigate("/professor");
      } else {
        navigate("/admin");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <div className="mb-8">
            <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
              <Code2 className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4">CodeEval</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Plataforma de evaluación automática de ejercicios de programación
            </p>
          </div>

          <div className="space-y-6 text-left max-w-sm">
            {[
              "Evaluación instantánea de tu código",
              "Retroalimentación detallada",
              "Seguimiento de progreso personalizado",
              "Múltiples lenguajes de programación",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-foreground/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Code2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">CodeEval</span>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>
                Accede a tu cuenta para continuar aprendiendo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="student" className="gap-1">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Estudiante</span>
                  </TabsTrigger>
                  <TabsTrigger value="professor" className="gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Profesor</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-1">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </TabsTrigger>
                </TabsList>

                {["student", "professor", "admin"].map((role) => (
                  <TabsContent key={role} value={role}>
                    <form
                      onSubmit={(e) => handleLogin(e, role)}
                      className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`email-${role}`}>
                          Correo electrónico
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`email-${role}`}
                            type="email"
                            placeholder="tu@universidad.edu"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`password-${role}`}>Contraseña</Label>
                          <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:underline">
                            ¿Olvidaste tu contraseña?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`password-${role}`}
                            type="password"
                            placeholder="••••••••"
                            className="pl-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Iniciando sesión...
                          </>
                        ) : (
                          "Iniciar Sesión"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  ¿Primera vez? Contacta con tu profesor o administrador para
                  obtener acceso.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
