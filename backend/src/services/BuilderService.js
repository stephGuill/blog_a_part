// ─────────────────────────────────────────────────────────────────────────────
// BuilderService.js
// Service métier du Page Builder visuel.
//
// ARCHITECTURE : le builder suit un pattern hiérarchique à 3 niveaux :
//   Page  →  Section(s)  →  Bloc(s)
//
//   • Une Page appartient à un blog et représente une page web complète.
//   • Une Section est une zone de mise en page à l'intérieur d'une page
//     (ex. : bandeau hero, grille de cartes, pied de page...).
//   • Un Bloc est l'unité de contenu atomique à l'intérieur d'une section
//     (ex. : paragraphe, image, titre, bouton...).
//
// SÉRIALISATION JSON :
//   Les colonnes `layout_json`, `grid_config`, `style_json`,
//   `settings_json` et `content_json` sont stockées en base sous forme
//   de chaîne JSON (TEXT/JSON MySQL). Les fonctions `toJsonValue` et
//   `normalizeXxx` les désérialisent en objets JS à la lecture.
//   `assertSafeJson` valide et sécurise avant écriture.
// ─────────────────────────────────────────────────────────────────────────────

// Module natif Node.js pour les opérations fichier asynchrones (lecture, suppression de SVG)
const fs = require("node:fs/promises");
// Module natif Node.js pour manipuler les chemins de fichiers (basename, etc.)
const path = require("node:path");

// Bibliothèque tierce pour convertir un titre en slug URL-friendly (ex. "Mon Titre" → "mon-titre")
const slugify = require("slugify");

// Accès centralisé à tous les modèles de base de données (builder, media, auditLogs…)
const models = require("../models");
// Utilitaire qui filtre les propriétés CSS autorisées dans style_json pour éviter les injections
const { sanitizeStyleJson } = require("../utils/allowedStyles");
// Constantes des valeurs autorisées pour chaque champ énuméré du builder
const {
  BUILDER_BLOCK_TYPES,        // Types de blocs valides : "paragraph", "image", "heading", etc.
  BUILDER_HEADING_LEVELS,     // Niveaux de titre valides : h1, h2, h3…
  BUILDER_MEDIA_USAGE_TYPES,  // Contextes d'usage d'un média : "content", "background", etc.
  BUILDER_PAGE_STATUSES,      // Statuts de page valides : "draft", "published", "archived"
  BUILDER_PAGE_TYPES,         // Types de page valides : "page", "landing", etc.
  BUILDER_SECTION_TYPES,      // Types de section valides : "content", "hero", "grid", etc.
  isAllowed,                  // Fonction helper qui vérifie qu'une valeur appartient à une liste blanche
} = require("../utils/builderTypes");

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES PRIVÉS (non exportés, usage interne au service)
// ─────────────────────────────────────────────────────────────────────────────

// Crée une erreur HTTP avec un code de statut personnalisé.
// Utilisé pour remonter des erreurs métier lisibles par le middleware d'erreur Express.
function createHttpError(statusCode, message) {
  const error = new Error(message); // Crée une instance d'erreur JS standard
  error.statusCode = statusCode;    // Attache le code HTTP (400, 404…) à l'objet erreur
  return error;                     // Retourne l'erreur enrichie (sera interceptée par next(error))
}

// Désérialise une valeur JSON stockée en base sous forme de chaîne.
// Si la valeur est déjà un objet JS, elle est retournée telle quelle.
// Si la valeur est null, undefined ou vide, retourne le `fallback` fourni.
function toJsonValue(value, fallback = null) {
  if (value == null || value === "") return fallback; // Valeur absente → retourne le fallback
  if (typeof value === "string") {                    // Chaîne JSON à parser
    try {
      return JSON.parse(value);                       // Tente la désérialisation JSON
    } catch {
      return fallback;                                // JSON malformé → retourne le fallback
    }
  }
  return value; // Déjà un objet/array JS → retour direct sans transformation
}

// Valide et sécurise une valeur JSON avant son écriture en base.
// Détecte les tentatives d'injection XSS (balises <script>, handlers JS inline…).
// Lance une erreur HTTP 400 si du contenu dangereux est détecté.
function assertSafeJson(value, fieldName) {
  // Désérialise la valeur en objet JS (ou utilise la valeur brute si déjà objet)
  const jsonValue = toJsonValue(value, value || {});
  // Re-sérialise en chaîne pour pouvoir appliquer la regex de détection XSS
  const serialized = JSON.stringify(jsonValue || {});

  // Détecte les patterns XSS courants : <script>, javascript:, onerror=, onload=
  if (/<script|javascript:|onerror\s*=|onload\s*=/i.test(serialized)) {
    throw createHttpError(400, `${fieldName} contient du contenu potentiellement dangereux.`);
  }

  return jsonValue || {}; // Retourne l'objet JS sécurisé (jamais null)
}

