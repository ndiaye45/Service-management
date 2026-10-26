import { HttpErrorResponse } from '@angular/common/http';

/**
 * Transforme une erreur HTTP en message lisible.
 * Priorité : message contextuel fourni par l'appelant > message du backend
 * (présent uniquement si Spring l'expose) > message générique par code HTTP.
 */
export function httpErrorMessage(err: unknown, overrides: Partial<Record<number, string>> = {}): string {
  if (!(err instanceof HttpErrorResponse)) return 'Une erreur inattendue est survenue.';
  if (err.status === 0) return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
  const override = overrides[err.status];
  if (override) return override;

  const backend = typeof err.error?.message === 'string' ? err.error.message.trim() : '';
  if (backend && [400, 403, 404, 409].includes(err.status)) return backend;

  switch (err.status) {
    case 400: return 'Les données envoyées sont invalides. Vérifiez le formulaire.';
    case 401: return 'Votre session a expiré ou vos identifiants sont incorrects.';
    case 403: return "Vous n'avez pas l'autorisation d'effectuer cette action.";
    case 404: return 'Élément introuvable.';
    case 409: return 'Cette action entre en conflit avec l’état actuel des données.';
    default: return err.status >= 500 ? 'Erreur du serveur. Réessayez dans un instant.' : 'La requête a échoué.';
  }
}
