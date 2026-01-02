import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Code2 } from "lucide-react";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-16">
        {" "}
        <Outlet />
      </main>

      <footer className="py-8 border-t border-border bg-card/30 mt-auto">
        <div className="container px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Code2 className="h-5 w-5" />
            <span className="text-sm">
              © {new Date().getFullYear()} CodeEval.
            </span>
          </div>
          <div className="flex gap-4">{/* Social links o legales */}</div>
        </div>
      </footer>
    </div>
  );
};
