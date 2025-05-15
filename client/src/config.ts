const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
};

console.log("API URL:", config.apiUrl);

export default config;
