/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050608",
        fog: "#9bb7a5",
      },
      boxShadow: {
        glass: "0 20px 70px rgba(0,0,0,0.65)",
        portal: "0 0 70px rgba(120,180,160,0.18)",
      },
      keyframes: {
        portalPulse: {
          "0%,100%": { transform: "scale(1)", opacity: "0.92" },
          "50%": { transform: "scale(1.02)", opacity: "1" },
        },
        mistDrift: {
          "0%": { transform: "translateX(0) translateY(0)", opacity: "0.55" },
          "50%": { transform: "translateX(-2%) translateY(1%)", opacity: "0.72" },
          "100%": { transform: "translateX(0) translateY(0)", opacity: "0.55" },
        },
        shimmer: {
          "0%,100%": { opacity: "0.18" },
          "50%": { opacity: "0.35" },
        },
        softReveal: {
          "0%": { opacity: "0", filter: "brightness(1.8) blur(1px)" },
          "100%": { opacity: "1", filter: "brightness(1) blur(0px)" },
        },
        cursorBlink: {
          "0%,49%": { opacity: "1" },
          "50%,100%": { opacity: "0" },
        },
      },
      animation: {
        portalPulse: "portalPulse 7.5s ease-in-out infinite",
        mistDrift: "mistDrift 22s ease-in-out infinite",
        shimmer: "shimmer 7.5s ease-in-out infinite",
        softReveal: "softReveal 1.1s ease-out forwards",
        cursorBlink: "cursorBlink 1.1s steps(1) infinite",
      },
      backdropBlur: {
        xl: "24px",
      },
    },
  },
  plugins: [],
};
