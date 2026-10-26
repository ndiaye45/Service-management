export const environment = {
  production: true,
  // Même origine par défaut : à servir derrière un reverse proxy qui relaie /api vers Spring Boot.
  // Pour une API sur un autre domaine, mettre ici l'URL absolue (le backend devra alors autoriser CORS).
  apiBaseUrl: '/api',
  currency: 'EUR'
};
