import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/forms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { useAuth } from "@/hooks/use-auth";

export default function Unauthorized() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    // Redirigir al dashboard principal basado en su rol
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {t("unauthorized.title")}
            </CardTitle>
            <CardDescription className="mt-2">
              {t("unauthorized.description")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("unauthorized.current_user")}
            </p>
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("unauthorized.current_role")}: {t(`auth.roles.${user?.role}`)}
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("unauthorized.go_to_dashboard")}
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full">
              {t("unauthorized.go_back")}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {t("unauthorized.contact_admin")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
