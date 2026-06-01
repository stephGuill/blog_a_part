#!/usr/bin/env node
'use strict';

// Charge les variables d'environnement à partir d'un fichier `.env` si présent.
require('dotenv').config();

// Modules Node.js utilisés dans ce script:
const fs = require('fs'); // accès système de fichiers (lecture des .sql)
const path = require('path'); // utilities pour construire des chemins
const mysql = require('mysql2/promise'); // client MySQL promisifié

#!/usr/bin/env node
'use strict';

// -----------------------------------------------------------------------------
// Script: migrate.js
// But: exécute les fichiers SQL du dossier backend/database et applique les
// patches (y compris les ALTER TABLE ... ADD COLUMN IF NOT EXISTS qui ne sont
// pas supportés de manière uniforme selon la version MySQL). Les commentaires
// ci-dessous expliquent chaque section ligne par ligne.
// -----------------------------------------------------------------------------

// Charge les variables d'environnement depuis un fichier .env si présent.
require('dotenv').config();

// Modules natifs/utilitaires
const fs = require('fs');
const path = require('path');

// mysql2 en mode promise pour faciliter l'utilisation async/await.
const mysql = require('mysql2/promise');

// Répertoire contenant les fichiers SQL individuels (backend/database)
const sqlDir = path.join(__dirname, 'database');

// Lecture des variables de connexion depuis l'environnement (ou valeurs par défaut)
const DB_HOST = process.env.DB_HOST || '127.0.0.1'; // hôte MySQL
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306; // port
const DB_USER = process.env.DB_USER || 'root'; // utilisateur
const DB_PASSWORD = typeof process.env.DB_PASSWORD !== 'undefined' ? process.env.DB_PASSWORD : ''; // mot de passe
const DB_NAME = process.env.DB_NAME || 'blog_a_part'; // nom de la base cible

