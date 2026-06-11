/* =============================================
   EPRS Football — Inscriptions 2026/2027
   script.js
   ============================================= */

// Google Sheets via Apps Script
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxmK_DxYFlRC10KVhhuQ_uakAuiF2GdEoM4n4gI_8jJKtOR_QBMQCbKLQs1DvQWnp-qSw/exec";

// 15 juillet 2026 à 23h59 heure de Paris (CEST = UTC+2)
const MUTATION_DEADLINE = new Date('2026-07-15T23:59:00+02:00');
let deadlinePassed = false;

// ── Catégories par année de naissance (saison 2026/2027) ──
const CATEGORIES = {
  2021: 'U7',  2020: 'U7',
  2019: 'U9',  2018: 'U9',
  2017: 'U11', 2016: 'U11',
  2015: 'U13', 2014: 'U13',
  2013: 'U15', 2012: 'U15',
  2011: 'U16',
  2010: 'U17',
  2009: 'Senior', 2008: 'Senior',
  // 2007 et avant → Senior (fallback dans onDateChange/getCategory)
};

// Photo associée à chaque catégorie

// Seules U7, U9, U11 sont exemptées de l'alerte mutation
const MUTATION_CATEGORIES = ['U13', 'U15', 'U16', 'U17', 'Senior'];

// Coordonnées des éducateurs par catégorie
const EDUCATEURS = {
  U7:     { nom: "Guillaume Sumann", tel: "0676937328" },
  U9:     { nom: "Claude Behr",      tel: "0688244029" },
  U11:    { nom: "Gilles Steiner",   tel: "0670348580" },
  U13:    { nom: "Maxime Collet",     tel: "0610373666" },
  U15:    { nom: "Benjamin Neu",      tel: "0771948572" },
  U16:    { nom: "Mickael D'anna",   tel: "0632083768" },
  U17:    { nom: "Lucas Homer",      tel: "0771667769" },
  Senior: { nom: "Alexandre Neu",    tel: "0770707996" },
};

let currentStep = 1;
let isSenior    = false; // true si catégorie Senior (né en 2009 ou avant)

