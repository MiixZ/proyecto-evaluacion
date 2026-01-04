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
  Users,
  Settings,
  LogOut,
  ShieldAlert,
  GraduationCap,
  FileCode,
  Library,
  BarChart3,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/overlay/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/auth.types";

export function AppSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const navItems = {
    student: [
      {
        title: t("sidebar.menu.dashboard"),
        url: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: t("sidebar.menu.subjects"),
        url: "/dashboard/subjects",
        icon: Library,
      },
      {
        title: t("sidebar.menu.exercises"),
        url: "/dashboard/exercises",
        icon: FileCode,
      },
      {
        title: t("sidebar.menu.progress"),
        url: "/dashboard/progress",
        icon: BarChart3,
      },
      {
        title: t("sidebar.menu.submissions"),
        url: "/dashboard/submissions",
        icon: BookOpen,
      },
    ],
    professor: [
      {
        title: t("sidebar.menu.professor_panel"),
        url: "/dashboard",
        icon: GraduationCap,
        exact: true,
      },
      {
        title: t("sidebar.menu.groups"),
        url: "/dashboard/groups",
        icon: Users,
      },
      {
        title: t("sidebar.menu.create_exercise"),
        url: "/dashboard/create",
        icon: BookOpen,
      },
    ],
    admin: [
      {
        title: t("sidebar.menu.admin_panel"),
        url: "/dashboard",
        icon: ShieldAlert,
        exact: true,
      },
      { title: t("sidebar.menu.users"), url: "/dashboard/users", icon: Users },
    ],
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Usuario";

  const showProfessorMenu =
    user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;
  const showAdminMenu = user?.role === UserRole.ADMIN;
  const showStudentMenu = user?.role === UserRole.STUDENT;

  const isActiveLink = (url: string, exact: boolean = false) => {
    if (exact) return pathname === url;
    return pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 py-2 text-sidebar-accent-foreground">
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

      <SidebarContent>
        {/* Menú Estudiante */}
        {showStudentMenu && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.labels.student")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.student.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveLink(item.url, item.exact)}
                      tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Menú Profesor */}
        {showProfessorMenu && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("sidebar.labels.professor")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.professor.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveLink(item.url, item.exact)}
                      tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Menú Admin */}
        {showAdminMenu && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("auth.roles.admin")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.admin.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveLink(item.url, item.exact)}
                      tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.profileImageUrl || ""}
                      alt={displayName}
                    />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {displayName}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <Settings className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}>
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{t("profile_page.title")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer">
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
