// Importation du module natif Node.js pour manipuler les chemins de fichiers (join, resolve, dirname)
import path from "node:path";
// fileURLToPath : convertit une URL ESM (import.meta.url) en chemin absolu système de fichiers
import { fileURLToPath } from "node:url";

// Plugin Vite pour Tailwind CSS v4 — intègre Tailwind directement dans le pipeline de build Vite
import tailwindcss from "@tailwindcss/vite";
// defineConfig : utilitaire Vite qui fournit l'autocomplétion TypeScript sur l'objet de configuration
import { defineConfig } from "vite";
// Plugin officiel Vite pour React : active le Fast Refresh (rechargement à chaud des composants sans perte d'état)
import react from "@vitejs/plugin-react";

// Reconstitution de __filename : chemin absolu du fichier courant
// (import.meta.url n'est pas disponible directement comme __filename en CommonJS)
const __filename = fileURLToPath(import.meta.url);
// Reconstitution de __dirname : répertoire contenant le fichier courant
// (non disponible nativement en modules ESM, contrairement à CommonJS)
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
// Export de la configuration Vite complète du projet
export default defineConfig({
  // Tableau des plugins actifs pour ce projet
  plugins: [
    react(),        // Active React Fast Refresh et la transformation JSX → JS
    tailwindcss(),  // Intègre Tailwind CSS v4 via le plugin officiel Vite
  ],
  // Configuration du serveur de développement local
  server: {
    host: "localhost",   // Adresse d'écoute du serveur (uniquement accessible en local)
    port: 5173,          // Port d'écoute du serveur de développement
    strictPort: true,    // Si le port 5173 est occupé, Vite arrête au lieu de chercher un autre port
    // Configuration du Hot Module Replacement (rechargement à chaud sans rechargement de page entière)
    hmr: {
      host: "localhost",   // Hôte que le client HMR utilise pour se connecter au serveur WebSocket
      clientPort: 5173,    // Port côté client pour la connexion WebSocket HMR
      protocol: "ws",      // Protocole WebSocket non sécurisé (ws:// au lieu de wss://)
    },
  },
  // Configuration de la résolution des modules — définit des alias d'imports raccourcis
  resolve: {
    alias: {
      // @assets → src/assets : ressources statiques (images, icônes, polices locales...)
      "@assets": path.resolve(__dirname, "src/assets"),
      // @components → src/components : composants React réutilisables
      "@components": path.resolve(__dirname, "src/components"),
      // @context → src/context : contextes React (AuthContext, ThemeContext, ToastContext...)
      "@context": path.resolve(__dirname, "src/context"),
      // @hooks → src/hooks : hooks personnalisés React (useAuth, useFetch, useDebounce, useTheme...)
      "@hooks": path.resolve(__dirname, "src/hooks"),
      // @layouts → src/components/layout : composants de mise en page (PublicLayout, DashboardLayout...)
      "@layouts": path.resolve(__dirname, "src/components/layout"),
      // @pages → src/pages : pages React associées aux routes de l'application
      "@pages": path.resolve(__dirname, "src/pages"),
      // @services → src/services : fonctions d'appel API (apiClient, authService, blogsService...)
      "@services": path.resolve(__dirname, "src/services"),
      // @styles → src/styles : fichiers CSS globaux (variables, thèmes, utilitaires, animations...)
      "@styles": path.resolve(__dirname, "src/styles"),
      // @utils → src/utils : fonctions utilitaires pures (roleRedirect, formatDate, validation...)
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
});