// ── Init ──
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('inscriptionForm');
  // URL de redirection après soumission
  document.getElementById('fieldNext').value =
    window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'confirmation.html';

  // Date de signature auto (date du jour)
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  document.getElementById('fieldDateSign').value = today;
  document.getElementById('signatureDateDisplay').textContent = today;

  // Date de naissance → catégorie + photo
  document.getElementById('dateNaissance').addEventListener('change', onDateChange);

  // Club précédent conditionnel
  document.getElementById('clubSaison').addEventListener('change', function () {
    const group = document.getElementById('nomClubGroup');
    group.hidden = this.value !== 'Autre club';
    if (group.hidden) {
      document.getElementById('nomClub').value = '';
      clearError('nomClub');
    }
  });

  // Démarrage du compte à rebours
  startCountdown();

  // Droit à l'image : mise à jour refus message + résumé en direct
  document.querySelectorAll('input[name="droit_image"]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.getElementById('refusalBubble').hidden = this.value !== 'Non autorisé';
      clearError('droitImage');
      buildSummary();
    });
  });

  // Signature en direct → mise à jour résumé
  document.getElementById('signatureElec').addEventListener('input', buildSummary);

  // Soumission : AJAX Formspree → EmailJS → redirect
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep4()) return;

    // ── Prépare les champs cachés ──
    const prenom     = val('prenom_joueur');
    const nom        = val('nomJoueur');
    const categorie  = document.getElementById('categoryBadge').textContent.replace('Catégorie : ', '').trim();
    const droitImg   = (document.querySelector('input[name="droit_image"]:checked') || {}).value || '—';
    const signature  = val('signatureElec').trim();
    const dateSign   = document.getElementById('fieldDateSign').value;
    const prenomContact = isSenior ? prenom : val('prenom_parent');

    document.getElementById('fieldSubject').value   = 'Nouvelle inscription EPRS — ' + prenom + ' ' + nom.toUpperCase();
    document.getElementById('fieldCategorie').value = categorie;

    // ── Stocke pour page confirmation ──
    sessionStorage.setItem('eprs_registration', JSON.stringify({
      categorie,
      prenomJoueur: prenom,
      prenomParent: prenomContact,
      droitImage: droitImg,
      signature,
      dateSign,
    }));

    // ── Debug : vérification des champs avant envoi EmailJS ──
    console.log("Données formulaire :", {
      email:         document.getElementById('email')?.value,
      prenom_parent: document.getElementById('prenom_parent')?.value,
      prenom_joueur: document.getElementById('prenom_joueur')?.value,
      categorie:     window.categorieSelectionnee,
    });

    // ── Capture les données avant le fetch (DOM encore accessible) ──
    var formData = {
      email:         document.getElementById('email').value,
      prenom_parent: document.getElementById('prenom_parent').value,
      prenom_joueur: document.getElementById('prenom_joueur').value,
      categorie:     categorie,
    };

    // ── UI : état chargement ──
    const submitBtn = form.querySelector('.btn--submit');
    submitBtn.disabled    = true;
    submitBtn.textContent = '⏳ Envoi en cours…';

    var educateur = EDUCATEURS[formData.categorie] || { nom: 'À définir', tel: 'À définir' };
    var templateParams = {
      email:         formData.email,
      prenom_parent: formData.prenom_parent || formData.prenom_joueur,
      prenom_joueur: formData.prenom_joueur,
      categorie:     formData.categorie,
      nom_educateur: educateur.nom,
      tel_educateur: educateur.tel,
    };

    // ── 1. Google Sheets via Apps Script (fire-and-forget, no-cors) ──
    var payload = {
      nom_joueur:         val('nomJoueur'),
      prenom_joueur:      val('prenom_joueur'),
      date_naissance:     val('dateNaissance'),
      ville_naissance:    val('villeNaissance'),
      ville_residence:    val('villeResidence'),
      sexe:               (document.querySelector('input[name="sexe"]:checked') || {}).value || '',
      nom_parent:         val('nomParent'),
      prenom_parent:      val('prenom_parent'),
      lien_parent:        val('lienParent'),
      telephone:          val('telephone'),
      email:              formData.email,
      club_saison:        val('clubSaison'),
      nom_club_precedent: val('nomClub'),
      commentaire:        val('commentaire'),
      droit_image:        (document.querySelector('input[name="droit_image"]:checked') || {}).value || '',
      signature:          val('signatureElec'),
      date_signature:     document.getElementById('fieldDateSign').value,
      categorie:          formData.categorie,
      nom_educateur:      educateur.nom,
      tel_educateur:      educateur.tel,
    };

    var formBody = new URLSearchParams();
    formBody.append('data', JSON.stringify(payload));
    fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode:   'no-cors',
      body:   formBody,
    }).catch(function (err) { console.error('Google Sheets:', err); });

    // ── 2. Make.com webhook (fire-and-forget) ──
    fetch("https://hook.eu1.make.com/dtwh31l3g7g8pzktlhuamv94acnvhrkv", {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(templateParams),
    }).catch(function (err) { console.error('Make webhook:', err); });

    // ── 4. Redirect vers page confirmation ──
    window.location.href = document.getElementById('fieldNext').value;
  });
});

// ── Navigation ──
function nextStep(n) {
  let valid;
  if      (n === 1) valid = validateStep1();
  else if (n === 2) valid = validateStep2();
  else if (n === 3) valid = validateStep3();
  if (!valid) return;

  document.getElementById('step' + n).classList.remove('active');
  document.getElementById('step' + (n + 1)).classList.add('active');
  currentStep = n + 1;
  updateProgress(currentStep);

  if (currentStep === 2) updateStep2ForCategory();
  if (currentStep === 3) updateEducateurDisplay(getCategory());
  if (currentStep === 4) { updateStep4ForCategory(); buildSummary(); }
  window.scrollTo({ top: document.querySelector('.form-card').offsetTop - 20, behavior: 'smooth' });
}

function prevStep(n) {
  document.getElementById('step' + n).classList.remove('active');
  document.getElementById('step' + (n - 1)).classList.add('active');
  currentStep = n - 1;
  updateProgress(currentStep);
  window.scrollTo({ top: document.querySelector('.form-card').offsetTop - 20, behavior: 'smooth' });
}

