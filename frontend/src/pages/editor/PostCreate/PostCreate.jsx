// Icônes lucide-react : validation, aperçu, sauvegarde
import { CheckCircle2, Eye, Save } from "lucide-react";
// useEffect : exécute du code après le rendu (ex : appel API au montage)
// useMemo : mémoïse une valeur calculée pour éviter des recalculs inutiles
// useState : déclare des variables d'état locales du composant
import { useEffect, useMemo, useState } from "react";

// Composants UI réutilisables du formulaire
import Button from "@components/ui/Button/Button";
import Input from "@components/ui/Input/Input";
import Select from "@components/ui/Select/Select";
import Textarea from "@components/ui/Textarea/Textarea";
// useAuth : hook exposant l'utilisateur connecté (id, rôle, etc.)
import { useAuth } from "@hooks/useAuth";
// Services API : fonctions qui appellent les endpoints backend
import { getBlogs } from "@services/blogsService";       // GET /blogs
import { uploadMedia } from "@services/mediaService";    // POST /media (upload image)
import { createPost } from "@services/postsService";     // POST /posts

// Styles CSS propres à la page de création d'article
import "./PostCreate.css";

// État initial du formulaire (valeurs vides par défaut)
const initialForm = {
  blog_id: "",   // Identifiant du blog de destination
  content: "",   // Contenu principal de l'article
  excerpt: "",   // Résumé / accroche affiché dans les listes
  slug: "",      // URL-friendly de l'article
  status: "draft", // Statut initial : brouillon
  title: "",     // Titre de l'article
};

