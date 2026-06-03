// Styles CSS du tableau (largeurs, alternance de lignes, responsive)
import "./Table.css";

// Composant Table : tableau de données générique et réutilisable.
// Accepte une définition de colonnes et un tableau de données, et rend un <table> HTML sémantique.
// Props :
//   columns — tableau de définitions de colonnes : { key, label, render? }
//     key    : identifiant unique de la colonne, correspond à la propriété dans chaque ligne de `rows`
//     label  : texte affiché dans l'en-tête de la colonne (<th>)
//     render : fonction optionnelle (row) => JSX — si fournie, remplace le rendu par défaut (row[key])
//              Permet d'afficher des boutons, badges, liens ou tout autre JSX dans une cellule
//   rows    — tableau d'objets de données ; chaque objet doit avoir une propriété `id` unique
//             utilisée comme `key` React pour les lignes
function Table({ columns = [], rows = [] }) {
  return (
    // Conteneur scrollable horizontalement sur mobile (overflow-x: auto dans table-wrap)
    <div className="table-wrap">
      <table className="premium-table">
        {/* En-tête du tableau : une cellule <th> par colonne */}
        <thead>
          <tr>
            {columns.map((column) => (
              // key unique sur column.key pour la réconciliation React
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        {/* Corps du tableau : une ligne <tr> par entrée dans rows */}
        <tbody>
          {rows.map((row) => (
            // row.id comme key unique de la ligne (évite les re-rendus inutiles)
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>
                  {/* Si la colonne a un renderer personnalisé → l'appeler avec la ligne entière */}
                  {/* Sinon → afficher la valeur brute de la propriété correspondante */}
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export par défaut utilisé dans les pages d'administration, modération et gestion de contenu
export default Table;
