import { Archive, Edit3, Rocket, Search } from "lucide-react";

import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import Table from "@components/ui/Table/Table";

import "./PostsList.css";

const posts = [
  { id: 1, title: "L'essor de l'IA en 2024", status: "published", category: "Tech", date: "21 mai" },
  { id: 2, title: "Ma critique de Dune", status: "draft", category: "Culture", date: "22 mai" },
  { id: 3, title: "Guide editorial", status: "archived", category: "Equipe", date: "18 mai" },
];

function PostsList() {
  const columns = [
    { key: "title", label: "Article" },
    { key: "category", label: "Categorie" },
    { key: "date", label: "Date" },
    { key: "status", label: "Statut", render: (row) => <Badge tone={row.status === "published" ? "success" : "warning"}>{row.status}</Badge> },
    { key: "actions", label: "Actions", render: () => <div className="table-actions"><button><Edit3 size={16} /></button><button><Rocket size={16} /></button><button><Archive size={16} /></button></div> },
  ];

  return (
    <section className="by-page posts-list">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">Articles</div>
          <h1>Pipeline de publication.</h1>
        </div>
        <Button icon={Edit3}>Creer</Button>
      </header>
      <div className="admin-toolbar card-shell">
        <label className="admin-search"><Search size={17} /><input placeholder="Rechercher un article" /></label>
        <div className="chip-row"><Badge>Draft</Badge><Badge tone="success">Published</Badge><Badge tone="danger">Archived</Badge></div>
      </div>
      <Table columns={columns} rows={posts} />
    </section>
  );
}

export default PostsList;
