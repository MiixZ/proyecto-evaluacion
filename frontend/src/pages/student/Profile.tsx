import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  FileText,
  Globe,
  Loader2,
  Save,
  GraduationCap,
  Users,
} from "lucide-react";

import { studentService as userService } from "@/services/student.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { Badge } from "@/components/ui/data/badge";
import { Separator } from "@/components/ui/layout/separator";
import { Alert, AlertDescription } from "@/components/ui/feedback/alert";
import { ScrollArea } from "@/components/ui/layout/scroll-area";
import { UpdateProfilePayload } from "@/types/user.type";
import { ProfileFormValues, getProfileSchema } from "@/schemas/profile.schema";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: userService.getMe,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(getProfileSchema(t)),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      bio: "",
      preferredLanguage: "es",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || "",
        bio: user.bio || "",
        preferredLanguage: (user.preferredLanguage as "es" | "en") || "es",
      });
    }
  }, [user, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfilePayload) => userService.updateMe(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["userProfile"], updatedUser);
      if (refreshUser) refreshUser();

      // Cambiar idioma inmediatamente si fue modificado
      if (updatedUser.preferredLanguage) {
        i18n.changeLanguage(updatedUser.preferredLanguage);
      }

      toast({
        title: t("profile_page.notifications.success_title"),
        description: t("profile_page.notifications.success_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("profile_page.notifications.error_title"),
        description: t("profile_page.notifications.error_desc"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {t("profile_page.errors.load_error")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("profile_page.title")}
        </h1>
        <p className="text-muted-foreground">{t("profile_page.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        <div className="space-y-6">
          {/* Tarjeta de Usuario */}
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="text-2xl bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="pt-2">
                <Badge variant="secondary" className="uppercase">
                  {t(`profile_page.roles.${user.role}`) || user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground text-center">
                {t("profile_page.user_card.id_label")}:{" "}
                <span className="font-mono">{user.id.substring(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-auto max-h-[400px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                {t("profile_page.sections.academic_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[300px] w-full px-6 pb-4">
                {user.enrollments && user.enrollments.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {user.enrollments.map((enrollment, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                        <div className="font-medium text-sm text-foreground">
                          {enrollment.subjectName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {enrollment.groupName}
                          </span>
                          <span>•</span>
                          <span className="font-mono">
                            {enrollment.academicYear}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    {t("profile_page.academic.empty")}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile_page.sections.personal_info")}</CardTitle>
            <CardDescription>
              {t("profile_page.sections.personal_info_desc")}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("profile_page.fields.first_name")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("profile_page.fields.last_name")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>{t("profile_page.fields.email")}</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={user.email}
                        disabled
                        className="pl-9 bg-muted/50"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {t("profile_page.fields.email_readonly")}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile_page.fields.phone")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={t("profile_page.placeholders.phone")}
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile_page.fields.bio")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea
                            placeholder={t("profile_page.placeholders.bio")}
                            className="pl-9 min-h-[100px] resize-none"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile_page.fields.language")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <SelectValue
                                placeholder={t(
                                  "profile_page.placeholders.language"
                                )}
                              />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="es">
                            {t("profile_page.languages.es")}
                          </SelectItem>
                          <SelectItem value="en">
                            {t("profile_page.languages.en")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6 bg-muted/5">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("profile_page.buttons.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("profile_page.buttons.save")}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
