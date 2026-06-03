// Icônes lucide-react utilisées dans les cartes, le modal et les boutons d'action
import { ExternalLink, Globe2, LockKeyhole, PlusCircle, Save, Settings2, X } from "lucide-react";
// useEffect : charge les données au montage du composant
// useMemo : mémoïse la liste des blogs pour éviter les recalculs inutiles
// useState : déclare les variables d'état locales
import { useEffect, useMemo, useState } from "react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Badge : étiquette de statut colorée
import Badge from "@components/ui/Badge/Badge";
// Button : bouton réutilisable avec icône
import Button from "@components/ui/Button/Button";
// Input : champ de formulaire stylisé avec label
import Input from "@components/ui/Input/Input";
// Utilitaire de formatage compact des métriques (ex : 9500 → "9,5k")
import { formatCompactMetric } from "@utils/formatMetric";
// Services API blogs : récupérer, créer et mettre à jour les blogs de l'owner
import { createBlog, fetchOwnerBlogs, updateBlog } from "@services/blogsService";
// Service API thèmes : récupérer les thèmes disponibles pour la création d'un blog
import { fetchThemes } from "@services/themesService";

// Styles CSS propres à la page des blogs de l'owner
import "./OwnerBlogs.css";

// Fonction utilitaire : convertit une chaîne en slug URL-friendly
// Ex : "Mon Blog Été" → "mon-blog-ete"
function slugify(value) {
  return value
    .toLowerCase()
    // Décompose les caractères accentués en caractères de base + diacritiques
    .normalize("NFD")
    // Supprime les diacritiques (accents, cédilles…)
    .replace(/[\u0300-\u036f]/g, "")
    // Remplace tout caractère non alphanumérique par un tiret
    .replace(/[^a-z0-9]+/g, "-")
    // Supprime les tirets en début et fin de chaîne
    .replace(/(^-|-$)/g, "");
}

