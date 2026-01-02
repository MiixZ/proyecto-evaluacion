import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/layout/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/feedback/sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/layout/breadcrumb";

export default function DashboardLayout() {
  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Header Fijo con Breadcrumbs */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border mx-2" />{" "}
            {/* Separador vertical */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">CodeEval</BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.map((segment, index) => {
                  const isLast = index === pathSegments.length - 1;
                  const path = `/${pathSegments.slice(0, index + 1).join("/")}`;

                  return (
                    <div key={path} className="flex items-center">
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="capitalize">
                            {segment}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            href={path}
                            className="capitalize hidden md:block">
                            {segment}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Área de Contenido Principal */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min mt-4">
            <Outlet />
          </div>
        </div>
      </SidebarInset>

      <Toaster />
    </SidebarProvider>
  );
}
