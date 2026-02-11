/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx}",
    "./components/**/*.{astro,html,js,jsx,ts,tsx}",
    "./layouts/**/*.{astro,html,js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      /* =========================
         BRAND COLORS
      ========================== */
      colors: {
        primary: "#1E3A8A",     // Bleu AMP / confiance
        secondary: "#FBBF24",   // Jaune AMP / énergie
        dark: "#111827",

        success: "#2563EB",     // bleu succès (paiement OK)
        danger: "#DC2626",      // rouge erreur
        warning: "#F59E0B",     // orange échec
        whatsapp: "#25D366",
      },

      /* =========================
         TYPOGRAPHY
      ========================== */
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "Inter", "sans-serif"],
      },

      /* =========================
         SHADOWS (cartes premium)
      ========================== */
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        strong: "0 20px 50px rgba(0,0,0,0.15)",
      },

      /* =========================
         ANIMATIONS
      ========================== */
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },

      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },

      /* =========================
         BORDER RADIUS
      ========================== */
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },

      /* =========================
         GRADIENTS (optionnel)
      ========================== */
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
        "gradient-danger":
          "linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)",
      },
    },
  },

  plugins: [],
};
