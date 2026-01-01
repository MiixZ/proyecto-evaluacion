import { useState } from "react";
import { useStore } from "@nanostores/react";
import { $authStore, logout } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Code2,
  LayoutDashboard,
  BookOpen,
  FileCode,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BarChart3,
  Shield,
} from "lucide-react";

const MENU_ITEMS = {
  student: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/subjects", icon: BookOpen, label: "Asignaturas" },
    { href: "/dashboard/exercises", icon: FileCode, label: "Ejercicios" },
    { href: "/dashboard/progress", icon: BarChart3, label: "Mi Progreso" },
  ],
  teacher: [
    { href: "/professor", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/professor/students", icon: Users, label: "Estudiantes" },
    { href: "/professor/exercises", icon: FileCode, label: "Ejercicios" },
    { href: "/professor/analytics", icon: BarChart3, label: "Estadísticas" },
  ],
  admin: [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Usuarios" },
    { href: "/admin/degrees", icon: GraduationCap, label: "Titulaciones" },
    { href: "/admin/subjects", icon: BookOpen, label: "Asignaturas" },
    { href: "/admin/exercises", icon: FileCode, label: "Ejercicios" },
    { href: "/admin/security", icon: Shield, label: "Seguridad" },
  ],
};

export const Sidebar = ({ currentPath }: { currentPath: string }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated } = useStore($authStore);

  if (!isAuthenticated || !user) return null;

  const role = user.role || "student";
  const links =
    MENU_ITEMS[role as keyof typeof MENU_ITEMS] || MENU_ITEMS.student;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <a
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-primary">
            <Code2 className="h-6 w-6 shrink-0" />
            <span>CodeEval</span>
          </a>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted/20 text-muted-foreground transition-colors">
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            currentPath === link.href ||
            currentPath.startsWith(`${link.href}/`);

          return (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted/20 hover:text-foreground"
              )}
              title={collapsed ? link.label : undefined}>
              <link.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{link.label}</span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Footer Usuario */}
      <div className="p-3 border-t border-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
          <Avatar className="h-9 w-9 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {user.firstName?.charAt(0).toUpperCase()}
              {user.lastName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user.role}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start h-8 px-2"
              asChild>
              <a href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Ajustes
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};
