/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: "#0f172a", // Navy Blue
                    secondary: "#334155", // Slate
                    accent: "#2563eb", // Royal Blue
                    success: "#10b981", // Emerald Green
                    background: "#f8fafc", // Off-White
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
