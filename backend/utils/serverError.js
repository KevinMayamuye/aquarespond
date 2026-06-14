export const serverError = (res, error) => {
  console.error(error);

  return res.status(500).json({
    message: "Server error",
  });
};