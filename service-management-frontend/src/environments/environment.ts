// URL de base de l'API Spring Boot.
// En développement, '/api' est relayé vers le backend par le proxy Angular (proxy.conf.js),
// ce qui évite toute configuration CORS côté Spring (le backend n'en a aucune).
// En production, remplacez par l'URL absolue de l'API ou servez le frontend derrière le même domaine.
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  currency: 'EUR'
};
