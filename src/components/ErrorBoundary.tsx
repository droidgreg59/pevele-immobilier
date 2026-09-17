"use client";

import { Component, type ReactNode } from "react";
import { reportClientError } from "@/lib/report-error";

/**
 * Frontière d'erreur locale générique — isole un composant non-critique
 * (amélioration progressive) pour qu'une exception dedans ne fasse jamais
 * tomber toute la page (global-error.tsx). Rend `null` en cas d'erreur :
 * le reste de la page continue de fonctionner normalement.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    void reportClientError(error, { kind: "error-boundary" });
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
