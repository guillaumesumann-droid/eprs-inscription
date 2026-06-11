// EPRS Football — Inscriptions 2026/2027
// Google Apps Script — à coller dans Extensions > Apps Script du Google Sheet
// Déployer comme application web : Exécuter en tant que "Moi", Accès "Tout le monde"

var SHEET_NAME = 'Inscriptions';

var HEADERS = [
  'Date',
  'Nom joueur', 'Prénom joueur', 'Date naissance', 'Ville naissance', 'Ville résidence', 'Sexe',
  'Nom parent', 'Prénom parent', 'Lien parent',
  'Téléphone', 'Email',
  'Club 2025/2026', 'Club précédent', 'Commentaire',
  'Droit à l\'image', 'Signature', 'Date signature',
  'Catégorie', 'Éducateur', 'Tél éducateur',
];

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data  = JSON.parse(e.postData.contents);

    // Crée la ligne d'en-têtes si la feuille est vide
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      data.nom_joueur         || '',
      data.prenom_joueur      || '',
      data.date_naissance     || '',
      data.ville_naissance    || '',
      data.ville_residence    || '',
      data.sexe               || '',
      data.nom_parent         || '',
      data.prenom_parent      || '',
      data.lien_parent        || '',
      data.telephone          || '',
      data.email              || '',
      data.club_saison        || '',
      data.nom_club_precedent || '',
      data.commentaire        || '',
      data.droit_image        || '',
      data.signature          || '',
      data.date_signature     || '',
      data.categorie          || '',
      data.nom_educateur      || '',
      data.tel_educateur      || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Pour tester que le script est bien déployé
function doGet() {
  return ContentService.createTextOutput('EPRS Inscriptions — Apps Script actif');
}
