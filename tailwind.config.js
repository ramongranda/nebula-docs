/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 👈 necesario para poder cambiar claro/oscuro
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,svelte,md,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
