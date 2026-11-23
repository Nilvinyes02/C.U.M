/*
 * C.U.M. — CONFIGURACIÓ DEL JOC
 * Aquest arxiu es pot editar amb el Bloc de notes o Visual Studio Code.
 * No cal instal·lar res per veure el resultat al navegador.
 */
window.CUM_CONFIG = {
  // Nom que es mostrarà a la credencial de la protagonista.
  agent: 'AGENTE Marianne',

  // Referència del document.
  expediente: 'OP-067',

  // Codi imprès a la targeta que acompanya el QR (exemples per provar).
  // Canvia'ls abans del dia de la gincana. No són seguretat real.
  idAgente: 'CUM-001',
  claveAcceso: '4172',

  // Fins a aquesta data i hora, la primera missió queda bloquejada.
  // Format: 'AAAA-MM-DDTHH:mm:ss+01:00' a l'hivern a Espanya;
  // o 'AAAA-MM-DDTHH:mm:ss+02:00' durant l'horari d'estiu.
  // Exemple: '2026-12-12T11:00:00+01:00'
  // Per ara, deixa-ho buit i la missió quedarà sempre bloquejada.
  desbloqueo: '',

  // Freqüència de prova. Canvia-la quan decidim l'enigma definitiu.
  frecuenciaObjetivo: 96.7
};
