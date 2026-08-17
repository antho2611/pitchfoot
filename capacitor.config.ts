import type { CapacitorConfig } from "@capacitor/cli";

// L'app native charge directement le site déployé sur Render — pas de build
// embarqué séparé à maintenir, le contenu affiché est toujours la version en
// ligne. webDir est requis par Capacitor même en mode "remote URL" ; il ne
// sert qu'à copier une page de secours si jamais le réseau est indisponible.
const config: CapacitorConfig = {
  appId: "com.pitchpro.app",
  appName: "PitchPro",
  webDir: "public",
  server: {
    url: "https://pitchfoot.onrender.com",
    cleartext: false,
  },
};

export default config;