// Composant page : gestion des blogs de l'owner (liste, création, toggle visibilité)
function OwnerBlogs() {
  // t() : fonction de traduction retournant le texte dans la langue courante
  const { t } = useTranslation();
  // blogs : liste des blogs de l'owner chargés depuis l'API
  const [blogs, setBlogs] = useState([]);
  // themes : liste des thèmes disponibles pour la création d'un blog
  const [themes, setThemes] = useState([]);
  // isModalOpen : contrôle l'affichage du modal de création d'un nouveau blog
  const [isModalOpen, setIsModalOpen] = useState(false);
  // isLoading : true pendant le chargement initial des données (affiche un message)
  const [isLoading, setIsLoading] = useState(true);
  // isSaving : true pendant la soumission du formulaire (désactive le bouton "Créer")
  const [isSaving, setIsSaving] = useState(false);
  // error : message d'erreur à afficher si une opération API échoue
  const [error, setError] = useState("");
  // formData : état de tous les champs du formulaire de création de blog
  const [formData, setFormData] = useState({
    description: "", // Description éditoriale du blog
    is_public: true, // Visibilité : true = public, false = privé (invitation uniquement)
    name: "",        // Nom affiché du blog
    slug: "",        // Identifiant URL du blog (auto-généré depuis le nom)
    theme_id: "",    // ID du thème visuel choisi pour ce blog
  });

  // visibleBlogs : liste mémoïsée des blogs à afficher
  // useMemo évite de recréer le tableau si "blogs" n'a pas changé
  const visibleBlogs = useMemo(() => blogs, [blogs]);

  // Charge les blogs de l'owner et les thèmes disponibles depuis l'API
  // Utilise Promise.all pour effectuer les deux requêtes en parallèle
  const loadBlogs = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Appels API parallèles : blogs de l'owner + thèmes disponibles
      const [blogRows, themeRows] = await Promise.all([fetchOwnerBlogs(), fetchThemes()]);
      setBlogs(Array.isArray(blogRows) ? blogRows : []);
      // Filtre : garde uniquement les thèmes de type "blog" (pas les thèmes de page)
      setThemes(Array.isArray(themeRows) ? themeRows.filter((theme) => theme.type === "blog") : []);
      // Pré-sélectionne le premier thème blog disponible si aucun n'est encore choisi
      const defaultTheme = themeRows?.find((theme) => theme.type === "blog") || themeRows?.[0];
      setFormData((current) => ({ ...current, theme_id: current.theme_id || defaultTheme?.id || "" }));
    } catch (err) {
      setError(err.message || "Impossible de charger vos blogs pour le moment.");
    } finally {
      // Désactive l'état de chargement qu'il y ait succès ou erreur
      setIsLoading(false);
    }
  };

  // useEffect : exécuté une seule fois au montage du composant (tableau de dépendances vide [])
  // Lance le chargement initial des blogs et des thèmes
  useEffect(() => {
    loadBlogs();
  }, []);

  // Gestionnaire générique des champs du formulaire de création
  // Gère les cases à cocher (checkbox) différemment des champs texte (value)
  // Génère automatiquement le slug depuis le nom si le slug est encore vide
  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((current) => ({
      ...current,
      // Pour les checkboxes, utiliser "checked" ; pour les autres champs, "value"
      [name]: type === "checkbox" ? checked : value,
      // Auto-génère le slug depuis le nom uniquement si le slug n'a pas encore été saisi
      ...(name === "name" && !current.slug ? { slug: slugify(value) } : {}),
    }));
  };

  // Réinitialise le formulaire à ses valeurs par défaut après création ou annulation
  const resetForm = () => {
    setFormData({
      description: "",
      is_public: true,
      name: "",
      slug: "",
      theme_id: themes[0]?.id || "",
    });
  };

  // Gestionnaire de soumission du formulaire de création de blog
  // Appelle l'API createBlog, ajoute le nouveau blog en tête de liste et ferme le modal
  const handleCreateBlog = async (event) => {
    // Empêche le rechargement de la page par le comportement natif du formulaire
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      // Construction du payload : slug normalisé + theme_id en nombre
      const payload = {
        ...formData,
        slug: slugify(formData.slug || formData.name),
        theme_id: Number(formData.theme_id || themes[0]?.id || 1),
      };

      // Appel API : crée le blog et récupère l'objet blog créé avec son ID
      const createdBlog = await createBlog(payload);
      // Ajoute le nouveau blog en tête de la liste (affichage immédiat sans rechargement)
      setBlogs((current) => [createdBlog, ...current]);
      resetForm();
      setIsModalOpen(false); // Ferme le modal après succès
    } catch (err) {
      setError(err.message || "Impossible de créer le blog.");
    } finally {
      setIsSaving(false);
    }
  };

  // Bascule optimiste la visibilité public/privé d'un blog
  // Met à jour l'UI immédiatement, puis confirme avec l'API
  // Rollback automatique en cas d'erreur API (restore de la valeur précédente)
  const handleToggleVisibility = async (blog) => {
    // Calcule la nouvelle valeur de visibilité (inverse de l'actuelle)
    const nextVisibility = !Boolean(blog.is_public);
    // Mise à jour optimiste : modifie l'état local immédiatement pour une UI réactive
    setBlogs((current) =>
      current.map((item) => (item.id === blog.id ? { ...item, is_public: nextVisibility } : item))
    );

    try {
      // Appel API : confirme la nouvelle visibilité côté serveur
      const updatedBlog = await updateBlog(blog.id, { is_public: nextVisibility });
      // Synchronise l'état avec la réponse complète de l'API
      setBlogs((current) =>
        current.map((item) => (item.id === blog.id ? { ...item, ...updatedBlog } : item))
      );
    } catch (err) {
      // Rollback : restaure la valeur d'origine si l'API refuse la modification
      setBlogs((current) =>
        current.map((item) => (item.id === blog.id ? { ...item, is_public: blog.is_public } : item))
      );
      setError(err.message || "Impossible de modifier la visibilité du blog.");
    }
  };

  return (
    // Section principale de la page des blogs de l'owner
    <section className="by-page owner-blogs">

      {/* En-tête : titre + introduction + bouton de création d'un nouveau blog */}
      <header className="by-page-header">
        <div>
          {/* Bandeau contextuel traduit (ex : "Mes blogs") */}
          <div className="by-eyebrow">{t("nav.myBlogs")}</div>
          {/* Titre principal traduit */}
          <h1>{t("pages.ownerBlogs.title")}</h1>
          {/* Description introductive de la page */}
          <p className="text-muted owner-blogs__intro">
            Gérez vos propriétés éditoriales, leur visibilité publique et les espaces privés réservés aux personnes invitées.
          </p>
        </div>
        {/* Bouton d'ouverture du modal de création de blog */}
        <Button icon={PlusCircle} onClick={() => setIsModalOpen(true)} type="button">
          {t("actions.newBlog")}
        </Button>
      </header>

      {/* Message d'erreur API — affiché uniquement si une erreur s'est produite */}
      {error ? <p className="owner-blogs__alert">{error}</p> : null}
      {/* Message de chargement — affiché pendant le fetch initial */}
      {isLoading ? <p className="text-muted">Chargement de vos blogs...</p> : null}

      {/* Grille des cartes de blogs */}
      <div className="owner-blog-grid">

        {/* État vide : affiché quand le chargement est terminé mais aucun blog n'existe */}
        {!isLoading && visibleBlogs.length === 0 ? (
          <article className="card-shell owner-blog-empty">
            <PlusCircle size={26} />
            <h2>Aucun blog pour le moment</h2>
            <p>Créez votre première propriété éditoriale, puis choisissez immédiatement si elle démarre en public ou en privé.</p>
            {/* Second bouton de création dans l'état vide pour faciliter l'action */}
            <Button icon={PlusCircle} onClick={() => setIsModalOpen(true)} type="button">
              {t("actions.newBlog")}
            </Button>
          </article>
        ) : null}

        {/* Itération sur les blogs visibles : une carte par blog */}
        {visibleBlogs.map((blog) => (
          // Carte d'un blog avec hover animé
          <article className="card-shell surface-hover" key={blog.id}>
            {/* En-tête de la carte : badge de statut + compteur de vues */}
            <div className="flex-between">
              {/* Badge de statut traduit (ex : "Actif", "Archivé") */}
              <Badge tone="info">{t(`status.${blog.status}`, blog.status)}</Badge>
              {/* Nombre de vues formaté en compact, affiché en texte atténué */}
              <span className="text-muted">{formatCompactMetric(blog.views || 0, t)} {t("metrics.views")}</span>
            </div>
            {/* Nom du blog */}
            <h2>{blog.name}</h2>
            {/* Métadonnées : nombre d'articles (interpolé via i18n) */}
            <p>{t("pages.ownerBlogs.cardMeta", { count: blog.posts_count || blog.posts || 0 })}</p>
            {/* Bouton de bascule visibilité public/privé avec mise à jour optimiste */}
            <button
              className={`owner-blog-toggle ${blog.is_public ? "is-public" : "is-private"}`}
              onClick={() => handleToggleVisibility(blog)}
              title={blog.is_public ? "Basculer ce blog en privé" : "Publier ce blog"}
              type="button"
            >
              {/* Icône Globe2 si public, cadenas si privé */}
              {blog.is_public ? <Globe2 size={16} /> : <LockKeyhole size={16} />}
              <span>{blog.is_public ? "Public" : "Privé"}</span>
            </button>
            {/* Boutons d'action : configurer les paramètres ou ouvrir le blog */}
            <div className="actions">
              <Button icon={Settings2} variant="secondary">{t("actions.configure")}</Button>
              <Button icon={ExternalLink}>{t("actions.open")}</Button>
            </div>
          </article>
        ))}

      </div>

      {/* Modal de création d'un nouveau blog — rendu conditionnel selon isModalOpen */}
      {isModalOpen ? (
        // Conteneur du modal : role="dialog" et aria-modal pour l'accessibilité
        <div className="owner-blog-modal" role="dialog" aria-modal="true" aria-labelledby="new-blog-title">
          {/* Backdrop : fond semi-transparent, clic dessus ferme le modal */}
          <button className="owner-blog-modal__backdrop" onClick={() => setIsModalOpen(false)} type="button" aria-label="Fermer" />
          {/* Formulaire de création : onSubmit appelle handleCreateBlog */}
          <form className="owner-blog-modal__panel" onSubmit={handleCreateBlog}>
            {/* En-tête du modal : titre + bouton de fermeture */}
            <div className="flex-between">
              <div>
                <div className="by-eyebrow">Nouvelle propriété</div>
                {/* id="new-blog-title" référencé par aria-labelledby pour l'accessibilité */}
                <h2 id="new-blog-title">Créer un nouveau blog</h2>
              </div>
              {/* Bouton X de fermeture du modal */}
              <button className="owner-blog-modal__close" onClick={() => setIsModalOpen(false)} type="button" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            {/* Champ nom du blog — required : validation côté navigateur */}
            <Input id="blog-name" label="Nom du blog" name="name" onChange={handleChange} required value={formData.name} />
            {/* Champ slug — auto-rempli depuis le nom via slugify(), modifiable manuellement */}
            <Input id="blog-slug" label="Slug public" name="slug" onChange={handleChange} required value={formData.slug} />

            {/* Champ description éditoriale du blog */}
            <label className="owner-blog-field" htmlFor="blog-description">
              <span>Description</span>
              <textarea
                id="blog-description"
                name="description"
                onChange={handleChange}
                placeholder="Courte ligne éditoriale du blog"
                rows={4}
                value={formData.description}
              />
            </label>

            {/* Sélecteur de thème visuel : peuplé depuis les thèmes de type "blog" */}
            <label className="owner-blog-field" htmlFor="blog-theme">
              <span>Thème</span>
              <select id="blog-theme" name="theme_id" onChange={handleChange} value={formData.theme_id}>
                {/* Si des thèmes sont disponibles, les lister ; sinon afficher le thème par défaut */}
                {themes.length > 0 ? (
                  themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))
                ) : (
                  <option value="1">Thème éditorial par défaut</option>
                )}
              </select>
            </label>

            {/* Sélecteur de visibilité initiale : boutons radio Public / Privé */}
            <fieldset className="owner-blog-visibility">
              <legend>Visibilité initiale</legend>
              {/* Option Public : radio checked si is_public === true */}
              <label>
                <input checked={formData.is_public} name="is_public" onChange={() => setFormData((current) => ({ ...current, is_public: true }))} type="radio" />
                <Globe2 size={16} />
                <span>Public</span>
              </label>
              {/* Option Privé : radio checked si is_public === false */}
              <label>
                <input checked={!formData.is_public} name="is_public" onChange={() => setFormData((current) => ({ ...current, is_public: false }))} type="radio" />
                <LockKeyhole size={16} />
                <span>Privé, visible uniquement par invitation</span>
              </label>
            </fieldset>

            {/* Boutons d'action du modal : annuler (ferme) ou créer (soumet) */}
            <div className="owner-blog-modal__actions">
              {/* Bouton Annuler : ferme le modal sans créer */}
              <Button icon={X} onClick={() => setIsModalOpen(false)} type="button" variant="secondary">
                Annuler
              </Button>
              {/* Bouton Créer : soumet le formulaire, désactivé pendant la sauvegarde */}
              <Button disabled={isSaving} icon={Save} type="submit">
                {isSaving ? "Création..." : "Créer le blog"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

    </section>
  );
}

// Export par défaut pour le routeur React
export default OwnerBlogs;
