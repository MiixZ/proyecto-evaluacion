import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases CSS de Tailwind evitando conflictos
 * Fusiona clases condicionales y resuelve sobreescrituras
 * @param inputs - Clases CSS o valores condicionales
 * @returns String de clases CSS optimizado
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
