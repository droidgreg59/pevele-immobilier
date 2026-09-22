import { redirect } from "next/navigation";

/**
 * Ancienne adresse de « Mes favoris », déplacée dans le hub particulier
 * (/compte/particulier/favoris) pour rester dans la navigation latérale au
 * lieu d'en sortir. Redirection conservée pour les liens déjà enregistrés
 * (favoris de navigateur, historique) plutôt que de les casser.
 */
export default function CompteFavorisRedirect() {
  redirect("/compte/particulier/favoris");
}
