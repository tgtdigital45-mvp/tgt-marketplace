/** @type {import('tailwindcss').Config} */
module.exports = {
    presets: [require("nativewind/preset")],
    content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: "#0f172a",    /* Slate 900 */
                    secondary: "#475569",  /* Slate 600 */
                    accent: "#2563eb",     /* Blue 600 */
                    background: "#f8fafc", /* Slate 50 */
                    surface: "#ffffff",
                    success: "#10b981",    /* Emerald Green */
                },
            },
            borderRadius: {
                box: "0.5rem",
            },
            fontFamily: {
                sans: ["Inter", "Roboto", "sans-serif"],
            },
        },
    },
    plugins: [],
};
