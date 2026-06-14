import api from "./api.js";

export const fetchFileBlob = async (fileId) => {
  const response = await api.get(
    `/files/${fileId.toString()}`,
    { responseType: "blob" }
  );

  return response.data;
};
