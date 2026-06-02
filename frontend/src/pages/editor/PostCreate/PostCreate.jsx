import { CheckCircle2, Eye, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Button from "@components/ui/Button/Button";
import Input from "@components/ui/Input/Input";
import Select from "@components/ui/Select/Select";
import Textarea from "@components/ui/Textarea/Textarea";
import { useAuth } from "@hooks/useAuth";
import { getBlogs } from "@services/blogsService";
import { uploadMedia } from "@services/mediaService";
import { createPost } from "@services/postsService";

import "./PostCreate.css";

const initialForm = {
  blog_id: "",
  content: "",
  excerpt: "",
  slug: "",
  status: "draft",
  title: "",
};

function PostCreate() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [coverFile, setCoverFile] = useState(null);
  const [feedback, setFeedback] = useState({ tone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = useMemo(
    () => [
      { label: "Brouillon", value: "draft" },
      { label: "En cours de vérification", value: "pending" },
      { label: "Publié", value: "published", disabled: user?.role === "editor" },
    ],
    [user?.role]
  );

  useEffect(() => {
    getBlogs()
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : rows?.data || [];
        setBlogs(list);
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // FR: Meme limite cote client que cote API pour un retour immediat.
    // EN: Same client-side limit as the API for immediate feedback.
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ tone: "error", message: "L'image ne doit pas depasser 2 Mo." });
      event.target.value = "";
      return;
    }

    setCoverFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ tone: "", message: "" });
    const submitStatus = event.nativeEvent.submitter?.value || formData.status;
    const status = submitStatus === "draft" ? "draft" : formData.status;

    if (!formData.blog_id || !formData.title || !formData.slug || !formData.content) {
      setFeedback({
        tone: "error",
        message: "Choisis un blog puis renseigne au minimum le titre, le slug et le contenu.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createPost({
        ...formData,
        author_id: user?.id,
        blog_id: Number(formData.blog_id),
        status,
        published_at:
          status === "published"
            ? new Date().toISOString().slice(0, 19).replace("T", " ")
            : null,
      });

      if (coverFile) {
        await uploadMedia({
          blogId: formData.blog_id,
          file: coverFile,
          altText: formData.title,
          metadata: { usage: "post-cover", slug: formData.slug },
        });
      }

      setFeedback({
        tone: "success",
        message:
          status === "pending"
            ? "Article soumis à validation."
            : "Article enregistré.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error.message || "Impossible d'enregistrer l'article.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="by-page post-form-page">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">Création</div>
          <h1>Composer un nouvel article.</h1>
        </div>
        <Button disabled={isSubmitting} form="post-create-form" icon={CheckCircle2} type="submit">
          {isSubmitting ? "Validation..." : "Valider"}
        </Button>
      </header>
      <div className="post-form-grid">
        <form className="form-card" id="post-create-form" onSubmit={handleSubmit}>
          {feedback.message ? (
            <p className={`post-form-feedback is-${feedback.tone}`}>{feedback.message}</p>
          ) : null}

          <Select
            id="blog_id"
            label="Blog"
            name="blog_id"
            onChange={handleChange}
            options={blogs.map((blog) => ({ label: blog.name, value: String(blog.id) }))}
            value={formData.blog_id}
          />
          <Input id="title" label="Titre" name="title" onChange={handleChange} placeholder="Titre de l'article" value={formData.title} />
          <Input id="slug" label="Slug" name="slug" onChange={handleChange} placeholder="titre-de-l-article" value={formData.slug} />
          <Textarea id="excerpt" label="Résumé" name="excerpt" onChange={handleChange} placeholder="Phrase d'accroche" value={formData.excerpt} />
          <Textarea id="content" label="Contenu" name="content" onChange={handleChange} placeholder="Rédiger le contenu..." value={formData.content} />
          <label className="field">
            <span>Image de l'article (2 Mo max)</span>
            <input accept="image/*" name="cover" onChange={handleCoverChange} type="file" />
          </label>
          <Select id="status" label="Statut" name="status" onChange={handleChange} options={statusOptions} value={formData.status} />

          <div className="post-form-actions">
            <Button disabled={isSubmitting} icon={Save} type="submit" value="draft" variant="secondary">
              Enregistrer brouillon
            </Button>
            <Button disabled={isSubmitting} icon={CheckCircle2} type="submit" value="validate">
              {formData.status === "published" ? "Publier" : "Soumettre à validation"}
            </Button>
          </div>
        </form>
        <aside className="card-shell post-preview">
          <Eye size={22} />
          <h2>{formData.title || "Preview article"}</h2>
          <p>{formData.excerpt || "Le rendu court apparaitra ici avant publication."}</p>
          <span className="chip">{statusOptions.find((option) => option.value === formData.status)?.label}</span>
        </aside>
      </div>
    </section>
  );
}

export default PostCreate;
