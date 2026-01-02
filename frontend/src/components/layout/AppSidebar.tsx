import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/layout/sidebar";
import {
  Code2,
  LayoutDashboard,
  BookOpen,
  Send,
  Users,
  Settings,
  LogOut,
  ShieldAlert,
  GraduationCap,
  FileCode,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { Button } from "@/components/ui/forms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/overlay/dropdown-menu";

export function AppSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Estructura de navegación con traducción dinámica
  const navItems = {
    student: [
      {
        title: t("sidebar.menu.dashboard"),
        url: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: t("sidebar.menu.exercises"),
        url: "/dashboard/exercises",
        icon: FileCode,
      },
      {
        title: t("sidebar.menu.submissions"),
        url: "/dashboard/submissions",
        icon: Send,
      },
    ],
    professor: [
      {
        title: t("sidebar.menu.professor_panel"),
        url: "/dashboard/professor",
        icon: GraduationCap,
      },
      {
        title: t("sidebar.menu.groups"),
        url: "/dashboard/professor/groups",
        icon: Users,
      },
      {
        title: t("sidebar.menu.create_exercise"),
        url: "/dashboard/professor/create",
        icon: BookOpen,
      },
    ],
    admin: [
      {
        title: t("sidebar.menu.admin_panel"),
        url: "/dashboard/admin",
        icon: ShieldAlert,
      },
      { title: t("sidebar.menu.users"), url: "/dashboard/admin/users", icon: Users },
    ],
  };

  const user = {
    name: "Ismael Díaz",
    email: "ismael@codeeval.dev",
    role: "Student",
    avatar: "/placeholder.svg",
  };

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header con Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2 text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Code2 className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{t("app.name")}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("sidebar.header")}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Contenido Principal */}
      <SidebarContent>
        {/* Menú Estudiante - Siempre visible o condicional */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.labels.student")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.student.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <NavLink to={item.url} end={item.exact}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menú Profesor */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.labels.professor")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.professor.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <NavLink to={item.url}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer con Usuario */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">ID</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <Settings className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("sidebar.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
