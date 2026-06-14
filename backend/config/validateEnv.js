const required = ["MONGO_URI", "JWT_SECRET"];

export const validateEnv = () => {
  const missing = required.filter(
    (key) => !process.env[key]?.trim()
  );

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }
};
