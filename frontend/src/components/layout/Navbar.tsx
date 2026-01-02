import { Link, useLocation } from "react-router-dom";
import { Code2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/forms/button";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-primary">
            <Code2 className="h-7 w-7" />
            <span>CodeEval</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-foreground/80"
              }`}>
              Inicio
            </Link>
            <Link
              to="/features"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/features") ? "text-primary" : "text-foreground/80"
              }`}>
              Características
            </Link>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/about") ? "text-primary" : "text-foreground/80"
              }`}>
              Acerca de
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Comenzar</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-foreground/80 hover:text-primary"
                onClick={() => setIsOpen(false)}>
                Inicio
              </Link>
              <Link
                to="/features"
                className="text-sm font-medium text-foreground/80 hover:text-primary"
                onClick={() => setIsOpen(false)}>
                Características
              </Link>
              <Link
                to="/about"
                className="text-sm font-medium text-foreground/80 hover:text-primary"
                onClick={() => setIsOpen(false)}>
                Acerca de
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link to="/login">Comenzar</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