// ── Éducateur : affichage carte + champs cachés ──
function updateEducateurDisplay(cat) {
  const edu   = EDUCATEURS[cat] || null;
  const info  = document.getElementById('educateurInfo');
  const nomEl = document.getElementById('educateurNom');
  const telEl = document.getElementById('educateurTel');

  if (edu) {
    nomEl.textContent = edu.nom;
    telEl.textContent = edu.tel;
    telEl.href = 'tel:' + edu.tel;
    info.hidden = false;
    document.getElementById('fieldNomEducateur').value = edu.nom;
    document.getElementById('fieldTelEducateur').value = edu.tel;
  } else {
    info.hidden = true;
    document.getElementById('fieldNomEducateur').value = '';
    document.getElementById('fieldTelEducateur').value = '';
  }
}

// ── Compte à rebours ──
function startCountdown() {
  const timer   = document.getElementById('countdownTimer');
  const expired = document.getElementById('countdownExpired');
  const box     = document.getElementById('countdownBox');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = MUTATION_DEADLINE - new Date();

    if (diff <= 0) {
      deadlinePassed = true;
      timer.hidden   = true;
      expired.hidden = false;
      box.classList.add('countdown-box--expired');
      return; // arrêt du timer
    }

    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000)  / 60000);
    const seconds = Math.floor((diff % 60000)    / 1000);

    document.getElementById('cdDays').textContent    = pad(days);
    document.getElementById('cdHours').textContent   = pad(hours);
    document.getElementById('cdMinutes').textContent = pad(minutes);
    document.getElementById('cdSeconds').textContent = pad(seconds);

    setTimeout(tick, 1000);
  }

  tick();
}

// ── Adaptation étape 2 selon catégorie ──
function updateStep2ForCategory() {
  document.getElementById('step2Title').textContent =
    isSenior ? 'Vos coordonnées' : 'Parent / Tuteur légal';

  document.getElementById('labelNomParent').innerHTML =
    (isSenior ? 'Votre nom' : 'Nom') + ' <span class="req" aria-hidden="true">*</span>';

  document.getElementById('labelPrenomParent').innerHTML =
    (isSenior ? 'Votre prénom' : 'Prénom') + ' <span class="req" aria-hidden="true">*</span>';

  const lienGroup = document.getElementById('lienParentGroup');
  lienGroup.hidden = isSenior;
  if (isSenior) {
    document.getElementById('lienParent').value = '';
    clearError('lienParent');
  }
}

// ── Adaptation étape 4 selon catégorie ──
function updateStep4ForCategory() {
  document.getElementById('legalTextMineur').hidden =  isSenior;
  document.getElementById('legalTextSenior').hidden = !isSenior;

  const droitLabel = isSenior ? 'de mes images' : 'des images de mon enfant';
  document.getElementById('droitOuiLabel').textContent = droitLabel;
  document.getElementById('droitNonLabel').textContent = droitLabel;

  document.getElementById('refusalText').textContent = isSenior
    ? 'votre inscription au club'
    : 'l\'inscription de votre enfant au club';
}

function updateProgress(step) {
  const labels = [
    '',
    'Étape 1/4 — Joueur',
    'Étape 2/4 — Contact',
    'Étape 3/4 — Démarches',
    'Étape 4/4 — Droit à l\'image',
  ];
  document.getElementById('progressText').textContent = labels[step];

  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('pstep' + i);
    el.classList.remove('active', 'completed');
    if (i < step)   el.classList.add('completed');
    if (i === step) el.classList.add('active');
  }

  document.getElementById('line1').style.width = step >= 2 ? '100%' : '0';
  document.getElementById('line2').style.width = step >= 3 ? '100%' : '0';
  document.getElementById('line3').style.width = step >= 4 ? '100%' : '0';
}

