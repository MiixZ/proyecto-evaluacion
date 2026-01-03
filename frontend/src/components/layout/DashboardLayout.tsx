import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/layout/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/feedback/sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/layout/breadcrumb";
import { useTranslation } from "react-i18next";

export default function DashboardLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  const pathSegments = location.pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      {/* El Sidebar izquierdo */}
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 z-10">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border mx-2" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">CodeEval</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.map((segment, index) => {
                  const isLast = index === pathSegments.length - 1;
                  const path = `/${pathSegments.slice(0, index + 1).join("/")}`;

                  const segmentName =
                    segment.charAt(0).toUpperCase() + segment.slice(1);

                  return (
                    <div key={path} className="flex items-center">
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{segmentName}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild className="hidden md:block">
                            <Link to={path}>{segmentName}</Link>
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

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-xl bg-muted/10 md:min-h-min mt-4">
            <Outlet />
          </div>
        </div>
      </SidebarInset>

      <Toaster />
    </SidebarProvider>
  );
}
