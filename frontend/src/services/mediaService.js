import request from "./apiClient";

export const fetchMedia = () => request("/media");
export const fetchMediaById = (id) => request(`/media/${id}`);
export const uploadMedia = ({ blogId, file, altText = "", metadata = {} }) => {
  const formData = new FormData();

  // FR: Le backend refuse les images au-dessus de 2 Mo via multer.
  // EN: The backend rejects images above 2 MB through multer.
  formData.append("blog_id", blogId);
  formData.append("alt_text", altText);
  formData.append("metadata_json", JSON.stringify(metadata));
  formData.append("file", file);

  return request("/media", {
    method: "POST",
    body: formData,
  });
};
export const deleteMedia = (id) => request(`/media/${id}`, { method: "DELETE" });
