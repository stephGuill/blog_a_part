// Suite de test d'exemple pour vérifier que Jest fonctionne correctement.
// Chaque ligne est commentée pour expliquer son rôle.

// `describe` définit un groupe de tests (suite).
describe('Example test suite', () => {
  // `test` (alias `it`) définit un cas de test individuel.
  test('sanity check: true is truthy', () => {
    // Assertion simple: on s'attend à ce que `true` soit égal à `true`.
    expect(true).toBe(true);
  });
});
