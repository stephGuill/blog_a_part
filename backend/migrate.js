#!/usr/bin/env node
'use strict';

// migrate.js
// Runner de migrations SQL pour le backend.
// Ce fichier parcourt `database.sql` puis tous les fichiers `.sql` du dossier
// `database/` et exécute leurs statements dans l'ordre. Il contient des
// adaptations pour rendre les patches compatibles avec des versions MySQL
// qui n'acceptent pas `ADD COLUMN IF NOT EXISTS` en une seule instruction.

// Charger les variables d'environnement depuis .env (si présent)
require('dotenv').config();

// Modules utilitaires
const fs = require('fs'); // lecture de fichiers
const path = require('path'); // manipulation de chemins
const mysql = require('mysql2/promise'); // client MySQL en mode promise

// Dossier contenant les fichiers SQL supplémentaires
const sqlDir = path.join(__dirname, 'database');

// Valeurs de connexion, récupérées depuis l'environnement ou valeurs par défaut
const DB_HOST = process.env.DB_HOST || '127.0.0.1'; // hôte MySQL
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306; // port MySQL
const DB_USER = process.env.DB_USER || 'root'; // nom utilisateur MySQL
const DB_PASSWORD = typeof process.env.DB_PASSWORD !== 'undefined' ? process.env.DB_PASSWORD : ''; // mot de passe
const DB_NAME = process.env.DB_NAME || 'blog_a_part'; // nom de la base à utiliser

// Fonction principale qui orchestre les migrations
async function main() {
  try {
    // Fichier racine (schéma complet) s'il existe
    const topDbFile = path.join(__dirname, 'database.sql');
    // Liste ordonnée des fichiers SQL à exécuter
    const orderedFiles = [];

    // Si `database.sql` existe, on l'exécute en premier (création de la DB + tables)
    if (fs.existsSync(topDbFile)) {
      orderedFiles.push(topDbFile);
    }

    // Lire le dossier `database/` et ajouter tous les fichiers .sql triés
    if (fs.existsSync(sqlDir)) {
      const dirFiles = fs.readdirSync(sqlDir).filter((f) => f.endsWith('.sql')).sort();
      for (const f of dirFiles) {
        // Éviter de ré-exécuter `database.sql` s'il est présent dans le dossier
        if (f === 'database.sql') continue;
        orderedFiles.push(path.join(sqlDir, f));
      }
    }

    // Ouvrir une connexion MySQL sans sélectionner de base (permet de créer la DB)
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true, // autorise l'exécution de plusieurs statements si fournis
    });

    console.log(`[migrate] Connected to ${DB_HOST}:${DB_PORT} as ${DB_USER}`);

    // Désactiver les vérifications FK temporairement pour plus de tolérance
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');

    // Parcourir les fichiers et exécuter leur contenu statement par statement
    for (const fullPath of orderedFiles) {
      const file = path.basename(fullPath); // nom court du fichier
      console.log('[migrate] Executing', file);

      // Lire le contenu SQL (UTF-8)
      const sql = fs.readFileSync(fullPath, 'utf8');

      // Si le fichier est vide ou ne contient que des espaces, l'ignorer
      if (!sql || !sql.trim()) {
        console.log('[migrate] Skipping empty file', file);
        continue;
      }

      // Split simple des statements : on coupe sur ";<newline>".
      // Note : ce splitter est simple et suppose que les fichiers ne modifient
      // pas manuellement le delimiter SQL (ex: DELIMITER $$). Pour les cas
      // complexes, il faudrait un parser SQL dédié.
      const rawStatements = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);

      try {
        // Exécuter chaque statement séparément
        for (const stmt of rawStatements) {
          if (!stmt) continue;

          const stmtUpper = stmt.toUpperCase();

          // Gestion spéciale pour les cas `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`:
          // certaines versions n'acceptent pas cette syntaxe, donc on la remplace
          // par un comportement compatible : interroger INFORMATION_SCHEMA et
          // n'ajouter la colonne que si elle est absente.
          if (stmtUpper.startsWith('ALTER TABLE') && /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i.test(stmt)) {
            // Récupérer le nom de table depuis la clause ALTER TABLE
            const tableMatch = stmt.match(/ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?/i);
            const tableName = tableMatch ? tableMatch[1] : null;

            // Si on ne peut pas déterminer la table, exécuter la commande brute
            if (!tableName) {
              console.log('[migrate] Cannot determine table name for ALTER statement, executing raw');
              await conn.query(stmt);
              continue;
            }

            // Extraire chaque clause ADD COLUMN IF NOT EXISTS (séparées par des virgules)
            const addRegex = /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+([^,]+)/ig;
            let m;
            const clauses = [];
            while ((m = addRegex.exec(stmt)) !== null) {
              clauses.push(m[1].trim());
            }

            // Si aucune clause trouvée, exécuter la requête telle quelle
            if (clauses.length === 0) {
              await conn.query(stmt);
              continue;
            }

            // Pour chaque clause, vérifier l'existence de la colonne
            for (const clause of clauses) {
              // Extraire le nom de colonne (premier token) de la clause
              const colMatch = clause.match(/`?([A-Za-z0-9_]+)`?\s+/);
              if (!colMatch) {
                // Si on ne parvient pas à analyser le nom, exécuter la clause brute
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

              // Interroger INFORMATION_SCHEMA pour savoir si la colonne existe déjà
              const [rows] = await conn.query(
                'SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [DB_NAME, tableName, columnName]
              );
              const exists = rows && rows[0] && rows[0].cnt > 0;

              // Si la colonne existe déjà, passer à la clause suivante
              if (exists) {
                console.log(`[migrate] Column ${tableName}.${columnName} already exists — skipping`);
                continue;
              }

              // Construire et exécuter l'ALTER TABLE pour ajouter la colonne
              const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${clause}`;
              console.log('[migrate] Adding column with', alterSql);
              await conn.query(alterSql);
            }

            // Clauses traitées ; passer au statement suivant
            continue;
          }

          // Pour les autres statements, exécution directe
          await conn.query(stmt);
        }

        // Si nous venons d'exécuter `database.sql`, s'assurer que la connexion
        // utilise bien la base nouvellement créée (changeUser parfois nécessaire)
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
        // En cas d'erreur lors de l'exécution d'un fichier SQL, logguer et
        // fournir un aperçu du SQL pour faciliter le débogage.
        console.error('[migrate] Error executing', file, err.message || err);
        console.error('[migrate] SQL preview:', sql.slice(0, 2000));
        throw err; // Propager l'erreur pour interrompre la migration
      }
    }

    // Réactiver les vérifications FK et fermer la connexion proprement
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    await conn.end();
    console.log('[migrate] All migrations applied successfully.');
  } catch (err) {
    // Erreur fatale : log et code de sortie non nul
    console.error('[migrate] Migration failed:', err.message || err);
    process.exitCode = 1;
  }
}

// Lancer le script
main();
