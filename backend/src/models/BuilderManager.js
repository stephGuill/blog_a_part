// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// BuilderManager.js
// Manager pour les entités du constructeur de pages (builder) : pages, sections, blocs.
// Responsabilité : fournir des opérations CRUD et utilitaires pour les pages
// construites dynamiquement via l'interface de construction visuelle.
//
// Structure des données builder :
//   - builder_pages    : page complète associée à un blog
//   - builder_sections : sections d'une page (zones de mise en page)
//   - builder_blocks   : blocs de contenu à l'intérieur des sections
//
// Plusieurs colonnes stockent des objets JSON (layout_json, grid_config, style_json,
// settings_json, content_json). Ce manager sérialise ces objets avec JSON.stringify()
// avant insertion/update, et les stocke sous forme de chaînes TEXT/JSON en base.

class BuilderManager extends AbstractManager {
  // Constructeur : déclare la table principale `builder_pages` au parent.
  // Note : ce manager gère aussi les tables `builder_sections` et `builder_blocks`
  // directement dans les requêtes SQL, sans changer `this.table`.
  constructor() {
    // Table par défaut : builder_pages (utilisée dans find/findAll hérités).
    super({ table: "builder_pages" });
  }

  // ─────────────────────────────────────────────
  // PAGES
  // ─────────────────────────────────────────────

  // findPagesByBlogId(blogId) : récupère toutes les pages d'un blog.
  //
  // Paramètre :
  //   - blogId : id du blog dont on veut les pages
  //
  // Retour : promesse résolue avec les pages triées du plus récemment modifié au plus ancien.
  findPagesByBlogId(blogId) {
    // ORDER BY updated_at DESC : les pages récentes apparaissent en premier.
    return this.database.query(
      `SELECT *
       FROM builder_pages
       WHERE blog_id = ?
       ORDER BY updated_at DESC`,
      // Paramètre sécurisé : l'id du blog remplace le placeholder ?
      [blogId]
    );
  }

  // findPageById(blogId, pageId) : récupère une page précise appartenant à un blog.
  //
  // Paramètres :
  //   - blogId : id du blog (vérification d'appartenance pour la sécurité)
  //   - pageId : id de la page à récupérer
  //
  // Retour : promesse résolue avec 0 ou 1 ligne.
  findPageById(blogId, pageId) {
    // La double condition (blog_id ET id) empêche l'accès à une page d'un autre blog.
    return this.database.query(
      `SELECT *
       FROM builder_pages
       WHERE blog_id = ? AND id = ?`,
      // Ordre des paramètres : blog_id en premier, page_id en second.
      [blogId, pageId]
    );
  }

