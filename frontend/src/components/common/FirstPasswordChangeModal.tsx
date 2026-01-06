import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay/dialog";
import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import { Alert, AlertDescription } from "@/components/ui/feedback/alert";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { userService } from "@/services/user.service";
import { FirstPasswordChangePayload } from "@/types/user.type";
import { useTranslation } from "react-i18next";

interface FirstPasswordChangeModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function FirstPasswordChangeModal({
  open,
  onSuccess,
}: FirstPasswordChangeModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FirstPasswordChangePayload>();

  const newPassword = watch("newPassword");

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: (data: FirstPasswordChangePayload) =>
      userService.firstPasswordChange(data.newPassword, data.confirmPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      reset();
      setTimeout(() => {
        onSuccess();
      }, 1500);
    },
  });

  const onSubmit = (data: FirstPasswordChangePayload) => {
    mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              {t("first_password_change.title", "Establece tu contraseña")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {t(
              "first_password_change.description",
              "Por seguridad, debes establecer una nueva contraseña antes de continuar usando la plataforma."
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nueva contraseña */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t("first_password_change.new_password", "Nueva contraseña")} *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder={t(
                  "first_password_change.password_placeholder",
                  "Mínimo 8 caracteres"
                )}
                disabled={isPending || isSuccess}
                {...register("newPassword", {
                  required: t(
                    "first_password_change.password_required",
                    "La contraseña es requerida"
                  ),
                  minLength: {
                    value: 8,
                    message: t(
                      "first_password_change.password_min_length",
                      "La contraseña debe tener al menos 8 caracteres"
                    ),
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: t(
                      "first_password_change.password_pattern",
                      "Debe contener mayúsculas, minúsculas y números"
                    ),
                  },
                })}
                className={errors.newPassword ? "border-destructive" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending || isSuccess}>
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t(
                "first_password_change.confirm_password",
                "Confirmar contraseña"
              )}{" "}
              *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder={t(
                  "first_password_change.confirm_placeholder",
                  "Repite tu contraseña"
                )}
                disabled={isPending || isSuccess}
                {...register("confirmPassword", {
                  required: t(
                    "first_password_change.confirm_required",
                    "Debes confirmar la contraseña"
                  ),
                  validate: (value) =>
                    value === newPassword ||
                    t(
                      "first_password_change.passwords_no_match",
                      "Las contraseñas no coinciden"
                    ),
                })}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={isPending || isSuccess}>
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Error general */}
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message ||
                  t(
                    "first_password_change.error",
                    "Error al cambiar la contraseña. Inténtalo de nuevo."
                  )}
              </AlertDescription>
            </Alert>
          )}

          {/* Éxito */}
          {isSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {t(
                  "first_password_change.success",
                  "Contraseña establecida correctamente. Redirigiendo..."
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Botón */}
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isSuccess}>
            {isPending
              ? t("first_password_change.saving", "Guardando...")
              : isSuccess
              ? t("first_password_change.success_short", "¡Listo!")
              : t("first_password_change.submit", "Establecer contraseña")}
          </Button>

          {/* Advertencia */}
          <div className="pt-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t(
                  "first_password_change.warning",
                  "Esta acción es obligatoria para acceder a la plataforma."
                )}
              </AlertDescription>
            </Alert>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