// Composant page : formulaire de création d'un nouvel article
function PostCreate() {
  // user : objet utilisateur connecté, utilisé pour l'auteur et les permissions
  const { user } = useAuth();
  // blogs : liste des blogs disponibles pour l'affectation de l'article
  const [blogs, setBlogs] = useState([]);
  // formData : données actuelles de tous les champs du formulaire
  const [formData, setFormData] = useState(initialForm);
  // coverFile : fichier image sélectionné pour la couverture de l'article
  const [coverFile, setCoverFile] = useState(null);
  // feedback : message de retour à l'utilisateur (succès ou erreur) avec son ton
  const [feedback, setFeedback] = useState({ tone: "", message: "" });
  // isSubmitting : bloque le bouton pendant la soumission pour éviter les doubles envois
  const [isSubmitting, setIsSubmitting] = useState(false);

  // statusOptions : options du sélecteur de statut, mémoïsées selon le rôle de l'utilisateur
  // useMemo évite de recalculer si user?.role ne change pas entre les rendus
  const statusOptions = useMemo(
    () => [
      { label: "Brouillon", value: "draft" },
      { label: "En cours de vérification", value: "pending" },
      // Les editors ne peuvent pas publier directement → option désactivée
      { label: "Publié", value: "published", disabled: user?.role === "editor" },
    ],
    [user?.role]
  );

  // useEffect : exécuté une seule fois au montage du composant (tableau de dépendances vide [])
  // Charge la liste des blogs disponibles depuis l'API
  useEffect(() => {
    getBlogs()
      .then((rows) => {
        // Normalisation : l'API peut retourner un tableau direct ou un objet {data: [...]}
        const list = Array.isArray(rows) ? rows : rows?.data || [];
        setBlogs(list);
        // Pré-sélectionne le premier blog disponible si aucun n'est encore choisi
        setFormData((current) => ({
          ...current,
          blog_id: current.blog_id || String(list[0]?.id || ""),
        }));
      })
      .catch(() => {
        setFeedback({
          tone: "error",
          message: "Impossible de charger les blogs disponibles.",
        });
      });
  }, []);

  // Gestionnaire générique des champs de texte et select
  // Lit name + value depuis l'événement et met à jour l'état formData
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Gestionnaire spécifique pour le champ image de couverture
  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // FR: Meme limite cote client que cote API pour un retour immediat.
    // EN: Same client-side limit as the API for immediate feedback.
    // Validation de taille : 2 Mo maximum (même règle que le backend)
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ tone: "error", message: "L'image ne doit pas depasser 2 Mo." });
      // Réinitialise le champ fichier pour permettre une nouvelle sélection
      event.target.value = "";
      return;
    }

    // Stocke le fichier valide dans l'état pour l'envoyer à l'upload après création
    setCoverFile(file);
  };

  // Gestionnaire de soumission du formulaire (async pour les appels API séquentiels)
  const handleSubmit = async (event) => {
    // Empêche le rechargement de la page par le comportement natif du formulaire
    event.preventDefault();
    setFeedback({ tone: "", message: "" });
    // Récupère le statut depuis le bouton cliqué (value="draft" ou "validate")
    const submitStatus = event.nativeEvent.submitter?.value || formData.status;
    // Si le bouton "Enregistrer brouillon" est cliqué, force le statut "draft"
    const status = submitStatus === "draft" ? "draft" : formData.status;

    // Validation minimale côté client avant d'envoyer à l'API
    if (!formData.blog_id || !formData.title || !formData.slug || !formData.content) {
      setFeedback({
        tone: "error",
        message: "Choisis un blog puis renseigne au minimum le titre, le slug et le contenu.",
      });
      return;
    }

    // Active l'état de chargement pour désactiver les boutons
    setIsSubmitting(true);

    try {
      // Appel API : crée l'article avec toutes les données du formulaire
      await createPost({
        ...formData,
        author_id: user?.id,
        blog_id: Number(formData.blog_id),
        status,
        // published_at : date de publication si statut "published", sinon null
        published_at:
          status === "published"
            ? new Date().toISOString().slice(0, 19).replace("T", " ")
            : null,
      });

      // Si une image de couverture a été sélectionnée, l'uploader séparément
      if (coverFile) {
        await uploadMedia({
          blogId: formData.blog_id,
          file: coverFile,
          altText: formData.title,
          metadata: { usage: "post-cover", slug: formData.slug },
        });
      }

      // Message de succès adapté selon le statut soumis
      setFeedback({
        tone: "success",
        message:
          status === "pending"
            ? "Article soumis à validation."
            : "Article enregistré.",
      });
    } catch (error) {
      // Affichage du message d'erreur retourné par l'API ou message par défaut
      setFeedback({
        tone: "error",
        message: error.message || "Impossible d'enregistrer l'article.",
      });
    } finally {
      // Toujours désactiver l'état de chargement, qu'il y ait succès ou erreur
      setIsSubmitting(false);
    }
  };

  return (
    // Section principale de la page de création d'article
    <section className="by-page post-form-page">

      {/* En-tête : titre de la page + bouton de validation global */}
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">Création</div>
          <h1>Composer un nouvel article.</h1>
        </div>
        {/* Bouton submit externe lié au formulaire via l'attribut form="post-create-form" */}
        <Button disabled={isSubmitting} form="post-create-form" icon={CheckCircle2} type="submit">
          {isSubmitting ? "Validation..." : "Valider"}
        </Button>
      </header>

      {/* Grille à deux colonnes : formulaire (gauche) + preview (droite) */}
      <div className="post-form-grid">

        {/* Formulaire principal avec id pour permettre le submit depuis l'en-tête */}
        <form className="form-card" id="post-create-form" onSubmit={handleSubmit}>

          {/* Message de feedback (succès ou erreur) — rendu conditionnel */}
          {/* La classe "is-success" ou "is-error" adapte le style visuel */}
          {feedback.message ? (
            <p className={`post-form-feedback is-${feedback.tone}`}>{feedback.message}</p>
          ) : null}

          {/* Sélecteur de blog : liste les blogs disponibles chargés via API */}
          {/* .map() sur le tableau "blogs" pour générer les options du select */}
          <Select
            id="blog_id"
            label="Blog"
            name="blog_id"
            onChange={handleChange}
            options={blogs.map((blog) => ({ label: blog.name, value: String(blog.id) }))}
            value={formData.blog_id}
          />
          {/* Champ titre de l'article */}
          <Input id="title" label="Titre" name="title" onChange={handleChange} placeholder="Titre de l'article" value={formData.title} />
          {/* Champ slug : URL-friendly généré manuellement */}
          <Input id="slug" label="Slug" name="slug" onChange={handleChange} placeholder="titre-de-l-article" value={formData.slug} />
          {/* Champ résumé / accroche */}
          <Textarea id="excerpt" label="Résumé" name="excerpt" onChange={handleChange} placeholder="Phrase d'accroche" value={formData.excerpt} />
          {/* Champ contenu principal de l'article (texte long) */}
          <Textarea id="content" label="Contenu" name="content" onChange={handleChange} placeholder="Rédiger le contenu..." value={formData.content} />
          {/* Champ fichier pour l'image de couverture — limité à 2 Mo côté client */}
          <label className="field">
            <span>Image de l'article (2 Mo max)</span>
            <input accept="image/*" name="cover" onChange={handleCoverChange} type="file" />
          </label>
          {/* Sélecteur de statut : options calculées selon le rôle (editor ne peut pas publier) */}
          <Select id="status" label="Statut" name="status" onChange={handleChange} options={statusOptions} value={formData.status} />

          {/* Zone de boutons d'action : brouillon (secondaire) + validation (primaire) */}
          <div className="post-form-actions">
            {/* Bouton brouillon : value="draft" est lu dans handleSubmit via submitter?.value */}
            <Button disabled={isSubmitting} icon={Save} type="submit" value="draft" variant="secondary">
              Enregistrer brouillon
            </Button>
            {/* Bouton validation / publication : libellé adapté selon le statut courant */}
            <Button disabled={isSubmitting} icon={CheckCircle2} type="submit" value="validate">
              {formData.status === "published" ? "Publier" : "Soumettre à validation"}
            </Button>
          </div>
        </form>

        {/* Panneau de prévisualisation de l'article (lecture seule, mis à jour en temps réel) */}
        <aside className="card-shell post-preview">
          <Eye size={22} />
          {/* Titre de l'aperçu : affiche la valeur du champ title ou un placeholder */}
          <h2>{formData.title || "Preview article"}</h2>
          {/* Résumé de l'aperçu : affiche la valeur du champ excerpt ou un message par défaut */}
          <p>{formData.excerpt || "Le rendu court apparaitra ici avant publication."}</p>
          {/* Badge de statut actuel : trouve le label dans statusOptions via .find() */}
          <span className="chip">{statusOptions.find((option) => option.value === formData.status)?.label}</span>
        </aside>

      </div>
    </section>
  );
}

// Export par défaut pour le routeur React
export default PostCreate;
