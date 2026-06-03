// Icônes lucide-react : ban, validation, édition, lecture, rotation, recherche, corbeille, invitation, fermer
import { Ban, CheckCircle2, Edit3, Eye, RotateCcw, Search, Trash2, UserPlus, X } from "lucide-react";
// useEffect : exécute du code après le rendu (chargement initial des données)
// useMemo : mémoïse une valeur calculée pour éviter les recalculs inutiles
// useState : déclare les variables d'état locales du composant
import { useEffect, useMemo, useState } from "react";
// Hook i18n : fournit t() pour traduire les textes selon la langue active
import { useTranslation } from "react-i18next";

// Composants UI réutilisables
import Avatar from "@components/ui/Avatar/Avatar";
import Badge from "@components/ui/Badge/Badge";
import Button from "@components/ui/Button/Button";
import Input from "@components/ui/Input/Input";
import Select from "@components/ui/Select/Select";
import Table from "@components/ui/Table/Table";
// Services API utilisateurs : toutes les opérations CRUD + bulk
import {
  bulkUpdateAdminUsers,    // PATCH /admin/users/bulk — mise à jour en masse
  deleteUser,              // DELETE /users/:id
  getAdminUserFilterOptions, // GET /admin/users/options — rôles et statuts disponibles
  getUserById,             // GET /users/:id — détail complet d'un utilisateur
  getUsers,                // GET /users — liste paginée avec filtres
  updateAdminUserRole,     // PATCH /admin/users/:id/role — changement de rôle
  updateAdminUserStatus,   // PATCH /admin/users/:id/status — changement de statut
  updateUser,              // PUT /users/:id — mise à jour des champs de base
  uploadUserAvatar,        // POST /users/:id/avatar — upload d'avatar
} from "@services/usersService";

// Styles CSS propres à la page de gestion des utilisateurs admin
import "./AdminUsers.css";

// Valeurs initiales du formulaire d'édition d'un utilisateur
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

// Options de secours si l'API de filtre échoue (garantit que les selects sont toujours peuplés)
const fallbackOptions = {
  roles: ["admin", "owner", "editor", "moderator", "user"],
  statuses: ["active", "inactive", "suspended", "banned", "pending"],
};

