import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import {
  Code2,
  Mail,
  Lock,
  User,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const features = [
    t("landing.login_features.evaluation"),
    t("landing.login_features.feedback"),
    t("landing.login_features.tracking"),
    t("landing.login_features.languages"),
  ];

  const handleLogin = async (e: React.FormEvent, role: string) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      const roleLabel = t(`auth.roles.${role}`);
      toast({
        title: t("auth.login.success_title"),
        description: t("auth.login.success_desc", { role: roleLabel }),
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
      {/* Left Panel - Rediseñado para "cuadrar" el contenido */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative overflow-hidden border-r border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />

        <div className="relative z-10 flex flex-col justify-center h-full px-12 xl:px-24 w-full">
          {/* Header Section */}
          <div className="mb-12">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-8 shadow-xl shadow-primary/20">
              <Code2 className="h-8 w-8 text-primary-foreground" />
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold mb-6 tracking-tight text-foreground">
              {t("app.name")}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              {t("landing.login_description")}
            </p>
          </div>

          {/* Features List - Ahora con tarjetas sutiles para dar estructura */}
          <div className="space-y-4 max-w-lg">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-background/40 border border-border/50 backdrop-blur-sm transition-all hover:bg-background/60 hover:border-primary/20">
                <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-foreground/90 font-medium">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible solo en móvil) */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-8 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Code2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold block">{t("app.name")}</span>
              <span className="text-sm text-muted-foreground">
                {t("landing.login_description")}
              </span>
            </div>
          </div>

          <Card className="border-border/50 shadow-2xl shadow-primary/5">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">
                {t("auth.login.title")}
              </CardTitle>
              <CardDescription>{t("auth.login.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-muted/50">
                  <TabsTrigger
                    value="student"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("auth.roles.student")}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="professor"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("auth.roles.professor")}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="admin"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("auth.roles.admin")}
                    </span>
                  </TabsTrigger>
                </TabsList>

                {["student", "professor", "admin"].map((role) => (
                  <TabsContent key={role} value={role} className="mt-0">
                    <form
                      onSubmit={(e) => handleLogin(e, role)}
                      className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`email-${role}`}>
                          {t("auth.login.email")}
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id={`email-${role}`}
                            type="email"
                            placeholder={t("auth.login.email_placeholder")}
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`password-${role}`}>
                            {t("auth.login.password")}
                          </Label>
                          <Link
                            to="/forgot-password"
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                            {t("auth.login.forgot_password")}
                          </Link>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                        className="w-full font-medium h-11"
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
                            {t("auth.login.submitting")}
                          </>
                        ) : (
                          t("auth.login.submit")
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>{t("auth.login.no_account")}</p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link
              to="/"
              className="text-foreground/80 hover:text-primary transition-colors font-medium flex items-center justify-center gap-2">
              ← {t("auth.login.back_home")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