  // createPage(page) : insère une nouvelle page dans la table builder_pages.
  //
  // Paramètre `page` : objet JS avec les propriétés suivantes :
  //   - blog_id         : id du blog auquel la page appartient
  //   - owner_id        : id de l'utilisateur créateur de la page
  //   - title           : titre affiché de la page
  //   - slug            : identifiant URL-friendly unique dans le blog
  //   - type            : type de page (ex: 'landing', 'about', 'custom')
  //   - status          : statut de publication ('draft', 'published', 'archived')
  //   - seo_title       : titre SEO optionnel (meta title)
  //   - seo_description : description SEO optionnelle (meta description)
  //   - layout_json     : objet JS décrivant la mise en page globale (sérialisé en JSON)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  createPage(page) {
    return this.database.query(
      `INSERT INTO builder_pages
        (blog_id, owner_id, title, slug, type, status, seo_title, seo_description, layout_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // blog_id : rattache la page au blog propriétaire
        page.blog_id,
        // owner_id : identifie l'auteur/créateur de la page
        page.owner_id,
        // title : libellé lisible de la page
        page.title,
        // slug : identifiant URL (ex: "a-propos")
        page.slug,
        // type : catégorie fonctionnelle de la page
        page.type,
        // status : état de publication initial
        page.status,
        // seo_title : champ SEO optionnel ; null si non fourni
        page.seo_title || null,
        // seo_description : champ SEO optionnel ; null si non fourni
        page.seo_description || null,
        // layout_json : objet JS sérialisé en JSON ; null si non fourni
        page.layout_json ? JSON.stringify(page.layout_json) : null,
      ]
    );
  }

  // updatePage(page) : met à jour les métadonnées d'une page builder existante.
  //
  // Paramètre `page` : même structure que createPage avec en plus :
  //   - id : identifiant de la page à modifier
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updatePage(page) {
    // Requête UPDATE ciblant la page par son blog_id ET son id (double sécurité).
    return this.database.query(
      `UPDATE builder_pages
       SET title = ?, slug = ?, type = ?, status = ?, seo_title = ?, seo_description = ?, layout_json = ?
       WHERE blog_id = ? AND id = ?`,
      [
        // title : nouveau titre de la page
        page.title,
        // slug : nouveau slug URL
        page.slug,
        // type : nouveau type de page
        page.type,
        // status : nouveau statut de publication
        page.status,
        // seo_title : champ SEO optionnel ; null si non fourni
        page.seo_title || null,
        // seo_description : champ SEO optionnel ; null si non fourni
        page.seo_description || null,
        // layout_json : objet JS sérialisé en JSON ; null si non fourni
        page.layout_json ? JSON.stringify(page.layout_json) : null,
        // blog_id : clause WHERE — vérifie l'appartenance au blog
        page.blog_id,
        // id : clause WHERE — identifie la page à mettre à jour
        page.id,
      ]
    );
  }

  // saveLayout(blogId, pageId, layoutJson) : enregistre uniquement la mise en page (layout).
  //
  // Paramètres :
  //   - blogId     : id du blog (vérification d'appartenance)
  //   - pageId     : id de la page à mettre à jour
  //   - layoutJson : objet JS décrivant la mise en page ; sera sérialisé en JSON
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  saveLayout(blogId, pageId, layoutJson) {
    return this.database.query(
      `UPDATE builder_pages
       SET layout_json = ?
       WHERE blog_id = ? AND id = ?`,
      // layoutJson est attendu comme objet JS ; on le sérialise avant stockage.
      [layoutJson ? JSON.stringify(layoutJson) : null, blogId, pageId]
    );
  }

  // updatePageStatus(blogId, pageId, status, publishedAt) : met à jour le statut de publication.
  //
  // Paramètres :
  //   - blogId      : id du blog (vérification d'appartenance)
  //   - pageId      : id de la page à mettre à jour
  //   - status      : nouveau statut ('draft', 'published', 'archived')
  //   - publishedAt : date de publication (null par défaut si non publiée)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updatePageStatus(blogId, pageId, status, publishedAt = null) {
    // published_at : enregistre l'horodatage de publication lorsque le statut passe à 'published'.
    return this.database.query(
      `UPDATE builder_pages
       SET status = ?, published_at = ?
       WHERE blog_id = ? AND id = ?`,
      // Paramètres dans l'ordre : status, published_at, blog_id, page_id.
      [status, publishedAt, blogId, pageId]
    );
  }

  // archivePage(blogId, pageId) : archive une page en déléguant à updatePageStatus.
  //
  // Paramètres :
  //   - blogId : id du blog (vérification d'appartenance)
  //   - pageId : id de la page à archiver
  //
  // Retour : promesse résolue avec le résultat de updatePageStatus.
  archivePage(blogId, pageId) {
    // Délégation : appelle updatePageStatus avec le statut 'archived' et sans date de publication.
    return this.updatePageStatus(blogId, pageId, "archived");
  }

  // ─────────────────────────────────────────────
  // SECTIONS
  // ─────────────────────────────────────────────

  // findSectionsByPageId(pageId) : récupère toutes les sections d'une page, triées par ordre.
  //
  // Paramètre :
  //   - pageId : id de la page dont on veut les sections
  //
  // Retour : promesse résolue avec les sections triées par sort_order puis par id.
  findSectionsByPageId(pageId) {
    // ORDER BY sort_order ASC, id ASC : tri principal par ordre défini, puis par id en cas d'égalité.
    return this.database.query(
      `SELECT *
       FROM builder_sections
       WHERE page_id = ?
       ORDER BY sort_order ASC, id ASC`,
      // Paramètre sécurisé : l'id de la page remplace le placeholder ?
      [pageId]
    );
  }

  // findSectionById(blogId, pageId, sectionId) : récupère une section précise avec vérification d'appartenance.
  //
  // Paramètres :
  //   - blogId    : id du blog (sécurité : empêche l'accès à des sections d'autres blogs)
  //   - pageId    : id de la page parente de la section
  //   - sectionId : id de la section à récupérer
  //
  // Retour : promesse résolue avec 0 ou 1 ligne.
  findSectionById(blogId, pageId, sectionId) {
    // JOIN builder_pages p : jointure pour vérifier que la section appartient bien
    // à la page et au blog demandés (sécurité multicouche).
    return this.database.query(
      `SELECT s.*
       FROM builder_sections s
       JOIN builder_pages p ON p.id = s.page_id
       WHERE p.blog_id = ? AND p.id = ? AND s.id = ?`,
      // Paramètres : blog_id, page_id, section_id dans l'ordre des ? de la requête.
      [blogId, pageId, sectionId]
    );
  }

  // findSectionByBlog(sectionId, blogId) : récupère une section avec son contexte (page, blog).
  //
  // Paramètres :
  //   - sectionId : id de la section recherchée
  //   - blogId    : id du blog pour vérification d'appartenance
  //
  // Retour : promesse résolue avec la section enrichie des colonnes blog_id et page_id.
  findSectionByBlog(sectionId, blogId) {
    // JOIN builder_pages p : jointure pour récupérer blog_id et page_id de la page parente.
    // p.blog_id et p.id AS page_id : exposés comme colonnes supplémentaires dans le résultat.
    return this.database.query(
      `SELECT s.*, p.blog_id, p.id AS page_id
       FROM builder_sections s
       JOIN builder_pages p ON p.id = s.page_id
       WHERE s.id = ? AND p.blog_id = ?`,
      // Paramètres : section_id en premier, blog_id en second.
      [sectionId, blogId]
    );
  }

  // createSection(section) : insère une nouvelle section dans une page builder.
  //
  // Paramètre `section` : objet JS avec les propriétés suivantes :
  //   - page_id           : id de la page à laquelle appartient la section
  //   - parent_section_id : id de la section parente pour l'imbrication (null si racine)
  //   - section_type      : type de section (ex: 'row', 'column', 'hero')
  //   - name              : nom descriptif optionnel
  //   - sort_order        : position dans la page (0 par défaut)
  //   - grid_config       : configuration de la grille CSS (objet JS sérialisé)
  //   - style_json        : styles CSS personnalisés (objet JS sérialisé)
  //   - settings_json     : paramètres de comportement (objet JS sérialisé)
  //   - is_visible        : booléen indiquant si la section est visible (true par défaut)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  createSection(section) {
    return this.database.query(
      `INSERT INTO builder_sections
        (page_id, parent_section_id, section_type, name, sort_order, grid_config, style_json, settings_json, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // page_id : rattache la section à la page parente
        section.page_id,
        // parent_section_id : null si la section est à la racine (pas imbriquée)
        section.parent_section_id || null,
        // section_type : identifie le type de mise en page de la section
        section.section_type,
        // name : libellé optionnel pour l'interface d'administration
        section.name || null,
        // sort_order : position d'affichage ; 0 par défaut si non fourni
        section.sort_order || 0,
        // grid_config, style_json, settings_json : objets JS sérialisés en JSON avant stockage
        section.grid_config ? JSON.stringify(section.grid_config) : null,
        section.style_json ? JSON.stringify(section.style_json) : null,
        section.settings_json ? JSON.stringify(section.settings_json) : null,
        // is_visible : true par défaut sauf si explicitement false
        section.is_visible !== false,
      ]
    );
  }

  // updateSection(section) : met à jour une section builder existante.
  //
  // Paramètre `section` : même structure que createSection avec en plus :
  //   - id : identifiant de la section à modifier
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateSection(section) {
    return this.database.query(
      `UPDATE builder_sections
       SET parent_section_id = ?, section_type = ?, name = ?, sort_order = ?, grid_config = ?, style_json = ?, settings_json = ?, is_visible = ?
       WHERE id = ?`,
      [
        // parent_section_id : null si pas de parent (section racine)
        section.parent_section_id || null,
        // section_type : nouveau type de section
        section.section_type,
        // name : nouveau libellé optionnel
        section.name || null,
        // sort_order : nouvelle position ; 0 par défaut
        section.sort_order || 0,
        // Sérialisation des champs JSON avant mise à jour en base
        section.grid_config ? JSON.stringify(section.grid_config) : null,
        section.style_json ? JSON.stringify(section.style_json) : null,
        section.settings_json ? JSON.stringify(section.settings_json) : null,
        // is_visible : true par défaut sauf si explicitement false
        section.is_visible !== false,
        // id : identifiant de la section à cibler dans le WHERE
        section.id,
      ]
    );
  }

  // deleteSection(sectionId) : supprime physiquement une section par son id.
  //
  // Paramètre :
  //   - sectionId : id de la section à supprimer
  //
  // Retour : promesse résolue avec le résultat DELETE (affectedRows).
  deleteSection(sectionId) {
    // Suppression directe sur la table builder_sections par id.
    return this.database.query("DELETE FROM builder_sections WHERE id = ?", [sectionId]);
  }

  // ─────────────────────────────────────────────
  // BLOCS
  // ─────────────────────────────────────────────

  // findBlocksByPageId(pageId) : récupère tous les blocs d'une page (via leurs sections).
  //
  // Paramètre :
  //   - pageId : id de la page dont on veut tous les blocs
  //
  // Retour : promesse résolue avec les blocs triés par sort_order puis par id.
  findBlocksByPageId(pageId) {
    // JOIN builder_sections s : jointure pour remonter à la page à partir du bloc.
    // ON s.id = b.section_id : condition de jointure entre blocs et sections.
    // WHERE s.page_id = ? : filtre sur la page pour ne récupérer que ses blocs.
    // ORDER BY b.sort_order ASC, b.id ASC : tri par ordre d'affichage puis par id.
    return this.database.query(
      `SELECT b.*
       FROM builder_blocks b
       JOIN builder_sections s ON s.id = b.section_id
       WHERE s.page_id = ?
       ORDER BY b.sort_order ASC, b.id ASC`,
      // Paramètre sécurisé : l'id de la page remplace le placeholder ?
      [pageId]
    );
  }

  // findBlocksBySectionId(sectionId) : récupère tous les blocs d'une section donnée.
  //
  // Paramètre :
  //   - sectionId : id de la section dont on veut les blocs
  //
  // Retour : promesse résolue avec les blocs triés par sort_order puis par id.
  findBlocksBySectionId(sectionId) {
    // Pas de JOIN nécessaire : les blocs ont directement une colonne section_id.
    return this.database.query(
      `SELECT *
       FROM builder_blocks
       WHERE section_id = ?
       ORDER BY sort_order ASC, id ASC`,
      // Paramètre sécurisé : l'id de la section remplace le placeholder ?
      [sectionId]
    );
  }

  // findBlockById(blogId, blockId) : récupère un bloc précis avec vérification d'appartenance au blog.
  //
  // Paramètres :
  //   - blogId  : id du blog (sécurité : empêche l'accès à des blocs d'autres blogs)
  //   - blockId : id du bloc à récupérer
  //
  // Retour : promesse résolue avec 0 ou 1 ligne enrichie de page_id et blog_id.
  findBlockById(blogId, blockId) {
    // JOIN builder_sections s : jointure pour remonter de bloc → section.
    // JOIN builder_pages p    : jointure pour remonter de section → page → blog.
    // s.page_id et p.blog_id sont exposés pour faciliter les vérifications d'accès.
    return this.database.query(
      `SELECT b.*, s.page_id, p.blog_id
       FROM builder_blocks b
       JOIN builder_sections s ON s.id = b.section_id
       JOIN builder_pages p ON p.id = s.page_id
       WHERE p.blog_id = ? AND b.id = ?`,
      // Paramètres : blog_id en premier, block_id en second.
      [blogId, blockId]
    );
  }

  // createBlock(block) : insère un nouveau bloc de contenu dans une section.
  //
  // Paramètre `block` : objet JS avec les propriétés suivantes :
  //   - section_id      : id de la section parente
  //   - parent_block_id : id du bloc parent pour l'imbrication (null si racine)
  //   - block_type      : type de bloc (ex: 'text', 'image', 'video', 'button')
  //   - name            : libellé optionnel pour l'interface d'administration
  //   - content_json    : contenu du bloc (objet JS sérialisé)
  //   - style_json      : styles CSS personnalisés (objet JS sérialisé)
  //   - settings_json   : paramètres de comportement (objet JS sérialisé)
  //   - sort_order      : position dans la section (0 par défaut)
  //   - is_visible      : booléen indiquant si le bloc est visible (true par défaut)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  createBlock(block) {
    return this.database.query(
      `INSERT INTO builder_blocks
        (section_id, parent_block_id, block_type, name, content_json, style_json, settings_json, sort_order, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // section_id : rattache le bloc à la section parente
        block.section_id,
        // parent_block_id : null si le bloc n'est pas imbriqué dans un autre bloc
        block.parent_block_id || null,
        // block_type : détermine le rendu et les options disponibles pour ce bloc
        block.block_type,
        // name : libellé optionnel visible dans l'éditeur
        block.name || null,
        // content_json, style_json, settings_json : objets JS convertis en JSON avant insertion
        block.content_json ? JSON.stringify(block.content_json) : null,
        block.style_json ? JSON.stringify(block.style_json) : null,
        block.settings_json ? JSON.stringify(block.settings_json) : null,
        // sort_order : position d'affichage ; 0 par défaut si non fourni
        block.sort_order || 0,
        // is_visible : true par défaut sauf si explicitement false
        block.is_visible !== false,
      ]
    );
  }

  // updateBlock(block) : met à jour un bloc builder existant.
  //
  // Paramètre `block` : même structure que createBlock avec en plus :
  //   - id : identifiant du bloc à modifier
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateBlock(block) {
    return this.database.query(
      `UPDATE builder_blocks
       SET parent_block_id = ?, block_type = ?, name = ?, content_json = ?, style_json = ?, settings_json = ?, sort_order = ?, is_visible = ?
       WHERE id = ?`,
      [
        // parent_block_id : null si pas d'imbrication
        block.parent_block_id || null,
        // block_type : nouveau type de bloc
        block.block_type,
        // name : nouveau libellé optionnel
        block.name || null,
        // Sérialisation des champs JSON avant mise à jour
        block.content_json ? JSON.stringify(block.content_json) : null,
        block.style_json ? JSON.stringify(block.style_json) : null,
        block.settings_json ? JSON.stringify(block.settings_json) : null,
        // sort_order : nouvelle position ; 0 par défaut
        block.sort_order || 0,
        // is_visible : true par défaut sauf si explicitement false
        block.is_visible !== false,
        // id : identifiant du bloc ciblé dans le WHERE
        block.id,
      ]
    );
  }

  // deleteBlock(blockId) : supprime physiquement un bloc par son id.
  //
  // Paramètre :
  //   - blockId : id du bloc à supprimer
  //
  // Retour : promesse résolue avec le résultat DELETE (affectedRows).
  deleteBlock(blockId) {
    // Suppression directe sur la table builder_blocks par id.
    return this.database.query("DELETE FROM builder_blocks WHERE id = ?", [blockId]);
  }

  // ─────────────────────────────────────────────
  // RÉORGANISATION
  // ─────────────────────────────────────────────

  // reorderSections(items) : met à jour l'ordre de plusieurs sections en parallèle.
  //
  // Paramètre `items` : tableau d'objets `{ id, sort_order }` décrivant
  //   le nouvel ordre de chaque section.
  //
  // Retour : promesse résolue (Promise.all) une fois toutes les mises à jour effectuées.
  async reorderSections(items) {
    // Créer un tableau de promesses UPDATE, une par section à réordonner.
    const updates = items.map((item) =>
      // Mise à jour de sort_order pour chaque section identifiée par son id.
      this.database.query("UPDATE builder_sections SET sort_order = ? WHERE id = ?", [item.sort_order, item.id])
    );
    // Exécuter toutes les mises à jour en parallèle et attendre qu'elles soient toutes terminées.
    return Promise.all(updates);
  }

  // reorderBlocks(items) : met à jour l'ordre de plusieurs blocs en parallèle.
  //
  // Paramètre `items` : tableau d'objets `{ id, sort_order }` décrivant
  //   le nouvel ordre de chaque bloc.
  //
  // Retour : promesse résolue (Promise.all) une fois toutes les mises à jour effectuées.
  async reorderBlocks(items) {
    // Créer un tableau de promesses UPDATE, une par bloc à réordonner.
    const updates = items.map((item) =>
      // Mise à jour de sort_order pour chaque bloc identifié par son id.
      this.database.query("UPDATE builder_blocks SET sort_order = ? WHERE id = ?", [item.sort_order, item.id])
    );
    // Exécuter toutes les mises à jour en parallèle et attendre qu'elles soient toutes terminées.
    return Promise.all(updates);
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = BuilderManager;