// ── Catégorie et photo ──
function onDateChange() {
  const input   = document.getElementById('dateNaissance');
  const display = document.getElementById('categoryDisplay');
  const badge   = document.getElementById('categoryBadge');
  const alert   = document.getElementById('mutationAlert');

  clearError('dateNaissance');
  const raw = input.value;
  if (!raw) { display.hidden = true; return; }

  const year = new Date(raw).getFullYear();

  if (year > 2021) {
    display.hidden = true;
    showError('dateNaissance', 'Cette date ne correspond à aucune catégorie. Contactez Guillaume directement.');
    return;
  }

  const cat = CATEGORIES[year] || 'Senior';
  isSenior = (cat === 'Senior');
  window.categorieSelectionnee = cat;
  badge.textContent = 'Catégorie : ' + cat;
  display.hidden = false;

  // Alerte mutation
  if (MUTATION_CATEGORIES.includes(cat)) {
    if (deadlinePassed) {
      const pronoun = isSenior ? 'vous êtes' : 'votre enfant est';
      alert.innerHTML =
        '🔴 Attention : ' + pronoun + ' en mutation hors délai. ' +
        'La procédure nécessite l\'accord du club quitté et la validation du District. ' +
        'Contactez Guillaume directement.';
    } else {
      const sujet = isSenior ? 'Vous êtes' : 'Votre enfant est';
      alert.innerHTML =
        '⚠️ ' + sujet + ' en catégorie <strong>' + cat + '</strong>. ' +
        'La date limite de mutation est le <strong>15 juillet 2026</strong>.';
    }
    alert.hidden = false;
  } else {
    alert.hidden = true;
  }

  // Message humoristique pour les Seniors nés en 1995 ou avant
  document.getElementById('veteranHumor').hidden = (year > 1995);

  // Coordonnées éducateur
  updateEducateurDisplay(cat);

}

function getCategory() {
  const raw = val('dateNaissance');
  if (!raw) return null;
  const year = new Date(raw).getFullYear();
  return CATEGORIES[year] || 'Senior';
}

// ── Validation ──
function validateStep1() {
  let ok = true;

  if (!notEmpty('nomJoueur',    'Le nom du joueur est obligatoire.'))    ok = false;
  if (!notEmpty('prenom_joueur', 'Le prénom du joueur est obligatoire.')) ok = false;

  const dateInput = document.getElementById('dateNaissance');
  if (!dateInput.value) {
    showError('dateNaissance', 'La date de naissance est obligatoire.');
    ok = false;
  } else {
    const year = new Date(dateInput.value).getFullYear();
    if (year > 2021) {
      showError('dateNaissance', 'Cette date ne correspond à aucune catégorie. Contactez Guillaume directement.');
      ok = false;
    } else {
      clearError('dateNaissance');
    }
  }

  if (!notEmpty('villeNaissance', 'La ville de naissance est obligatoire.')) ok = false;


  if (!notEmpty('villeResidence', 'La ville de résidence est obligatoire.')) ok = false;

  if (!document.querySelector('input[name="sexe"]:checked')) {
    showError('sexe', 'Veuillez sélectionner le sexe.');
    ok = false;
  } else {
    clearError('sexe');
  }

  if (!ok) scrollToFirstError();
  return ok;
}

function validateStep2() {
  let ok = true;

  const nomMsg    = isSenior ? 'Votre nom est obligatoire.'    : 'Le nom du parent est obligatoire.';
  const prenomMsg = isSenior ? 'Votre prénom est obligatoire.' : 'Le prénom du parent est obligatoire.';
  if (!notEmpty('nomParent',    nomMsg))    ok = false;
  if (!notEmpty('prenom_parent', prenomMsg)) ok = false;

  if (!isSenior) {
    const lien = document.getElementById('lienParent');
    if (!lien.value) {
      showError('lienParent', 'Veuillez sélectionner le lien avec le joueur.');
      lien.classList.add('error');
      ok = false;
    } else {
      clearError('lienParent');
      lien.classList.remove('error');
    }
  }

  const tel = val('telephone').replace(/[\s.\-]/g, '');
  if (!tel) {
    showError('telephone', 'Le téléphone est obligatoire.');
    ok = false;
  } else if (!/^0[67]\d{8}$/.test(tel)) {
    showError('telephone', 'Le numéro doit commencer par 06 ou 07 et contenir 10 chiffres.');
    ok = false;
  } else {
    clearError('telephone');
  }

  const email = val('email').trim();
  if (!email) {
    showError('email', 'L\'adresse email est obligatoire.');
    ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('email', 'Veuillez saisir une adresse email valide.');
    ok = false;
  } else {
    clearError('email');
  }

  const club = document.getElementById('clubSaison');
  if (!club.value) {
    showError('clubSaison', 'Veuillez sélectionner le club de la saison 2025/2026.');
    club.classList.add('error');
    ok = false;
  } else {
    clearError('clubSaison');
    club.classList.remove('error');
  }

  if (club.value === 'Autre club' && !val('nomClub').trim()) {
    showError('nomClub', 'Veuillez indiquer le nom du club précédent.');
    ok = false;
  } else {
    clearError('nomClub');
  }

  if (!ok) scrollToFirstError();
  return ok;
}

