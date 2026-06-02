import { ExternalLink, Globe2, LockKeyhole, PlusCircle, Save, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import Input from "@components/ui/Input/Input";
import { formatCompactMetric } from "@utils/formatMetric";
import { createBlog, fetchOwnerBlogs, updateBlog } from "@services/blogsService";
import { fetchThemes } from "@services/themesService";

import "./OwnerBlogs.css";

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function OwnerBlogs() {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState([]);
  const [themes, setThemes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    description: "",
    is_public: true,
    name: "",
    slug: "",
    theme_id: "",
  });

  const visibleBlogs = useMemo(() => blogs, [blogs]);

  // FR: Charge les blogs accessibles a l'owner et les themes disponibles pour la creation.
  // EN: Loads blogs available to the owner and themes available for creation.
  const loadBlogs = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [blogRows, themeRows] = await Promise.all([fetchOwnerBlogs(), fetchThemes()]);
      setBlogs(Array.isArray(blogRows) ? blogRows : []);
      setThemes(Array.isArray(themeRows) ? themeRows.filter((theme) => theme.type === "blog") : []);
      const defaultTheme = themeRows?.find((theme) => theme.type === "blog") || themeRows?.[0];
      setFormData((current) => ({ ...current, theme_id: current.theme_id || defaultTheme?.id || "" }));
    } catch (err) {
      setError(err.message || "Impossible de charger vos blogs pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "name" && !current.slug ? { slug: slugify(value) } : {}),
    }));
  };

  const resetForm = () => {
    setFormData({
      description: "",
      is_public: true,
      name: "",
      slug: "",
      theme_id: themes[0]?.id || "",
    });
  };

  const handleCreateBlog = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        slug: slugify(formData.slug || formData.name),
        theme_id: Number(formData.theme_id || themes[0]?.id || 1),
      };

      const createdBlog = await createBlog(payload);
      setBlogs((current) => [createdBlog, ...current]);
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Impossible de créer le blog.");
    } finally {
      setIsSaving(false);
    }
  };

  // FR: Toggle optimiste Public/Prive, avec rollback si l'API refuse la modification.
  // EN: Optimistic Public/Private toggle, with rollback if the API rejects the update.
  const handleToggleVisibility = async (blog) => {
    const nextVisibility = !Boolean(blog.is_public);
    setBlogs((current) =>
      current.map((item) => (item.id === blog.id ? { ...item, is_public: nextVisibility } : item))
    );

    try {
      const updatedBlog = await updateBlog(blog.id, { is_public: nextVisibility });
      setBlogs((current) =>
        current.map((item) => (item.id === blog.id ? { ...item, ...updatedBlog } : item))
      );
    } catch (err) {
      setBlogs((current) =>
        current.map((item) => (item.id === blog.id ? { ...item, is_public: blog.is_public } : item))
      );
      setError(err.message || "Impossible de modifier la visibilité du blog.");
    }
  };

  return (
    <section className="by-page owner-blogs">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("nav.myBlogs")}</div>
          <h1>{t("pages.ownerBlogs.title")}</h1>
          <p className="text-muted owner-blogs__intro">
            Gérez vos propriétés éditoriales, leur visibilité publique et les espaces privés réservés aux personnes invitées.
          </p>
        </div>
        <Button icon={PlusCircle} onClick={() => setIsModalOpen(true)} type="button">
          {t("actions.newBlog")}
        </Button>
      </header>

      {error ? <p className="owner-blogs__alert">{error}</p> : null}
      {isLoading ? <p className="text-muted">Chargement de vos blogs...</p> : null}

      <div className="owner-blog-grid">
        {!isLoading && visibleBlogs.length === 0 ? (
          <article className="card-shell owner-blog-empty">
            <PlusCircle size={26} />
            <h2>Aucun blog pour le moment</h2>
            <p>Créez votre première propriété éditoriale, puis choisissez immédiatement si elle démarre en public ou en privé.</p>
            <Button icon={PlusCircle} onClick={() => setIsModalOpen(true)} type="button">
              {t("actions.newBlog")}
            </Button>
          </article>
        ) : null}

        {visibleBlogs.map((blog) => (
          <article className="card-shell surface-hover" key={blog.id}>
            <div className="flex-between">
              <Badge tone="info">{t(`status.${blog.status}`, blog.status)}</Badge>
              <span className="text-muted">{formatCompactMetric(blog.views || 0, t)} {t("metrics.views")}</span>
            </div>
            <h2>{blog.name}</h2>
            <p>{t("pages.ownerBlogs.cardMeta", { count: blog.posts_count || blog.posts || 0 })}</p>
            <button
              className={`owner-blog-toggle ${blog.is_public ? "is-public" : "is-private"}`}
              onClick={() => handleToggleVisibility(blog)}
              title={blog.is_public ? "Basculer ce blog en privé" : "Publier ce blog"}
              type="button"
            >
              {blog.is_public ? <Globe2 size={16} /> : <LockKeyhole size={16} />}
              <span>{blog.is_public ? "Public" : "Privé"}</span>
            </button>
            <div className="actions">
              <Button icon={Settings2} variant="secondary">{t("actions.configure")}</Button>
              <Button icon={ExternalLink}>{t("actions.open")}</Button>
            </div>
          </article>
        ))}
      </div>

      {isModalOpen ? (
        <div className="owner-blog-modal" role="dialog" aria-modal="true" aria-labelledby="new-blog-title">
          <button className="owner-blog-modal__backdrop" onClick={() => setIsModalOpen(false)} type="button" aria-label="Fermer" />
          <form className="owner-blog-modal__panel" onSubmit={handleCreateBlog}>
            <div className="flex-between">
              <div>
                <div className="by-eyebrow">Nouvelle propriété</div>
                <h2 id="new-blog-title">Créer un nouveau blog</h2>
              </div>
              <button className="owner-blog-modal__close" onClick={() => setIsModalOpen(false)} type="button" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <Input id="blog-name" label="Nom du blog" name="name" onChange={handleChange} required value={formData.name} />
            <Input id="blog-slug" label="Slug public" name="slug" onChange={handleChange} required value={formData.slug} />

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

            <label className="owner-blog-field" htmlFor="blog-theme">
              <span>Thème</span>
              <select id="blog-theme" name="theme_id" onChange={handleChange} value={formData.theme_id}>
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

            <fieldset className="owner-blog-visibility">
              <legend>Visibilité initiale</legend>
              <label>
                <input checked={formData.is_public} name="is_public" onChange={() => setFormData((current) => ({ ...current, is_public: true }))} type="radio" />
                <Globe2 size={16} />
                <span>Public</span>
              </label>
              <label>
                <input checked={!formData.is_public} name="is_public" onChange={() => setFormData((current) => ({ ...current, is_public: false }))} type="radio" />
                <LockKeyhole size={16} />
                <span>Privé, visible uniquement par invitation</span>
              </label>
            </fieldset>

            <div className="owner-blog-modal__actions">
              <Button icon={X} onClick={() => setIsModalOpen(false)} type="button" variant="secondary">
                Annuler
              </Button>
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

export default OwnerBlogs;
