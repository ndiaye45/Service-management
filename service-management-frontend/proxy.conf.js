// Proxy de développement : le navigateur appelle http://localhost:4200/api/... et
// Angular relaie vers Spring Boot. Les routes du backend commencent déjà par /api : aucun rewrite.
// Pour cibler un autre hôte :  API_TARGET=http://localhost:9090 npm start
const target = process.env.API_TARGET || 'http://localhost:8080';

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
  },
};
