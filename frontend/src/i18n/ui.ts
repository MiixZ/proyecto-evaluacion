export const languages = {
  es: "Español",
  en: "English",
};

export const defaultLang = "es";

export const ui = {
  es: {
    "auth.login.title": "Iniciar Sesión",
    "auth.login.subtitle": "Ingresa tus credenciales para acceder",
    "auth.email.label": "Correo Institucional",
    "auth.password.label": "Contraseña",
    "auth.submit": "Entrar",
    "auth.loading": "Cargando...",
    "auth.error.generic": "Ocurrió un error inesperado",
    "nav.dashboard": "Panel Principal",
    "nav.profile": "Perfil",
    "nav.logout": "Cerrar Sesión",
  },
  en: {
    "auth.login.title": "Sign In",
    "auth.login.subtitle": "Enter your credentials to access",
    "auth.email.label": "Institutional Email",
    "auth.password.label": "Password",
    "auth.submit": "Sign In",
    "auth.loading": "Loading...",
    "auth.error.generic": "An unexpected error occurred",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "nav.logout": "Logout",
  },
} as const;

export type TranslationKey = keyof typeof ui.es;
