import { Ban, CheckCircle2, Edit3, Eye, RotateCcw, Search, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Avatar from "@components/ui/Avatar/Avatar";
import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import Input from "@components/ui/Input/Input";
import Select from "@components/ui/Select/Select";
import Table from "@components/ui/Table/Table";
import {
  bulkUpdateAdminUsers,
  deleteUser,
  getAdminUserFilterOptions,
  getUserById,
  getUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateUser,
  uploadUserAvatar,
} from "@services/usersService";

import "./AdminUsers.css";

const emptyEditForm = {
  avatar_url: "",
  email: "",
  full_name: "",
  is_active: 1,
  platform_role: "user",
  role: "user",
  status: "active",
  username: "",
};

const fallbackOptions = {
  roles: ["admin", "owner", "editor", "moderator", "user"],
  statuses: ["active", "inactive", "suspended", "banned", "pending"],
};

function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [feedback, setFeedback] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("change_status");
  const [bulkRole, setBulkRole] = useState("moderator");
  const [bulkStatus, setBulkStatus] = useState("suspended");
  const [options, setOptions] = useState(fallbackOptions);

  const loadUsers = () => {
    getUsers({ search: query, filterBy: "all", limit: 100 })
      .then((response) => setUsers(Array.isArray(response) ? response : response.data || []))
      .catch((error) => setFeedback(error.message || "Impossible de charger les utilisateurs."));
  };

  useEffect(() => {
    loadUsers();
    getAdminUserFilterOptions()
      .then((response) => setOptions(response.data || fallbackOptions))
      .catch(() => setOptions(fallbackOptions));
  }, []);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return users;

    return users.filter((user) =>
      [user.username, user.email, user.full_name, user.role, user.platform_role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [query, users]);

  const normalizeUser = (user) => ({
    avatar_url: user.avatar_url || "",
    email: user.email || "",
    full_name: user.full_name || "",
    is_active: user.is_active ? 1 : 0,
    platform_role: user.platform_role || (user.role === "admin" ? "admin" : "user"),
    role: user.role || "user",
    status: user.status || (user.is_active ? "active" : "inactive"),
    username: user.username || "",
  });

  const handleRead = async (user) => {
    try {
      const data = await getUserById(user.id);
      setSelectedUser(data);
      setEditingUser(null);
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Impossible de lire cet utilisateur.");
    }
  };

  const handleEdit = async (user) => {
    try {
      const data = await getUserById(user.id);
      setEditingUser(data);
      setEditForm(normalizeUser(data));
      setSelectedUser(null);
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Impossible de modifier cet utilisateur.");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !editingUser) return;

    if (file.size > 2 * 1024 * 1024) {
      setFeedback("L'avatar ne doit pas depasser 2 Mo.");
      return;
    }

    try {
      const response = await uploadUserAvatar(editingUser.id, file);
      setEditForm((current) => ({ ...current, avatar_url: response.avatar_url }));
      setFeedback("Avatar mis a jour.");
      loadUsers();
    } catch (error) {
      setFeedback(error.message || "Upload avatar impossible.");
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      await updateUser(editingUser.id, {
        ...editForm,
        is_active: editingUser.is_active ? 1 : 0,
        platform_role: editingUser.platform_role,
        role: editingUser.role,
        status: editingUser.status,
      });
      await updateAdminUserRole(editingUser.id, editForm.role, "Modification depuis la fiche admin.");
      await updateAdminUserStatus(editingUser.id, editForm.status, "Modification depuis la fiche admin.");
    } catch (error) {
      setFeedback(error.message || "Impossible d'enregistrer cet utilisateur.");
      return;
    }
    setFeedback("Utilisateur mis à jour.");
    setEditingUser(null);
    loadUsers();
  };

  const handleToggleActive = async (user) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      await updateAdminUserStatus(user.id, nextStatus, "Action rapide depuis la table admin.");
    } catch (error) {
      setFeedback(error.message || "Impossible de changer le statut utilisateur.");
      return;
    }
    setFeedback(nextStatus === "active" ? "Utilisateur réactivé." : "Utilisateur suspendu.");
    loadUsers();
  };

  const handleRoleSelect = async (user, role) => {
    try {
      await updateAdminUserRole(user.id, role, "Changement direct depuis le select admin.");
      setFeedback("Role utilisateur mis a jour.");
      loadUsers();
    } catch (error) {
      setFeedback(error.message || "Impossible de changer le role.");
    }
  };

  const handleStatusSelect = async (user, status) => {
    try {
      await updateAdminUserStatus(user.id, status, "Changement direct depuis le select admin.");
      setFeedback("Statut utilisateur mis a jour.");
      loadUsers();
    } catch (error) {
      setFeedback(error.message || "Impossible de changer le statut.");
    }
  };

  const handleToggleSelection = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const handleBulkUpdate = async () => {
    try {
      const response = await bulkUpdateAdminUsers({
        userIds: selectedIds,
        action: bulkAction,
        role: bulkRole,
        status: bulkStatus,
        reason: "Action en masse depuis /admin/users.",
      });
      setFeedback(`${response.summary.updated} utilisateur(s) modifie(s), ${response.summary.skipped} ignore(s).`);
      setSelectedIds([]);
      loadUsers();
    } catch (error) {
      setFeedback(error.message || "Action en masse impossible.");
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Supprimer ${user.username || user.email} ?`);

    if (!confirmed) return;

    try {
      await deleteUser(user.id);
    } catch (error) {
      setFeedback(error.message || "Impossible de supprimer cet utilisateur.");
      return;
    }
    setFeedback("Utilisateur supprimé.");
    loadUsers();
  };

  const columns = [
    {
      key: "select",
      label: "",
      render: (row) => (
        <input
          checked={selectedIds.includes(row.id)}
          onChange={() => handleToggleSelection(row.id)}
          title="Selectionner"
          type="checkbox"
        />
      ),
    },
    {
      key: "avatar",
      label: "Avatar",
      render: (row) => <Avatar name={row.full_name || row.username || row.email} src={row.avatar_url} />,
    },
    { key: "username", label: t("table.user"), render: (row) => <div className="user-cell"><strong>{row.username}</strong><span>{row.full_name}</span></div> },
    { key: "email", label: t("auth.email") },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <select className="inline-admin-select" value={row.role || "user"} onChange={(event) => handleRoleSelect(row, event.target.value)} title="Changer le role">
          {options.roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (row) => (
        <select className="inline-admin-select" value={row.status || "active"} onChange={(event) => handleStatusSelect(row, event.target.value)} title="Changer le statut">
          {options.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      render: (row) => (
        <div className="table-actions">
          <button className="action-button action-button--view" type="button" aria-label="Lire" title="Lire" onClick={() => handleRead(row)}><Eye size={16} /></button>
          <button className="action-button action-button--edit" type="button" aria-label={t("common.edit")} title={t("common.edit")} onClick={() => handleEdit(row)}><Edit3 size={16} /></button>
          <button className="action-button action-button--suspend" type="button" aria-label={row.status === "active" ? "Suspendre" : "Réactiver"} title={row.status === "active" ? "Suspendre" : "Réactiver"} onClick={() => handleToggleActive(row)}>
            {row.status === "active" ? <Ban size={16} /> : <RotateCcw size={16} />}
          </button>
          <button className="action-button action-button--delete" type="button" aria-label={t("common.delete")} title={t("common.delete")} onClick={() => handleDelete(row)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <section className="by-page admin-users">
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("pages.adminUsers.eyebrow")}</div>
          <h1>{t("pages.adminUsers.title")}</h1>
          <p className="text-muted">{t("pages.adminUsers.description")}</p>
        </div>
        <Button icon={UserPlus}>{t("actions.invite")}</Button>
      </header>

      {feedback ? <p className="admin-feedback">{feedback}</p> : null}

      <div className="admin-toolbar card-shell">
        <label className="admin-search">
          <Search size={17} />
          <input onChange={(event) => setQuery(event.target.value)} placeholder={t("pages.adminUsers.searchPlaceholder")} type="search" value={query} />
        </label>
        <div className="chip-row">
          <Badge tone="admin">{t("roles.admin")}</Badge>
          <Badge tone="owner">{t("roles.owner")}</Badge>
          <Badge tone="editor">{t("roles.editor")}</Badge>
          <Badge tone="moderator">{t("roles.moderator")}</Badge>
        </div>
      </div>

      <div className="admin-bulk card-shell">
        <strong>{selectedIds.length} selectionne(s)</strong>
        <Select
          id="bulk_action"
          label="Action"
          name="bulk_action"
          value={bulkAction}
          onChange={(event) => setBulkAction(event.target.value)}
          options={[
            { label: "Changer le statut", value: "change_status" },
            { label: "Changer le role", value: "change_role" },
          ]}
        />
        {bulkAction === "change_role" ? (
          <Select
            id="bulk_role"
            label="Role"
            name="bulk_role"
            value={bulkRole}
            onChange={(event) => setBulkRole(event.target.value)}
            options={options.roles.map((role) => ({ label: role, value: role }))}
          />
        ) : (
          <Select
            id="bulk_status"
            label="Statut"
            name="bulk_status"
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value)}
            options={options.statuses.map((status) => ({ label: status, value: status }))}
          />
        )}
        
        <Button 
        disabled={selectedIds.length === 0} 
        onClick={handleBulkUpdate} 
        type="button">
          Appliquer
        </Button>
      </div>

      <Table columns={columns} rows={filteredUsers} />

      {selectedUser ? (
        <aside className="admin-user-panel card-shell">
          <button className="panel-close" type="button" onClick={() => setSelectedUser(null)} title="Fermer"><X size={16} /></button>
          <Avatar name={selectedUser.full_name || selectedUser.username} src={selectedUser.avatar_url} />
          <h2>{selectedUser.full_name || selectedUser.username}</h2>
          <dl>
            <div><dt>ID</dt><dd>{selectedUser.id}</dd></div>
            <div><dt>Email</dt><dd>{selectedUser.email}</dd></div>
            <div><dt>Role</dt><dd>{selectedUser.role}</dd></div>
            <div><dt>Statut</dt><dd>{selectedUser.status}</dd></div>
          </dl>
        </aside>
      ) : null}

      {editingUser ? (
        <aside className="admin-user-panel card-shell">
          <button className="panel-close" type="button" onClick={() => setEditingUser(null)} title="Fermer"><X size={16} /></button>
          <h2>Modifier {editingUser.username}</h2>
          <form className="admin-user-form" onSubmit={handleSave}>
            <Input id="username" label="Pseudo" name="username" value={editForm.username} onChange={handleChange} />
            <Input id="full_name" label="Nom complet" name="full_name" value={editForm.full_name} onChange={handleChange} />
            <Input id="email" label="Email" name="email" value={editForm.email} onChange={handleChange} />
            <Input id="avatar_url" label="Avatar URL" name="avatar_url" value={editForm.avatar_url} onChange={handleChange} />
            <label className="field">
              <span>Uploader un avatar (2 Mo max)</span>
              <input accept="image/*" name="avatar_file" onChange={handleAvatarUpload} type="file" />
            </label>
            <Select
              id="role"
              label="Role"
              name="role"
              value={editForm.role}
              onChange={handleChange}
              options={options.roles.map((role) => ({ label: role, value: role }))}
            />
            <Select
              id="status"
              label="Statut"
              name="status"
              value={editForm.status}
              onChange={handleChange}
              options={options.statuses.map((status) => ({ label: status, value: status }))}
            />
            <Button icon={CheckCircle2} type="submit">Enregistrer</Button>
          </form>
        </aside>
      ) : null}
    </section>
  );
}

export default AdminUsers;