// Fonction principale asynchrone
async function main() {
  try {
    // Cherche un fichier `database.sql` au niveau du dossier backend (schéma complet)
    // puis ajoute ensuite tous les fichiers .sql présents dans backend/database.
    const topDbFile = path.join(__dirname, 'database.sql');
    const orderedFiles = [];

    // Si un fichier de création global existe, l'exécuter en premier
    if (fs.existsSync(topDbFile)) {
      orderedFiles.push(topDbFile);
    }

    // Lire les fichiers SQL du sous-dossier, les trier par nom pour obtenir
    // un ordre déterministe d'exécution.
    if (fs.existsSync(sqlDir)) {
      const dirFiles = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
      for (const f of dirFiles) {
        if (f === 'database.sql') continue; // éviter double exécution
        orderedFiles.push(path.join(sqlDir, f));
      }
    }

    // Crée la connexion MySQL (mode promise) sans sélectionner de base au départ
    // pour permettre l'exécution du fichier `database.sql` qui la crée.
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true // autorise l'exécution de plusieurs statements si nécessaire
    });

    console.log(`[migrate] Connected to ${DB_HOST}:${DB_PORT} as ${DB_USER}`);

    // Désactive temporairement les vérifications de clés étrangères pour
    // permettre d'appliquer des patches dans un ordre qui pourrait violer
    // temporairement les contraintes FK.
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');

    // Boucle sur chaque fichier SQL trouvé
    for (const fullPath of orderedFiles) {
      const file = path.basename(fullPath); // nom court du fichier
      console.log('[migrate] Executing', file);

      // Lecture du fichier SQL (encodage UTF-8)
      let sql = fs.readFileSync(fullPath, 'utf8');
      if (!sql || !sql.trim()) {
        console.log('[migrate] Skipping empty file', file);
        continue; // fichier vide -> ignorer
      }

      // Division simple des statements via ';' suivi d'un saut de ligne.
      // Remarque: ce splitter est volontairement simple et suppose que les
      // fichiers SQL ne contiennent pas des changements complexes de delimiter.
      const rawStatements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);

      try {
        // Exécution statement par statement pour pouvoir traiter certains cas
        // spéciaux (ex: ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
        for (const stmt of rawStatements) {
          if (!stmt) continue;

          const stmtUpper = stmt.toUpperCase();

          // Traitement spécial: certaines migrations utilisent la clause
          // "ADD COLUMN IF NOT EXISTS" qui n'est pas disponible sur toutes
          // les versions de MySQL/MariaDB ou qui peut entraîner des erreurs
          // selon le client. Ici on détecte ces cas et on les applique de
          // manière compatible: on vérifie d'abord dans INFORMATION_SCHEMA
          // si la colonne existe, puis on exécute uniquement l'ajout manquant.
          if (stmtUpper.startsWith('ALTER TABLE') && /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i.test(stmt)) {
            // Extraction du nom de table à partir de l'ALTER TABLE
            const tableMatch = stmt.match(/ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?/i);
            const tableName = tableMatch ? tableMatch[1] : null;
            if (!tableName) {
              // Si on ne parvient pas à récupérer le nom de table, on exécute
              // la commande brute (fallback)
              console.log('[migrate] Cannot determine table name for ALTER statement, executing raw');
              await conn.query(stmt);
              continue;
            }

            // On récupère chaque clause ADD COLUMN IF NOT EXISTS séparément
            const addRegex = /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+([^,]+)/ig;
            let m;
            const clauses = [];
            while ((m = addRegex.exec(stmt)) !== null) {
              clauses.push(m[1].trim());
            }

            if (clauses.length === 0) {
              // Pas de clause trouvée -> exécution brute
              await conn.query(stmt);
              continue;
            }

            // Pour chaque clause d'ajout de colonne, vérifier si la colonne
            // existe déjà via INFORMATION_SCHEMA et l'ajouter seulement si
            // elle est absente.
            for (const clause of clauses) {
              // Extraire le nom de colonne (premier token)
              const colMatch = clause.match(/`?([A-Za-z0-9_]+)`?\s+/);
              if (!colMatch) {
                console.log('[migrate] Cannot parse column name from clause, executing raw clause');
                try {
                  await conn.query(`ALTER TABLE ${tableName} ADD COLUMN ${clause}`);
                } catch (e) {
                  console.error('[migrate] Failed to execute clause:', clause, e.message);
                  throw e;
                }
                continue;
              }

              const columnName = colMatch[1];

              // Interroger INFORMATION_SCHEMA pour savoir si la colonne existe
              const [rows] = await conn.query(
                'SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [DB_NAME, tableName, columnName]
              );
              const exists = rows && rows[0] && rows[0].cnt > 0;
              if (exists) {
                console.log(`[migrate] Column ${tableName}.${columnName} already exists — skipping`);
                continue; // colonne déjà présente -> passer à la suivante
              }

              // Construire et exécuter la requête ALTER TABLE pour ajouter la colonne
              const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${clause}`;
              console.log('[migrate] Adding column with', alterSql);
              await conn.query(alterSql);
            }

            // Après avoir traité les clauses ADD COLUMN, passer au statement suivant
            continue;
          }

          // Pour tous les autres statements, exécution directe
          await conn.query(stmt);
        }

        // Si le fichier exécuté est le fichier global `database.sql`, s'assurer
        // que la connexion pointe maintenant sur la base créée (changeUser).
        if (file === 'database.sql') {
          try {
            await conn.changeUser({ database: DB_NAME });
            console.log('[migrate] Selected database', DB_NAME);
          } catch (e) {
            console.warn('[migrate] Warning: could not change database to', DB_NAME, e.message || e);
          }
        }

        console.log('[migrate] OK', file);
      } catch (err) {
        // En cas d'erreur sur un fichier, afficher un aperçu SQL pour aider au debug
        console.error('[migrate] Error executing', file, err.message || err);
        console.error('[migrate] SQL preview:', sql.slice(0, 2000));
        throw err; // remonter l'erreur pour arrêter la migration
      }
    }

    // Réactiver les vérifications FK et fermer la connexion
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    await conn.end();
    console.log('[migrate] All migrations applied successfully.');
  } catch (err) {
    // En sortie d'erreur, log et définir code de sortie non nul
    console.error('[migrate] Migration failed:', err.message || err);
    process.exitCode = 1;
  }
}

// Démarre l'exécution
main();
        console.error('[migrate] Error executing', file, err.message || err);
        console.error('[migrate] SQL preview:', sql.slice(0, 2000));
        throw err;
      }
    }

    // Restaure les contraintes FK et ferme la connexion proprement
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    await conn.end();
    console.log('[migrate] All migrations applied successfully.');
  } catch (err) {
    // En cas d'erreur fatale on retourne un code de sortie non nul
    console.error('[migrate] Migration failed:', err.message || err);
    process.exitCode = 1;
  }
}

// Démarre le runner
main();