// Génère un slug URL-friendly à partir d'une valeur ou d'un fallback.
// Exemple : "Mon Article de Blog" → "mon-article-de-blog"
// `strict: true` supprime les caractères spéciaux non alphanumériques.
function normalizeSlug(value, fallback) {
  return slugify(value || fallback || "", { lower: true, strict: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS DE NORMALISATION
// Transforment une ligne brute de BDD en objet JS propre :
// • Désérialisent les colonnes JSON stockées en TEXT
// • Convertissent les flags BDD (0/1) en booléens JS natifs
// ─────────────────────────────────────────────────────────────────────────────

// Normalise une ligne de la table `builder_pages`.
// Désérialise uniquement `layout_json` (configuration de mise en page de la page).
function normalizePage(row) {
  if (!row) return null; // Retourne null si la ligne est absente (page non trouvée)

  return {
    ...row,                                      // Copie toutes les colonnes brutes de la BDD
    layout_json: toJsonValue(row.layout_json, {}), // Désérialise le JSON de layout (objet ou {} par défaut)
  };
}

// Normalise une ligne de la table `builder_sections`.
// Désérialise grid_config, style_json, settings_json et convertit is_visible en booléen.
function normalizeSection(row) {
  if (!row) return null; // Retourne null si la section n'existe pas en BDD

  return {
    ...row,                                                  // Copie toutes les colonnes brutes
    grid_config: toJsonValue(row.grid_config, {}),           // Config de grille CSS (colonnes, gaps…)
    style_json: toJsonValue(row.style_json, {}),             // Styles visuels de la section (couleurs, padding…)
    settings_json: toJsonValue(row.settings_json, {}),       // Paramètres comportementaux de la section
    is_visible: Boolean(row.is_visible),                     // Convertit 0/1 MySQL en true/false JS
  };
}

// Normalise une ligne de la table `builder_blocks`.
// Désérialise content_json, style_json, settings_json et convertit is_visible en booléen.
function normalizeBlock(row) {
  if (!row) return null; // Retourne null si le bloc n'existe pas en BDD

  return {
    ...row,                                                  // Copie toutes les colonnes brutes
    content_json: toJsonValue(row.content_json, {}),         // Contenu du bloc (texte, url image, niveau titre…)
    style_json: toJsonValue(row.style_json, {}),             // Styles CSS personnalisés du bloc
    settings_json: toJsonValue(row.settings_json, {}),       // Paramètres avancés du bloc (target lien, lazy-load…)
    is_visible: Boolean(row.is_visible),                     // Convertit 0/1 MySQL en true/false JS
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSE PRINCIPALE DU SERVICE
//
// Pattern : Page → Section → Bloc
//   • Chaque méthode reçoit blogId pour vérifier l'appartenance au blog
//   • Toutes les mutations sont tracées dans la table audit_logs
// ─────────────────────────────────────────────────────────────────────────────
class BuilderService {
  // ───────────────────────────────────────────────────────────────────────────
  // AUDIT LOG
  // Enregistre chaque action significative (création, mise à jour, suppression…)
  // dans la table audit_logs pour la traçabilité et la conformité.
  // ───────────────────────────────────────────────────────────────────────────

  // Insère une entrée dans la table audit_logs.
  // Paramètres : actorUserId (qui a agi), targetType (type d'entité), targetId (id de l'entité),
  //              action (nom de l'action ex. "builder.page_created"), metadata (données contextuelles).
  async logAction({ actorUserId, targetType, targetId, action, metadata }) {
    await models.auditLogs.insert({
      actor_user_id: actorUserId,      // Identifiant de l'utilisateur ayant déclenché l'action
      target_type: targetType,         // Type de la ressource ciblée : "builder_page", "builder_section"…
      target_id: targetId,             // Identifiant numérique de la ressource ciblée
      action,                          // Libellé de l'action (convention : "domaine.action_verbe")
      metadata_json: metadata || {},   // Données contextuelles supplémentaires (blogId, slug…)
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PAGES — Lecture
  // ───────────────────────────────────────────────────────────────────────────

  // Liste toutes les pages builder d'un blog (sans sections ni blocs, vue liste).
  // Retourne un tableau d'objets page normalisés.
  async listPages(blogId) {
    // Récupère toutes les pages du blog depuis la BDD (résultat MySQL : [rows, fields])
    const [rows] = await models.builder.findPagesByBlogId(Number(blogId));
    // Normalise chaque ligne : désérialise layout_json de TEXT → objet JS
    return rows.map(normalizePage);
  }

  // Récupère une page builder complète avec l'arborescence sections + blocs imbriqués.
  // C'est la principale méthode de lecture : elle reconstruit l'objet complet du builder.
  async getPage(blogId, pageId) {
    // Cherche la page en BDD en filtrant sur blogId ET pageId (sécurité multi-tenant)
    const [pageRows] = await models.builder.findPageById(Number(blogId), Number(pageId));
    // Normalise la première (et unique) ligne retournée
    const page = normalizePage(pageRows[0]);

    // Si aucune ligne n'est retournée, la page n'existe pas → erreur 404
    if (!page) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    // Récupère toutes les sections de la page (triées par sort_order)
    const [sectionRows] = await models.builder.findSectionsByPageId(page.id);
    // Récupère tous les blocs de la page en une seule requête (optimisation : évite N+1)
    const [blockRows] = await models.builder.findBlocksByPageId(page.id);

    // Regroupe les blocs par section_id dans une Map pour un accès O(1) par section.
    // Chaque entrée : Map { sectionId → [bloc1, bloc2, …] }
    const blocksBySection = blockRows.map(normalizeBlock).reduce((map, block) => {
      // Ajoute le bloc à la liste existante pour cette section (ou crée un nouveau tableau)
      map.set(block.section_id, [...(map.get(block.section_id) || []), block]);
      return map; // Retourne la Map accumulée à chaque itération
    }, new Map()); // Initialise avec une Map vide

    // Retourne la page complète avec les sections imbriquées,
    // chaque section contenant ses blocs associés (depuis la Map)
    return {
      ...page, // Toutes les propriétés de la page (id, title, slug, status, layout_json…)
      sections: sectionRows.map(normalizeSection).map((section) => ({
        ...section,                                          // Toutes les propriétés de la section
        blocks: blocksBySection.get(section.id) || [],      // Blocs de cette section ([] si aucun)
      })),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PAGES — Création
  // ───────────────────────────────────────────────────────────────────────────

  // Crée une nouvelle page builder pour un blog.
  // Valide le titre, le type, le statut, génère le slug et persiste en BDD.
  async createPage(blogId, userId, payload) {
    // Nettoie les espaces superflus du titre (trim) et extrait la valeur
    const title = payload.title?.trim();

    // Le titre est obligatoire pour créer une page → erreur 400 si absent
    if (!title) {
      throw createHttpError(400, "Le titre de la page est obligatoire.");
    }

    // Détermine le type de page (défaut : "page" si non fourni)
    const type = payload.type || "page";
    // Détermine le statut initial (défaut : "draft" si non fourni)
    const status = payload.status || "draft";

    // Vérifie que le type de page est dans la liste blanche BUILDER_PAGE_TYPES
    if (!isAllowed(type, BUILDER_PAGE_TYPES)) {
      throw createHttpError(400, "Type de page builder invalide.");
    }

    // Vérifie que le statut est dans la liste blanche BUILDER_PAGE_STATUSES
    if (!isAllowed(status, BUILDER_PAGE_STATUSES)) {
      throw createHttpError(400, "Statut de page builder invalide.");
    }

    // Construit l'objet page à insérer en BDD
    const page = {
      blog_id: Number(blogId),                                                  // Clé étrangère vers le blog
      owner_id: userId,                                                          // Créateur de la page
      title,                                                                     // Titre nettoyé
      slug: normalizeSlug(payload.slug, title),                                  // Slug depuis payload ou généré depuis le titre
      type,                                                                      // Type de page validé
      status,                                                                    // Statut initial (draft)
      seo_title: payload.seo_title,                                              // Titre SEO optionnel (balise <title>)
      seo_description: payload.seo_description,                                  // Description SEO optionnelle (meta description)
      layout_json: assertSafeJson(payload.layout_json, "layout_json"),           // Config de layout sécurisée
    };

    // Le slug est indispensable pour l'URL de la page → erreur si slugify retourne une chaîne vide
    if (!page.slug) {
      throw createHttpError(400, "Le slug de la page est invalide.");
    }

    // Insère la page en BDD ; result.insertId contient l'id auto-incrémenté
    const [result] = await models.builder.createPage(page);
    // Trace l'action dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: result.insertId,             // Id de la page nouvellement créée
      action: "builder.page_created",
      metadata: { blogId: Number(blogId), slug: page.slug },
    });

    // Retourne la page complète (avec sections vides) via getPage
    return this.getPage(blogId, result.insertId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PAGES — Mise à jour
  // ───────────────────────────────────────────────────────────────────────────

  // Met à jour les métadonnées d'une page builder existante.
  // Fonctionne en mode "patch partiel" : seuls les champs fournis dans payload remplacent les valeurs actuelles.
  async updatePage(blogId, pageId, userId, payload) {
    // Récupère l'état actuel de la page depuis la BDD pour appliquer les valeurs par défaut
    const [rows] = await models.builder.findPageById(Number(blogId), Number(pageId));
    const current = normalizePage(rows[0]); // Normalise la ligne brute en objet JS

    // Si la page n'existe pas, impossible de mettre à jour → erreur 404
    if (!current) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    // Détermine le prochain statut : payload ou conservation de l'actuel
    const nextStatus = payload.status || current.status;
    // Détermine le prochain type : payload ou conservation de l'actuel
    const nextType = payload.type || current.type;

    // Validation du type de page (liste blanche)
    if (!isAllowed(nextType, BUILDER_PAGE_TYPES)) {
      throw createHttpError(400, "Type de page builder invalide.");
    }

    // Validation du statut de page (liste blanche)
    if (!isAllowed(nextStatus, BUILDER_PAGE_STATUSES)) {
      throw createHttpError(400, "Statut de page builder invalide.");
    }

    // Construit le nouvel état de la page en fusionnant l'état actuel et le payload
    const nextPage = {
      ...current,                                                                          // Conserve toutes les propriétés actuelles
      title: payload.title?.trim() || current.title,                                       // Nouveau titre ou conservation de l'actuel
      slug: normalizeSlug(payload.slug || current.slug, current.title),                    // Nouveau slug ou re-normalisation de l'actuel
      type: nextType,                                                                       // Type mis à jour
      status: nextStatus,                                                                   // Statut mis à jour
      seo_title: payload.seo_title ?? current.seo_title,                                   // ?? : null est une valeur valide pour effacer le SEO title
      seo_description: payload.seo_description ?? current.seo_description,                 // ?? : null est une valeur valide
      layout_json: payload.layout_json ? assertSafeJson(payload.layout_json, "layout_json") : current.layout_json, // Nouveau layout sécurisé ou conservation
    };

    // Un slug vide après normalisation est invalide
    if (!nextPage.slug) {
      throw createHttpError(400, "Le slug de la page est invalide.");
    }

    // Persiste la mise à jour en BDD
    await models.builder.updatePage(nextPage);
    // Trace la mise à jour dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_updated",
      metadata: { blogId: Number(blogId) },
    });

    // Retourne la page rechargée depuis la BDD (état le plus récent)
    return this.getPage(blogId, pageId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PAGES — Archivage (suppression douce)
  // ───────────────────────────────────────────────────────────────────────────

  // Archive une page builder (soft delete : change le statut en "archived" sans supprimer la ligne).
  // Retourne sans valeur en cas de succès (le contrôleur envoie un 204 No Content).
  async archivePage(blogId, pageId, userId) {
    // Exécute l'archivage en BDD (UPDATE status = 'archived' WHERE blog_id = ? AND id = ?)
    const [result] = await models.builder.archivePage(Number(blogId), Number(pageId));

    // affectedRows = 0 signifie qu'aucune ligne ne correspondait aux critères → 404
    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    // Trace l'archivage dans l'audit log avec le mode "archived"
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_deleted",                      // Convention : "deleted" couvre l'archivage
      metadata: { blogId: Number(blogId), mode: "archived" }, // mode: "archived" distingue du hard delete
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SECTIONS — Validation du payload
  // ───────────────────────────────────────────────────────────────────────────

  // Valide et normalise les données d'une section reçues du client.
  // Utilisé à la fois par createSection et updateSection (DRY).
  // `current` contient les valeurs actuelles (pour le mode patch partiel lors d'une update).
  validateSectionPayload(payload, current = {}) {
    // Résout le type de section depuis payload (deux orthographes acceptées) ou la valeur actuelle, défaut "content"
    const sectionType = payload.section_type || payload.sectionType || current.section_type || "content";

    // Vérifie que le type de section est dans la liste blanche
    if (!isAllowed(sectionType, BUILDER_SECTION_TYPES)) {
      throw createHttpError(400, "Type de section invalide.");
    }

    // Retourne l'objet section validé et normalisé prêt à être écrit en BDD
    return {
      parent_section_id: payload.parent_section_id ?? current.parent_section_id ?? null, // Section parente (pour sous-sections imbriquées)
      section_type: sectionType,                                                           // Type de section validé
      name: payload.name ?? current.name ?? null,                                          // Nom optionnel (label d'édition dans le builder)
      sort_order: Number(payload.sort_order ?? current.sort_order ?? 0),                  // Position dans la page (commence à 0)
      grid_config: assertSafeJson(payload.grid_config ?? current.grid_config ?? {}, "grid_config"),            // Config CSS grid sécurisée
      style_json: sanitizeStyleJson(assertSafeJson(payload.style_json ?? current.style_json ?? {}, "style_json")), // Styles CSS filtrés ET sécurisés
      settings_json: assertSafeJson(payload.settings_json ?? current.settings_json ?? {}, "settings_json"),    // Paramètres avancés sécurisés
      is_visible: payload.is_visible ?? current.is_visible ?? true,                       // Visibilité (true par défaut)
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SECTIONS — CRUD
  // ───────────────────────────────────────────────────────────────────────────

  // Crée une nouvelle section dans une page builder existante.
  // Vérifie d'abord que la page appartient bien au blog avant d'insérer.
  async createSection(blogId, pageId, userId, payload) {
    // Vérification que la page existe et appartient au blog (lance 404 si non)
    await this.getPage(blogId, pageId);
    // Valide et normalise le payload de la section
    const section = this.validateSectionPayload(payload);
    // Insère la section en BDD avec la clé étrangère page_id
    const [result] = await models.builder.createSection({ ...section, page_id: Number(pageId) });

    // Trace la création dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: result.insertId,          // Id de la section nouvellement créée
      action: "builder.section_created",
      metadata: { blogId: Number(blogId), pageId: Number(pageId) },
    });

    // Recharge la section depuis la BDD pour retourner l'état normalisé
    const [rows] = await models.builder.findSectionById(Number(blogId), Number(pageId), result.insertId);
    return normalizeSection(rows[0]); // Retourne l'objet section normalisé
  }

  // Met à jour une section builder existante (mode patch partiel).
  async updateSection(blogId, pageId, sectionId, userId, payload) {
    // Récupère l'état actuel de la section (avec vérification d'appartenance au blog et à la page)
    const [rows] = await models.builder.findSectionById(Number(blogId), Number(pageId), Number(sectionId));
    const current = normalizeSection(rows[0]); // Normalise la ligne brute

    // Si la section n'existe pas → erreur 404
    if (!current) {
      throw createHttpError(404, "Section builder introuvable.");
    }

    // Valide le payload en utilisant `current` comme base pour les champs non fournis
    const section = this.validateSectionPayload(payload, current);
    // Persiste la mise à jour en BDD en ajoutant l'id de la section à mettre à jour
    await models.builder.updateSection({ ...section, id: Number(sectionId) });

    // Trace la mise à jour dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: Number(sectionId),
      action: "builder.section_updated",
      metadata: { blogId: Number(blogId), pageId: Number(pageId) },
    });

    // Recharge et retourne la section depuis la BDD (état le plus récent)
    const [updatedRows] = await models.builder.findSectionById(Number(blogId), Number(pageId), Number(sectionId));
    return normalizeSection(updatedRows[0]);
  }

  // Supprime définitivement une section et (en cascade BDD) tous ses blocs.
  async deleteSection(blogId, pageId, sectionId, userId) {
    // Vérifie que la section existe et appartient au bon blog/page avant suppression
    const [rows] = await models.builder.findSectionById(Number(blogId), Number(pageId), Number(sectionId));
    if (!rows[0]) {
      throw createHttpError(404, "Section builder introuvable."); // Section inexistante → 404
    }

    // Supprime la section (les blocs orphelins sont supprimés via la contrainte ON DELETE CASCADE)
    await models.builder.deleteSection(Number(sectionId));
    // Trace la suppression dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: Number(sectionId),
      action: "builder.section_deleted",
      metadata: { blogId: Number(blogId), pageId: Number(pageId) },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BLOCS — Validation du payload
  // ───────────────────────────────────────────────────────────────────────────

  // Valide et normalise les données d'un bloc reçues du client.
  // Utilisé à la fois par createBlock et updateBlock (DRY).
  // `current` contient les valeurs actuelles pour le mode patch partiel.
  validateBlockPayload(payload, current = {}) {
    // Résout le type de bloc depuis payload (deux orthographes) ou la valeur actuelle, défaut "paragraph"
    const blockType = payload.block_type || payload.blockType || current.block_type || "paragraph";

    // Vérifie que le type de bloc est dans la liste blanche BUILDER_BLOCK_TYPES
    if (!isAllowed(blockType, BUILDER_BLOCK_TYPES)) {
      throw createHttpError(400, "Type de bloc invalide.");
    }

    // Sécurise et désérialise content_json (le contenu propre au type de bloc)
    const contentJson = assertSafeJson(payload.content_json ?? current.content_json ?? {}, "content_json");

    // Validation spécifique aux blocs de type "heading" :
    // si un niveau de titre est fourni, il doit être dans la liste blanche (h1–h6)
    if (blockType === "heading" && contentJson.level && !isAllowed(contentJson.level, BUILDER_HEADING_LEVELS)) {
      throw createHttpError(400, "Niveau de titre invalide.");
    }

    // Retourne l'objet bloc validé et normalisé prêt à être écrit en BDD
    return {
      parent_block_id: payload.parent_block_id ?? current.parent_block_id ?? null, // Bloc parent (pour blocs imbriqués)
      block_type: blockType,                                                         // Type de bloc validé
      name: payload.name ?? current.name ?? null,                                    // Nom optionnel (label dans l'interface)
      content_json: contentJson,                                                     // Contenu sécurisé du bloc
      style_json: sanitizeStyleJson(assertSafeJson(payload.style_json ?? current.style_json ?? {}, "style_json")), // Styles filtrés ET sécurisés
      settings_json: assertSafeJson(payload.settings_json ?? current.settings_json ?? {}, "settings_json"),        // Paramètres avancés sécurisés
      sort_order: Number(payload.sort_order ?? current.sort_order ?? 0),            // Position dans la section
      is_visible: payload.is_visible ?? current.is_visible ?? true,                 // Visibilité (true par défaut)
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BLOCS — CRUD
  // ───────────────────────────────────────────────────────────────────────────

  // Crée un nouveau bloc dans une section du builder.
  // Vérifie que la section appartient au blog avant d'insérer.
  async createBlock(blogId, sectionId, userId, payload) {
    // Vérifie que la section existe et appartient bien au blog (sécurité multi-tenant)
    const [sectionRows] = await models.builder.findSectionByBlog(Number(sectionId), Number(blogId));
    if (!sectionRows[0]) {
      throw createHttpError(404, "Section builder introuvable pour ce blog."); // Sécurité : la section doit appartenir au blog
    }

    // Valide et normalise le payload du bloc
    const block = this.validateBlockPayload(payload);
    // Insère le bloc en BDD avec la clé étrangère section_id
    const [result] = await models.builder.createBlock({ ...block, section_id: Number(sectionId) });

    // Trace la création dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_block",
      targetId: result.insertId,          // Id du bloc nouvellement créé
      action: "builder.block_created",
      metadata: { blogId: Number(blogId), sectionId: Number(sectionId) },
    });

    // Recharge le bloc depuis la BDD pour retourner l'état normalisé
    const [rows] = await models.builder.findBlockById(Number(blogId), result.insertId);
    return normalizeBlock(rows[0]); // Retourne l'objet bloc normalisé
  }

  // Met à jour un bloc builder existant (mode patch partiel).
  async updateBlock(blogId, blockId, userId, payload) {
    // Récupère l'état actuel du bloc (avec vérification d'appartenance au blog)
    const [rows] = await models.builder.findBlockById(Number(blogId), Number(blockId));
    const current = normalizeBlock(rows[0]); // Normalise la ligne brute

    // Si le bloc n'existe pas → erreur 404
    if (!current) {
      throw createHttpError(404, "Bloc builder introuvable.");
    }

    // Valide le payload en utilisant `current` comme base pour les champs non fournis
    const block = this.validateBlockPayload(payload, current);
    // Persiste la mise à jour en BDD
    await models.builder.updateBlock({ ...block, id: Number(blockId) });

    // Trace la mise à jour dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_block",
      targetId: Number(blockId),
      action: "builder.block_updated",
      metadata: { blogId: Number(blogId) },
    });

    // Recharge et retourne le bloc depuis la BDD (état le plus récent)
    const [updatedRows] = await models.builder.findBlockById(Number(blogId), Number(blockId));
    return normalizeBlock(updatedRows[0]);
  }

  // Supprime définitivement un bloc builder.
  async deleteBlock(blogId, blockId, userId) {
    // Vérifie que le bloc existe et appartient au bon blog avant suppression
    const [rows] = await models.builder.findBlockById(Number(blogId), Number(blockId));
    if (!rows[0]) {
      throw createHttpError(404, "Bloc builder introuvable."); // Bloc inexistant → 404
    }

    // Supprime le bloc en BDD
    await models.builder.deleteBlock(Number(blockId));
    // Trace la suppression dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_block",
      targetId: Number(blockId),
      action: "builder.block_deleted",
      metadata: { blogId: Number(blogId) },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RÉORDONNANCEMENT
  // Permet au builder de réorganiser l'ordre d'affichage des sections/blocs
  // par drag & drop côté client. Le client envoie un tableau [{id, sort_order}].
  // ───────────────────────────────────────────────────────────────────────────

  // Réordonne les sections d'une page en mettant à jour leur sort_order.
  // `items` : tableau d'objets { id: number, sort_order: number } envoyé par le client.
  async reorderSections(blogId, pageId, userId, items = []) {
    // Vérifie que la page existe et appartient au blog (lance 404 si non)
    await this.getPage(blogId, pageId);

    // Valide que items est bien un tableau (protection contre les données malformées)
    if (!Array.isArray(items)) {
      throw createHttpError(400, "La liste de réordonnancement des sections est invalide.");
    }

    // Met à jour le sort_order de chaque section en une seule opération batch
    // Normalise les ids et sort_orders en Number pour éviter les erreurs de typage
    await models.builder.reorderSections(items.map((item) => ({ id: Number(item.id), sort_order: Number(item.sort_order) })));
    // Trace le réordonnancement dans l'audit log avec le nombre de sections affectées
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.sections_reordered",
      metadata: { blogId: Number(blogId), count: items.length }, // count : nombre de sections réordonnées
    });

    // Retourne la page complète rechargée (avec le nouvel ordre des sections)
    return this.getPage(blogId, pageId);
  }

  // Réordonne les blocs d'une section en mettant à jour leur sort_order.
  // `items` : tableau d'objets { id: number, sort_order: number } envoyé par le client.
  async reorderBlocks(blogId, sectionId, userId, items = []) {
    // Vérifie que la section existe et appartient au blog (sécurité multi-tenant)
    const [sectionRows] = await models.builder.findSectionByBlog(Number(sectionId), Number(blogId));
    if (!sectionRows[0]) {
      throw createHttpError(404, "Section builder introuvable pour ce blog."); // Section hors-scope → 404
    }

    // Valide que items est bien un tableau
    if (!Array.isArray(items)) {
      throw createHttpError(400, "La liste de réordonnancement des blocs est invalide.");
    }

    // Met à jour le sort_order de chaque bloc en une seule opération batch
    await models.builder.reorderBlocks(items.map((item) => ({ id: Number(item.id), sort_order: Number(item.sort_order) })));
    // Trace le réordonnancement dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: Number(sectionId),
      action: "builder.blocks_reordered",
      metadata: { blogId: Number(blogId), count: items.length }, // count : nombre de blocs réordonnés
    });

    // Recharge et retourne tous les blocs de la section dans le nouvel ordre
    const [blocks] = await models.builder.findBlocksBySectionId(Number(sectionId));
    return blocks.map(normalizeBlock); // Normalise chaque bloc avant retour
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LAYOUT — Sauvegarde de la configuration de mise en page
  // layout_json est un objet libre permettant au builder de stocker la disposition
  // globale des sections (positions, largeurs, responsive breakpoints…).
  // ───────────────────────────────────────────────────────────────────────────

  // Sauvegarde la configuration de layout d'une page (persistance de l'état du builder visuel).
  async saveLayout(blogId, pageId, userId, layoutJson) {
    // Sécurise le layout JSON avant persistance (détection XSS, désérialisation)
    const safeLayout = assertSafeJson(layoutJson, "layout_json");
    // Met à jour la colonne layout_json de la page en BDD
    const [result] = await models.builder.saveLayout(Number(blogId), Number(pageId), safeLayout);

    // Si aucune ligne n'a été affectée, la page n'existe pas → 404
    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    // Trace la sauvegarde du layout dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.layout_saved",
      metadata: { blogId: Number(blogId) },
    });

    // Retourne la page rechargée avec le nouveau layout
    return this.getPage(blogId, pageId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PUBLICATION / DÉPUBLICATION
  // Changement du statut d'une page pour la rendre visible (ou invisible) publiquement.
  // ───────────────────────────────────────────────────────────────────────────

  // Publie une page builder : passe son statut à "published" et enregistre la date de publication.
  // Une page publiée est accessible aux visiteurs du blog.
  async publishPage(blogId, pageId, userId) {
    // Met à jour le statut à "published" et enregistre published_at = maintenant (new Date())
    const [result] = await models.builder.updatePageStatus(Number(blogId), Number(pageId), "published", new Date());

    // affectedRows = 0 → page inexistante ou hors-scope blog → 404
    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    // Trace la publication dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_published",
      metadata: { blogId: Number(blogId) },
    });

    // Retourne la page rechargée avec le nouveau statut "published"
    return this.getPage(blogId, pageId);
  }

  // Dépublie une page builder : repasse son statut à "draft" (brouillon).
  // La page n'est plus accessible aux visiteurs mais reste éditable dans le builder.
  async unpublishPage(blogId, pageId, userId) {
    // Met à jour le statut à "draft" (sans date de publication → paramètre absent)
    const [result] = await models.builder.updatePageStatus(Number(blogId), Number(pageId), "draft");

    // affectedRows = 0 → page inexistante ou hors-scope blog → 404
    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    // Trace la dépublication dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_unpublished",
      metadata: { blogId: Number(blogId) },
    });

    // Retourne la page rechargée avec le nouveau statut "draft"
    return this.getPage(blogId, pageId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UPLOAD DE MÉDIAS
  // Gère l'upload d'images utilisées dans les blocs du builder.
  // Sécurité renforcée : scan des SVG pour détecter le JS embarqué.
  // ───────────────────────────────────────────────────────────────────────────

  // Upload un fichier image pour le builder et l'enregistre dans la table `media`.
  // `file` est l'objet fichier fourni par Multer (path, filename, originalname, mimetype, size).
  // `payload` contient usageType (contexte d'usage) et altText (texte alternatif).
  async uploadMedia(blogId, userId, file, payload) {
    // Le fichier est obligatoire (Multer peut ne pas avoir attaché de fichier si type MIME refusé)
    if (!file) {
      throw createHttpError(400, "Le fichier image est obligatoire.");
    }

    // Détermine le contexte d'usage du média (deux conventions de nommage acceptées : camelCase et snake_case)
    const usageType = payload.usageType || payload.usage_type || "content";
    // Vérifie que le type d'usage est dans la liste blanche BUILDER_MEDIA_USAGE_TYPES
    if (!isAllowed(usageType, BUILDER_MEDIA_USAGE_TYPES)) {
      throw createHttpError(400, "Usage média invalide.");
    }

    // Sécurité renforcée pour les fichiers SVG : ils peuvent embarquer du JS malveillant
    if (file.mimetype === "image/svg+xml") {
      const absolutePath = file.path; // Chemin absolu sur le disque où Multer a écrit le fichier
      const svg = await fs.readFile(absolutePath, "utf8"); // Lit le contenu du SVG en texte brut
      // Détecte les patterns dangereux : <script>, javascript:, onload=, onerror=
      if (/<script|javascript:|onload\s*=|onerror\s*=/i.test(svg)) {
        await fs.unlink(absolutePath).catch(() => {}); // Supprime le fichier dangereux du disque (.catch pour éviter les erreurs si déjà supprimé)
        throw createHttpError(400, "SVG refusé : contenu potentiellement dangereux.");
      }
    }

    // Construit l'URL relative du fichier uploadé (accessible via le serveur statique Express)
    // Exemple : /uploads/blogs/42/builder/image-1234567890.jpg
    const relativeUrl = `/uploads/blogs/${Number(blogId)}/builder/${path.basename(file.filename)}`;

    // Construit l'objet média à insérer dans la table `media`
    const media = {
      blog_id: Number(blogId),                    // Blog auquel appartient le média
      uploader_id: userId,                         // Utilisateur qui a uploadé le fichier
      file_path: relativeUrl,                      // Chemin relatif pour accéder au fichier
      file_name: file.originalname,                // Nom original du fichier (tel que fourni par le client)
      mime_type: file.mimetype,                    // Type MIME détecté par Multer (ex. "image/jpeg")
      size_bytes: file.size,                       // Taille du fichier en octets
      alt_text: payload.altText || payload.alt_text || "", // Texte alternatif pour l'accessibilité (accepte camelCase et snake_case)
      metadata_json: JSON.stringify({              // Métadonnées sérialisées en JSON : contexte d'origine et type d'usage
        source: "builder",                         // Indique que le média vient du builder (vs. l'éditeur de posts)
        usage_type: usageType,                     // Contexte d'usage (ex. "content", "background")
      }),
    };

    // Insère le média en BDD et récupère l'id auto-incrémenté
    const [result] = await models.media.insert(media);
    // Trace l'upload dans l'audit log
    await this.logAction({
      actorUserId: userId,
      targetType: "media",
      targetId: result.insertId,              // Id du média nouvellement créé
      action: "builder.media_uploaded",
      metadata: { blogId: Number(blogId), usageType, fileName: file.originalname },
    });

    // Retourne un objet de réponse simplifié avec les informations utiles au client builder
    return {
      id: result.insertId,       // Id en BDD du média uploadé (pour référencer dans content_json des blocs)
      url: relativeUrl,          // URL relative à utiliser dans les blocs image du builder
      mimeType: file.mimetype,   // Type MIME pour que le client sache comment afficher le fichier
      fileSize: file.size,       // Taille en octets pour affichage informatif
      usageType,                 // Contexte d'usage confirmé
      altText: media.alt_text,   // Texte alternatif enregistré
    };
  }
}

// Exporte une instance unique du service (pattern Singleton).
// Toute la couche contrôleur partage la même instance → pas de duplication d'état.
module.exports = new BuilderService();
