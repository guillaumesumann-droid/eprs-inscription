// EPRS Football — Inscriptions 2026/2027
// Google Apps Script — Extensions > Apps Script du Google Sheet
// Déployer : Application web / Exécuter en tant que "Moi" / Accès "Tout le monde"

var SHEET_NAME          = 'Inscriptions';
var EMAIL_COORDINATEUR  = 'guillaume.sumann@gmail.com';

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
    var data  = JSON.parse(e.parameter.data);

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

    // Notification à Guillaume
    envoyerNotificationCoordinateur(data);

    // Confirmation au parent (ou au joueur si Senior)
    if (data.email) {
      envoyerConfirmationParent(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    MailApp.sendEmail(EMAIL_COORDINATEUR,
      '⚠️ Erreur inscription EPRS',
      'Erreur lors du traitement d\'une inscription :\n\n' + err.toString()
    );
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function envoyerNotificationCoordinateur(data) {
  var sujet = '⚽ Nouvelle inscription EPRS — ' + data.prenom_joueur + ' ' + (data.nom_joueur || '').toUpperCase();

  var corps =
    'Nouvelle demande d\'inscription reçue.\n\n' +
    '👤 JOUEUR\n' +
    'Nom : ' + data.prenom_joueur + ' ' + data.nom_joueur + '\n' +
    'Naissance : ' + data.date_naissance + ' — ' + data.ville_naissance + '\n' +
    'Résidence : ' + data.ville_residence + '\n' +
    'Sexe : ' + data.sexe + '\n' +
    'Catégorie : ' + data.categorie + '\n\n' +
    '👪 CONTACT\n' +
    'Parent : ' + data.prenom_parent + ' ' + data.nom_parent +
      (data.lien_parent ? ' (' + data.lien_parent + ')' : '') + '\n' +
    'Téléphone : ' + data.telephone + '\n' +
    'Email : ' + data.email + '\n\n' +
    '🏟️ CLUB PRÉCÉDENT\n' +
    data.club_saison + (data.nom_club_precedent ? ' — ' + data.nom_club_precedent : '') + '\n\n' +
    '📸 DROIT À L\'IMAGE\n' +
    data.droit_image + '\n\n' +
    '✍️ SIGNATURE\n' +
    data.signature + ' — ' + data.date_signature +
    (data.commentaire ? '\n\n💬 COMMENTAIRE\n' + data.commentaire : '');

  MailApp.sendEmail(EMAIL_COORDINATEUR, sujet, corps);
}

function envoyerConfirmationParent(data) {
  var prenomContact = data.prenom_parent || data.prenom_joueur;
  var sujet = '✅ Demande d\'inscription EPRS 2026/2027 reçue — ' + data.prenom_joueur;

  var corps =
    'Bonjour ' + prenomContact + ',\n\n' +
    'Nous avons bien reçu la demande d\'inscription de ' + data.prenom_joueur + ' pour la saison 2026/2027.\n' +
    'Merci et bienvenue dans la famille EPRS !\n\n' +
    '📋 RÉCAPITULATIF\n' +
    '• Joueur : ' + data.prenom_joueur + ' ' + data.nom_joueur + '\n' +
    '• Catégorie : ' + data.categorie + '\n' +
    '• Droit à l\'image : ' + data.droit_image + '\n\n' +
    '👤 ÉDUCATEUR RESPONSABLE — ' + data.categorie + '\n' +
    '• ' + data.nom_educateur + '\n' +
    '• 📱 ' + data.tel_educateur + '\n\n' +
    '📋 PROCHAINES ÉTAPES\n' +
    '1. Licence FFF — Vous recevrez un email de la FFF pour valider la licence officielle de ' + data.prenom_joueur + '.\n' +
    '2. SportEasy — Un email d\'invitation vous sera envoyé pour régler la cotisation en ligne.\n' +
    '3. Contact éducateur — ' + data.nom_educateur + ' reviendra vers vous rapidement.\n\n' +
    'À très bientôt sur les terrains du Pays de Bitche !\n\n' +
    'Guillaume Sumann\n' +
    'Coordinateur des jeunes — EPRS\n' +
    '📱 06 76 93 73 28';

  MailApp.sendEmail(data.email, sujet, corps);
}

function doGet() {
  return ContentService.createTextOutput('EPRS Inscriptions — Apps Script actif');
}
