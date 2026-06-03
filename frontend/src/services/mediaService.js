// Import de la fonction apiRequest (export par défaut) pour effectuer des appels HTTP vers l'API
import request from "./apiClient";

// Récupère la liste complète de tous les médias (images, fichiers) stockés sur la plateforme
export const fetchMedia = () => request("/media");

// Récupère un média spécifique par son identifiant
export const fetchMediaById = (id) => request(`/media/${id}`);

// Upload d'un fichier média associé à un blog spécifique
// Paramètres destructurés : blogId (id du blog), file (fichier), altText (texte alt), metadata (données extra)
export const uploadMedia = ({ blogId, file, altText = "", metadata = {} }) => {
  // Création d'un FormData pour l'envoi multipart/form-data (obligatoire pour les fichiers)
  const formData = new FormData();

  // FR: Le backend refuse les images au-dessus de 2 Mo via multer.
  // EN: The backend rejects images above 2 MB through multer.
  // Association du fichier avec le blog cible (blog_id requis par le backend)
  formData.append("blog_id", blogId);
  // Texte alternatif du média pour l'accessibilité (attribut alt des images)
  formData.append("alt_text", altText);
  // Métadonnées JSON supplémentaires sérialisées (ex : dimensions, auteur, copyright)
  formData.append("metadata_json", JSON.stringify(metadata));
  // Fichier binaire à uploader (doit être le dernier champ pour la compatibilité multer)
  formData.append("file", file);

  return request("/media", {
    method: "POST",  // POST : création d'une nouvelle ressource média
    body: formData,  // FormData : le navigateur définit automatiquement Content-Type multipart
  });
};

// Supprime définitivement un fichier média identifié par son id (requête DELETE)
export const deleteMedia = (id) => request(`/media/${id}`, { method: "DELETE" });
