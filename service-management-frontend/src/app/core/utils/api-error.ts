import { HttpErrorResponse } from '@angular/common/http';

const DEFAULTS: Record<number, string> = {
  400: 'Requête invalide. Vérifiez les informations saisies.',
  401: 'Authentification requise. Reconnectez-vous.',
  403: "Vous n'avez pas le droit d'effectuer cette action.",
  404: 'Ressource introuvable.',
  409: "Cette action est en conflit avec l'état actuel des données.",
};

/**
 * Message d'erreur lisible pour l'utilisateur.
 *
 * Le backend lève des ResponseStatusException : avec la configuration Spring Boot par défaut,
 * le corps JSON ne contient PAS le message (seulement timestamp/status/error/path).
 * On s'appuie donc d'abord sur un éventuel `message` du corps, puis sur les messages
 * contextuels fournis par l'appelant (par code HTTP), puis sur des messages génériques.
 */
export function apiErrorMessage(err: unknown, byStatus: Partial<Record<number, string>> = {}): string {
  if (!(err instanceof HttpErrorResponse)) return 'Une erreur inattendue est survenue.';
  if (err.status === 0) {
    return "Impossible de joindre l'API. Vérifiez que le backend Spring Boot est démarré.";
  }
  const bodyMessage = typeof err.error === 'object' && err.error ? (err.error as { message?: unknown }).message : null;
  if (typeof bodyMessage === 'string' && bodyMessage.trim()) return bodyMessage;
  if (byStatus[err.status]) return byStatus[err.status]!;
  if (DEFAULTS[err.status]) return DEFAULTS[err.status];
  if (err.status >= 500) return 'Erreur interne du serveur. Réessayez dans un instant.';
  return `Erreur inattendue (${err.status}).`;
}
