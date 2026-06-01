--
-- Fichier de seed (exemples de données) pour la base `blog_a_part`.
-- Chaque bloc SQL ci-dessous est commenté ligne par ligne pour expliquer
-- les colonnes et l'intention. Les INSERTs utilisent `INSERT IGNORE`
-- afin d'être idempotents (exécution répétée sans erreur de duplicata).
--

-- Indique explicitement la base de données cible
USE blog_a_part;

-- 1) Utilisateurs : insertion d'exemples
-- colonnes : `username`, `email`, `password_hash`, `full_name`, `role`
INSERT IGNORE INTO `users` (`username`, `email`, `password_hash`, `full_name`, `role`) VALUES
	('admin_yoo', 'admin@blogyoo.com', '$argon2id$v=19$m=65536,t=3,p=4$YmxvZ3lvb19zYWx0XzEyMw$FLIKL4qUGATZ+4TsG64BeVa8E9fWaOmiVX0VwHzOMCk', 'Administrateur Système', 'admin'),
	('jdupont', 'jean.dupont@email.com', '$argon2id$v=19$m=65536,t=3,p=4$YmxvZ3lvb19zYWx0XzEyMw$FLIKL4qUGATZ+4TsG64BeVa8E9fWaOmiVX0VwHzOMCk', 'Jean Dupont', 'owner'),
	('sophie_m', 'sophie.martin@email.com', '$argon2id$v=19$m=65536,t=3,p=4$YmxvZ3lvb19zYWx0XzEyMw$FLIKL4qUGATZ+4TsG64BeVa8E9fWaOmiVX0VwHzOMCk', 'Sophie Martin', 'editor');

-- 2) Thèmes (templates) : nom, type, description, JSON de configuration
INSERT IGNORE INTO themes (name, type, description, config_json) VALUES
	('Modern Clean', 'blog', 'Un thème épuré pour les blogs technologiques', '{"primary_color": "#3498db", "font_family": "Roboto"}'),
	('Classic Serif', 'blog', 'Thème élégant pour les écrivains', '{"primary_color": "#2c3e50", "font_family": "Merriweather"}');

-- 3) Blogs : owner_id (FK users.id), theme_id (FK themes.id), name, slug, description
INSERT IGNORE INTO blogs (owner_id, theme_id, name, slug, description) VALUES
	(2, 1, 'Tech Horizons', 'tech-horizons', "Exploration des nouvelles technologies et de l'IA"),
	(3, 2, 'Les Chroniques de Sophie', 'sophie-chronicles', 'Mes réflexions quotidiennes sur la littérature');

-- 4) Catégories par blog : blog_id (FK blogs.id), name, slug, description
INSERT IGNORE INTO categories (blog_id, name, slug, description) VALUES
	(1, 'Intelligence Artificielle', 'ia', 'Articles traitant du machine learning et du futur'),
	(1, 'Développement Web', 'web-dev', 'Tutoriels et actualités sur JavaScript et PHP'),
	(2, 'Lectures du Mois', 'lectures', 'Mes coups de cœur littéraires');

-- 5) Posts / Articles : blog_id, author_id (FK users.id), title, slug, excerpt, content, status, published_at
INSERT IGNORE INTO posts (blog_id, author_id, title, slug, excerpt, content, status, published_at) VALUES
	(1, 2, 'L\'essor de l\'IA en 2024', 'essor-ia-2024', 'Pourquoi l\'IA change tout...', 'Le contenu détaillé de l\'article sur l\'intelligence artificielle.', 'published', NOW()),
	(1, 2, 'Apprendre React rapidement', 'apprendre-react', 'Guide pour débutants sur React.', 'Voici comment installer React et créer votre premier composant...', 'draft', NULL),
	(2, 3, 'Ma critique de "Dune"', 'critique-dune', 'Un chef d\'oeuvre de la SF.', 'J\'ai enfin fini de lire Dune, et voici mon avis...', 'published', NOW());

-- 6) Pivot post <-> catégorie : post_id, category_id (PK composite)
INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
	(1, 1), -- L'essor de l'IA -> catégorie IA
	(2, 2), -- Apprendre React -> Web-Dev
	(3, 3); -- Critique Dune -> Lectures

-- 7) Media : blog_id, uploader_id (FK users.id), file_path, file_name, mime_type, size_bytes, alt_text
INSERT IGNORE INTO media (blog_id, uploader_id, file_path, file_name, mime_type, size_bytes, alt_text) VALUES
	(1, 2, 'uploads/2024/01/ia-cover.jpg', 'ia-cover.jpg', 'image/jpeg', 204800, 'Illustration de cerveau numérique'),
	(1, 2, 'uploads/2024/01/react-logo.png', 'react-logo.png', 'image/png', 51200, 'Logo React JS'),
	(2, 3, 'uploads/2024/01/dune-book.jpg', 'dune-book.jpg', 'image/jpeg', 450000, 'Couverture du livre Dune');

-- 8) Pivot post <-> media (metadatas) : post_id, media_id, position, usage_type
INSERT IGNORE INTO post_media (post_id, media_id, position, usage_type) VALUES
	(1, 1, 1, 'cover'), -- couverture
	(2, 2, 1, 'inline'), -- inline image
	(3, 3, 1, 'cover');

-- 9) Commentaires : post_id (FK posts.id), parent_id (self-FK), author_name, author_email, content, status
INSERT IGNORE INTO comments (post_id, author_name, author_email, content, status) VALUES
	(1, 'Marc Lavoine', 'marc@web.fr', 'Super article, très instructif !', 'approved');

-- Réponse au commentaire précédent (parent_id = 1)
INSERT IGNORE INTO comments (post_id, parent_id, author_name, author_email, content, status) VALUES
	(1, 1, 'Jean Dupont', 'jean.dupont@email.com', 'Merci Marc, ravi que ça t\'ait plu !', 'approved');