// Composant page : gestion des utilisateurs par l'administrateur
function AdminUsers() {
  // t() : fonction de traduction
  const { t } = useTranslation();
  // users : liste complète des utilisateurs chargés depuis l'API
  const [users, setUsers] = useState([]);
  // query : valeur du champ de recherche pour le filtrage côté client
  const [query, setQuery] = useState("");
  // selectedUser : utilisateur affiché dans le panneau de lecture (fiche détail)
  const [selectedUser, setSelectedUser] = useState(null);
  // editingUser : utilisateur en cours d'édition dans le panneau latéral
  const [editingUser, setEditingUser] = useState(null);
  // editForm : données du formulaire d'édition (synchronisées avec editingUser)
  const [editForm, setEditForm] = useState(emptyEditForm);
  // feedback : message de retour (succès ou erreur) affiché sous l'en-tête
  const [feedback, setFeedback] = useState("");
  // selectedIds : tableau des IDs cochés pour les actions en masse
  const [selectedIds, setSelectedIds] = useState([]);
  // bulkAction : type d'action en masse sélectionnée ("change_status" ou "change_role")
  const [bulkAction, setBulkAction] = useState("change_status");
  // bulkRole : rôle cible pour l'action en masse "change_role"
  const [bulkRole, setBulkRole] = useState("moderator");
  // bulkStatus : statut cible pour l'action en masse "change_status"
  const [bulkStatus, setBulkStatus] = useState("suspended");
  // options : listes de rôles et statuts valides récupérées depuis l'API
  const [options, setOptions] = useState(fallbackOptions);

  // Charge la liste des utilisateurs depuis l'API avec le filtre de recherche courant
  const loadUsers = () => {
    getUsers({ search: query, filterBy: "all", limit: 100 })
      .then((response) => setUsers(Array.isArray(response) ? response : response.data || []))
      .catch((error) => setFeedback(error.message || "Impossible de charger les utilisateurs."));
  };

  // useEffect : exécuté une seule fois au montage du composant (tableau de dépendances vide [])
  // Charge simultanément la liste des utilisateurs ET les options de filtres disponibles
  useEffect(() => {
    loadUsers();
    // Appel API pour récupérer les rôles et statuts valides de la plateforme
    getAdminUserFilterOptions()
      .then((response) => setOptions(response.data || fallbackOptions))
      .catch(() => setOptions(fallbackOptions)); // En cas d'erreur, on utilise les options par défaut
  }, []);

  // filteredUsers : liste d'utilisateurs filtrée côté client selon la query
  // useMemo évite de recalculer si query et users ne changent pas entre les rendus
  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    // Si la recherche est vide, retourner tous les utilisateurs sans filtrage
    if (!search) return users;
    // Filtre sur username, email, full_name, role et platform_role
    return users.filter((user) =>
      [user.username, user.email, user.full_name, user.role, user.platform_role]
        .filter(Boolean) // Exclut les valeurs null/undefined
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [query, users]);

  // Normalise un objet utilisateur API en objet compatible avec le formulaire d'édition
  // Garantit que chaque champ a une valeur par défaut (jamais undefined)
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

  // handleRead : ouvre le panneau de lecture (fiche détail) pour un utilisateur
  // Appelle getUserById pour récupérer les données complètes
  const handleRead = async (user) => {
    try {
      const data = await getUserById(user.id);
      setSelectedUser(data);
      setEditingUser(null); // Ferme le panneau d'édition s'il était ouvert
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Impossible de lire cet utilisateur.");
    }
  };

  // handleEdit : ouvre le panneau d'édition pré-rempli pour un utilisateur
  // Appelle getUserById pour avoir les données les plus fraîches
  const handleEdit = async (user) => {
    try {
      const data = await getUserById(user.id);
      setEditingUser(data);
      setEditForm(normalizeUser(data)); // Pré-remplit le formulaire avec les données normalisées
      setSelectedUser(null); // Ferme le panneau de lecture s'il était ouvert
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Impossible de modifier cet utilisateur.");
    }
  };

  // Gestionnaire générique des champs du formulaire d'édition
  // Lit name + value depuis l'événement et met à jour le champ correspondant
  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  // handleAvatarUpload : upload d'un fichier avatar pour l'utilisateur en cours d'édition
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    // Annule si aucun fichier sélectionné ou si aucun utilisateur n'est en cours d'édition
    if (!file || !editingUser) return;
    // Validation côté client : 2 Mo maximum (même règle que le backend)
    if (file.size > 2 * 1024 * 1024) {
      setFeedback("L'avatar ne doit pas depasser 2 Mo.");
      return;
    }
    try {
      // Appel API upload — retourne l'URL publique du nouvel avatar
      const response = await uploadUserAvatar(editingUser.id, file);
      // Met à jour le formulaire avec l'URL du nouvel avatar
      setEditForm((current) => ({ ...current, avatar_url: response.avatar_url }));
      setFeedback("Avatar mis a jour.");
      loadUsers(); // Recharge la liste pour refléter le changement
    } catch (error) {
      setFeedback(error.message || "Upload avatar impossible.");
    }
  };

  // handleSave : sauvegarde les modifications du formulaire d'édition
  // Enchaîne 3 appels API séquentiels : updateUser, updateAdminUserRole, updateAdminUserStatus
  const handleSave = async (event) => {
    event.preventDefault(); // Empêche le rechargement de la page
    try {
      // 1. Mise à jour des champs de base (username, email, full_name, avatar_url)
      await updateUser(editingUser.id, {
        ...editForm,
        // Les champs critiques (is_active, platform_role, role, status) utilisent les valeurs actuelles
        is_active: editingUser.is_active ? 1 : 0,
        platform_role: editingUser.platform_role,
        role: editingUser.role,
        status: editingUser.status,
      });
      // 2. Mise à jour du rôle via l'endpoint admin dédié (avec traçabilité)
      await updateAdminUserRole(editingUser.id, editForm.role, "Modification depuis la fiche admin.");
      // 3. Mise à jour du statut via l'endpoint admin dédié (avec traçabilité)
      await updateAdminUserStatus(editingUser.id, editForm.status, "Modification depuis la fiche admin.");
    } catch (error) {
      setFeedback(error.message || "Impossible d'enregistrer cet utilisateur.");
      return; // Arrête ici en cas d'erreur (ne ferme pas le panneau)
    }
    setFeedback("Utilisateur mis à jour.");
    setEditingUser(null); // Ferme le panneau d'édition
    loadUsers(); // Recharge la liste
  };

  // handleToggleActive : bascule rapidement entre "active" et "suspended"
  // Utilisé via le bouton Ban/RotateCcw dans la colonne d'actions du tableau
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

  // handleRoleSelect : changement de rôle via le select inline du tableau
  const handleRoleSelect = async (user, role) => {
    try {
      await updateAdminUserRole(user.id, role, "Changement direct depuis le select admin.");
      setFeedback("Role utilisateur mis a jour.");
      loadUsers();
    } catch (error) {
      setFeedback(error.message || "Impossible de changer le role.");
    }
  };

  // handleStatusSelect : changement de statut via le select inline du tableau
  const handleStatusSelect = async (user, status) => {
    try {
      await updateAdminUserStatus(user.id, status, "Changement direct depuis le select admin.");
      setFeedback("Statut utilisateur mis a jour.");
      loadUsers();
    } catch (error) {
      setFeedback(error.message || "Impossible de changer le statut.");
    }
  };

  // handleToggleSelection : coche/décoche un utilisateur dans la sélection en masse
  // Ajoute l'id s'il n'est pas présent, le retire sinon (toggle)
  const handleToggleSelection = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  // handleBulkUpdate : applique l'action en masse à tous les utilisateurs sélectionnés
  // Envoie un seul appel API avec le tableau selectedIds, l'action, le rôle ou le statut cible
  const handleBulkUpdate = async () => {
    try {
      const response = await bulkUpdateAdminUsers({
        userIds: selectedIds,
        action: bulkAction,
        role: bulkRole,
        status: bulkStatus,
        reason: "Action en masse depuis /admin/users.",
      });
      // Affiche un récapitulatif du résultat (combien de modifiés, combien d'ignorés)
      setFeedback(`${response.summary.updated} utilisateur(s) modifie(s), ${response.summary.skipped} ignore(s).`);
      setSelectedIds([]); // Réinitialise la sélection après l'action
      loadUsers();
    } catch (error) {
      setFeedback(error.message || "Action en masse impossible.");
    }
  };

  // handleDelete : supprime définitivement un utilisateur après confirmation
  const handleDelete = async (user) => {
    // Demande une confirmation explicite avant toute suppression irréversible
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

  // Définition des colonnes du tableau des utilisateurs
  // Chaque colonne peut avoir un rendu personnalisé via la fonction render(row)
  const columns = [
    {
      key: "select",
      label: "",
      // Checkbox de sélection individuelle pour les actions en masse
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
      // Affiche l'avatar de l'utilisateur — src si disponible, sinon initiales générées
      render: (row) => <Avatar name={row.full_name || row.username || row.email} src={row.avatar_url} />,
    },
    {
      key: "username",
      label: t("table.user"),
      // Cellule username+fullname empilés verticalement
      render: (row) => <div className="user-cell"><strong>{row.username}</strong><span>{row.full_name}</span></div>,
    },
    { key: "email", label: t("auth.email") },
    {
      key: "role",
      label: "Role",
      // Select inline pour changer le rôle directement depuis le tableau
      // onChange appelle handleRoleSelect avec la nouvelle valeur sélectionnée
      render: (row) => (
        <select className="inline-admin-select" value={row.role || "user"} onChange={(event) => handleRoleSelect(row, event.target.value)} title="Changer le role">
          {/* options.roles : liste des rôles valides récupérée depuis l'API */}
          {options.roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      // Select inline pour changer le statut directement depuis le tableau
      render: (row) => (
        <select className="inline-admin-select" value={row.status || "active"} onChange={(event) => handleStatusSelect(row, event.target.value)} title="Changer le statut">
          {/* options.statuses : liste des statuts valides récupérée depuis l'API */}
          {options.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      // Boutons d'action rapide : lire, éditer, suspendre/réactiver, supprimer
      render: (row) => (
        <div className="table-actions">
          {/* Bouton lire : ouvre le panneau de fiche détail */}
          <button className="action-button action-button--view" type="button" aria-label="Lire" title="Lire" onClick={() => handleRead(row)}><Eye size={16} /></button>
          {/* Bouton éditer : ouvre le formulaire d'édition */}
          <button className="action-button action-button--edit" type="button" aria-label={t("common.edit")} title={t("common.edit")} onClick={() => handleEdit(row)}><Edit3 size={16} /></button>
          {/* Bouton suspendre/réactiver : icône Ban si actif, RotateCcw si suspendu */}
          <button className="action-button action-button--suspend" type="button" aria-label={row.status === "active" ? "Suspendre" : "Réactiver"} title={row.status === "active" ? "Suspendre" : "Réactiver"} onClick={() => handleToggleActive(row)}>
            {row.status === "active" ? <Ban size={16} /> : <RotateCcw size={16} />}
          </button>
          {/* Bouton supprimer : déclenche confirmation window.confirm */}
          <button className="action-button action-button--delete" type="button" aria-label={t("common.delete")} title={t("common.delete")} onClick={() => handleDelete(row)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    // Section principale de la page de gestion des utilisateurs
    <section className="by-page admin-users">

      {/* En-tête : titre + bouton d'invitation d'un nouvel utilisateur */}
      <header className="by-page-header">
        <div>
          <div className="by-eyebrow">{t("pages.adminUsers.eyebrow")}</div>
          <h1>{t("pages.adminUsers.title")}</h1>
          <p className="text-muted">{t("pages.adminUsers.description")}</p>
        </div>
        <Button icon={UserPlus}>{t("actions.invite")}</Button>
      </header>

      {/* Message de feedback — affiché uniquement si feedback est non vide */}
      {feedback ? <p className="admin-feedback">{feedback}</p> : null}

      {/* Barre d'outils : champ de recherche + filtres par rôle (chips) */}
      <div className="admin-toolbar card-shell">
        <label className="admin-search">
          <Search size={17} />
          {/* Champ de recherche : met à jour query qui filtre filteredUsers via useMemo */}
          <input onChange={(event) => setQuery(event.target.value)} placeholder={t("pages.adminUsers.searchPlaceholder")} type="search" value={query} />
        </label>
        {/* Filtres rapides sous forme de chips : filtrent visuellement la table par rôle */}
        <div className="chip-row">
          <Badge tone="admin">{t("roles.admin")}</Badge>
          <Badge tone="owner">{t("roles.owner")}</Badge>
          <Badge tone="editor">{t("roles.editor")}</Badge>
          <Badge tone="moderator">{t("roles.moderator")}</Badge>
        </div>
      </div>

      {/* Panneau d'actions en masse : visible si des utilisateurs sont cochés */}
      <div className="admin-bulk card-shell">
        {/* Compteur d'utilisateurs sélectionnés */}
        <strong>{selectedIds.length} selectionne(s)</strong>
        {/* Sélecteur de type d'action : changer le statut ou le rôle */}
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
        {/* Rendu conditionnel : affiche le select Rôle ou Statut selon l'action choisie */}
        {bulkAction === "change_role" ? (
          // Sélecteur du rôle cible pour l'action en masse
          <Select
            id="bulk_role"
            label="Role"
            name="bulk_role"
            value={bulkRole}
            onChange={(event) => setBulkRole(event.target.value)}
            options={options.roles.map((role) => ({ label: role, value: role }))}
          />
        ) : (
          // Sélecteur du statut cible pour l'action en masse
          <Select
            id="bulk_status"
            label="Statut"
            name="bulk_status"
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value)}
            options={options.statuses.map((status) => ({ label: status, value: status }))}
          />
        )}
        {/* Bouton d'application : désactivé si aucun utilisateur n'est sélectionné */}
        <Button 
        disabled={selectedIds.length === 0} 
        onClick={handleBulkUpdate} 
        type="button">
          Appliquer
        </Button>
      </div>

      {/* Tableau principal : affiche filteredUsers avec toutes les colonnes définies */}
      <Table columns={columns} rows={filteredUsers} />

      {/* Panneau latéral de lecture (fiche détail) — affiché uniquement si selectedUser est défini */}
      {selectedUser ? (
        <aside className="admin-user-panel card-shell">
          {/* Bouton de fermeture du panneau */}
          <button className="panel-close" type="button" onClick={() => setSelectedUser(null)} title="Fermer"><X size={16} /></button>
          <Avatar name={selectedUser.full_name || selectedUser.username} src={selectedUser.avatar_url} />
          <h2>{selectedUser.full_name || selectedUser.username}</h2>
          {/* Liste de définitions : chaque <div> regroupe un label (dt) et une valeur (dd) */}
          <dl>
            <div><dt>ID</dt><dd>{selectedUser.id}</dd></div>
            <div><dt>Email</dt><dd>{selectedUser.email}</dd></div>
            <div><dt>Role</dt><dd>{selectedUser.role}</dd></div>
            <div><dt>Statut</dt><dd>{selectedUser.status}</dd></div>
          </dl>
        </aside>
      ) : null}

      {/* Panneau latéral d'édition — affiché uniquement si editingUser est défini */}
      {editingUser ? (
        <aside className="admin-user-panel card-shell">
          {/* Bouton de fermeture du panneau */}
          <button className="panel-close" type="button" onClick={() => setEditingUser(null)} title="Fermer"><X size={16} /></button>
          <h2>Modifier {editingUser.username}</h2>
          {/* Formulaire d'édition : onSubmit appelle handleSave (3 appels API séquentiels) */}
          <form className="admin-user-form" onSubmit={handleSave}>
            <Input id="username" label="Pseudo" name="username" value={editForm.username} onChange={handleChange} />
            <Input id="full_name" label="Nom complet" name="full_name" value={editForm.full_name} onChange={handleChange} />
            <Input id="email" label="Email" name="email" value={editForm.email} onChange={handleChange} />
            <Input id="avatar_url" label="Avatar URL" name="avatar_url" value={editForm.avatar_url} onChange={handleChange} />
            {/* Champ fichier pour l'upload d'avatar — limité à 2 Mo côté client */}
            <label className="field">
              <span>Uploader un avatar (2 Mo max)</span>
              <input accept="image/*" name="avatar_file" onChange={handleAvatarUpload} type="file" />
            </label>
            {/* Sélecteur de rôle : options.roles peuplé depuis l'API */}
            <Select
              id="role"
              label="Role"
              name="role"
              value={editForm.role}
              onChange={handleChange}
              options={options.roles.map((role) => ({ label: role, value: role }))}
            />
            {/* Sélecteur de statut : options.statuses peuplé depuis l'API */}
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

// Export par défaut pour le routeur React
export default AdminUsers;