function validateStep3() {
  let ok = true;

  if (!document.getElementById('checkDemarche').checked) {
    showError('checkDemarche', 'Veuillez cocher cette case pour continuer.');
    ok = false;
  } else {
    clearError('checkDemarche');
  }

  if (!document.getElementById('checkRGPD').checked) {
    showError('checkRGPD', 'Veuillez accepter l\'utilisation des données pour continuer.');
    ok = false;
  } else {
    clearError('checkRGPD');
  }

  return ok;
}

function validateStep4() {
  let ok = true;

  if (!document.querySelector('input[name="droit_image"]:checked')) {
    showError('droitImage', 'Veuillez indiquer votre choix concernant le droit à l\'image.');
    ok = false;
  } else {
    clearError('droitImage');
  }

  if (!notEmpty('signatureElec', 'La signature électronique est obligatoire.')) ok = false;

  if (!ok) scrollToFirstError();
  return ok;
}

// ── Récapitulatif (mis à jour en direct sur l'étape 4) ──
function buildSummary() {
  const categorie   = getCategory() || '—';
  const clubVal     = val('clubSaison');
  const clubAffiche = clubVal === 'Autre club'
    ? 'Autre club : ' + (val('nomClub') || '—')
    : (clubVal || '—');
  const droitEl    = document.querySelector('input[name="droit_image"]:checked');
  const droitImg   = droitEl
    ? (droitEl.value === 'Autorisé' ? '✅ Autorisé' : '❌ Non autorisé')
    : '—';
  const signature  = val('signatureElec').trim() || '—';
  const dateSign   = document.getElementById('fieldDateSign').value || '—';

  const rows = [
    { label: 'Joueur',             value: val('prenom_joueur') + ' ' + val('nomJoueur').toUpperCase() },
    { label: 'Date de naissance',  value: formatDate(val('dateNaissance')) },
    { label: 'Catégorie',          value: categorie },
    { label: 'Lieu de naissance',  value: val('villeNaissance') },
    { label: 'Ville de résidence', value: val('villeResidence') },
    { label: 'Sexe',               value: (document.querySelector('input[name="sexe"]:checked') || {}).value || '—' },
    { label: isSenior ? 'Vos coordonnées' : 'Parent / tuteur',
      value: isSenior
        ? val('prenom_parent') + ' ' + val('nomParent').toUpperCase()
        : val('prenom_parent') + ' ' + val('nomParent').toUpperCase() + ' (' + (val('lienParent') || '—') + ')' },
    { label: 'Téléphone',          value: val('telephone') },
    { label: 'Email',              value: val('email') },
    { label: 'Club 2025/2026',     value: clubAffiche },
    { label: 'Droit à l\'image',   value: droitImg },
    { label: 'Signature',          value: signature },
    { label: 'Date de signature',  value: dateSign },
  ];

  const comment = val('commentaire').trim();
  if (comment) rows.push({ label: 'Commentaire', value: comment, full: true });

  document.getElementById('summaryContent').innerHTML = rows.map(function (r) {
    return '<div class="summary-item' + (r.full ? ' summary-item--full' : '') + '">' +
      '<div class="s-label">' + r.label + '</div>' +
      '<div class="s-value">' + (r.value || '—') + '</div>' +
      '</div>';
  }).join('');
}

// ── Helpers ──
function val(id) {
  return (document.getElementById(id) || {}).value || '';
}

function notEmpty(id, msg) {
  const v = val(id).trim();
  if (!v) { showError(id, msg); return false; }
  clearError(id);
  return true;
}

function showError(id, msg) {
  const el    = document.getElementById('err_' + id);
  const input = document.getElementById(id);
  if (el)    el.textContent = msg;
  if (input) input.classList.add('error');
}

function clearError(id) {
  const el    = document.getElementById('err_' + id);
  const input = document.getElementById(id);
  if (el)    el.textContent = '';
  if (input) input.classList.remove('error');
}

function scrollToFirstError() {
  const first = document.querySelector('.field-error:not(:empty)');
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d + '/' + m + '/' + y;
}
