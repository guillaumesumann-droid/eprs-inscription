# EPRS Football — Site d'inscription 2025/2026

Formulaire d'inscription en ligne pour les jeunes du club **Entente Petit-Réderching Siersthal (EPRS)**, hébergé sur GitHub Pages.

---

## 🚀 Mise en ligne — Guide pas-à-pas

### Étape 1 — Créer un compte Formspree et récupérer l'endpoint

1. Allez sur [https://formspree.io](https://formspree.io) et créez un compte gratuit.
2. Cliquez sur **"New Form"**.
3. Donnez-lui un nom (ex. : `EPRS Inscriptions 2025`).
4. Copiez l'**endpoint** fourni, qui ressemble à : `https://formspree.io/f/xabc1234`

### Étape 2 — Coller l'endpoint dans script.js

Ouvrez `script.js` et remplacez la valeur à la première ligne :

```js
const FORMSPREE_ENDPOINT = "REMPLACER_PAR_TON_ENDPOINT_FORMSPREE";
// → devient :
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xabc1234";
```

### Étape 3 — Configurer le message de réponse automatique dans Formspree

Dans le tableau de bord Formspree, onglet **"Settings" > "Auto-Response"**, activez la réponse automatique et configurez :

**Objet :**
```
✅ Demande d'inscription EPRS 2025/2026 reçue
```

**Corps du message :**
```
Bonjour {prenom_parent},

Nous avons bien reçu la demande d'inscription de {prenom_joueur} pour la saison 2025/2026.
Merci et bienvenue dans la famille EPRS !

📞 L'éducateur responsable de la catégorie de votre enfant vous contactera prochainement :

👤 [NOM_EDUCATEUR — À COMPLÉTER]
📱 [TEL_EDUCATEUR — À COMPLÉTER]
📧 [EMAIL_EDUCATEUR — À COMPLÉTER]
💬 WhatsApp : [WHATSAPP_EDUCATEUR — À COMPLÉTER]

📋 Rappel des prochaines étapes :

1. Licence FFF — Vous recevrez un email de la FFF pour valider la licence officielle de votre enfant.

2. SportEasy — Si vous n'avez pas encore de compte, vous recevrez un email d'invitation pour en créer un et régler la cotisation en ligne, en toute sécurité.

3. Contact éducateur — Il reviendra vers vous rapidement pour confirmer l'intégration de {prenom_joueur} dans l'équipe.

⚠️ Rappel si mutation : si votre enfant rejoint l'EPRS depuis un autre club en catégorie U13, U15, U16 ou U17, la date limite de mutation est le 15 juillet 2025. Passé le 15 juillet 2025, votre dossier sera traité en mutation hors délai. Cette procédure est plus contraignante : elle nécessite l'accord du club quitté et est soumise à validation par le District. Nous vous conseillons vivement de déposer votre demande avant cette date.

📸 Droit à l'image : {droit_image}
✍️ Signé électroniquement par : {signature_electronique}
📅 Le : {date_signature}

À très bientôt sur les terrains du Pays de Bitche !

Guillaume Sumann
Coordinateur des jeunes — EPRS
📱 [TON_NUMERO — À COMPLÉTER]
```

> **Note :** Formspree injecte automatiquement les valeurs entre `{accolades}` avec les données du formulaire.

### Étape 4 — Remplacer les placeholders éducateurs

Dans le message de réponse automatique (voir étape 3), remplacez :

| Placeholder            | Valeur à saisir                  |
|------------------------|----------------------------------|
| `[NOM_EDUCATEUR]`      | Nom et prénom de l'éducateur     |
| `[TEL_EDUCATEUR]`      | Numéro de téléphone              |
| `[EMAIL_EDUCATEUR]`    | Adresse email                    |
| `[WHATSAPP_EDUCATEUR]` | Numéro WhatsApp                  |
| `[TON_NUMERO]`         | Ton numéro de coordinateur       |

### Étape 5 — Déployer sur GitHub Pages

```bash
# 1. Initialiser le dépôt local (déjà fait si tu as suivi les instructions de setup)
cd ~/Documents/eprs-inscription

# 2. Ajouter tous les fichiers
git add index.html style.css script.js confirmation.html README.md

# 3. Premier commit
git commit -m "feat: site d'inscription EPRS 2025/2026"

# 4. Créer le dépôt sur GitHub
#    Rends-toi sur https://github.com/new
#    Nom du dépôt : eprs-inscription
#    Visibilité : Public (requis pour GitHub Pages gratuit)
#    Ne coche PAS "Initialize this repository"

# 5. Connecter le dépôt local au dépôt GitHub
git remote add origin https://github.com/TON_USERNAME/eprs-inscription.git
git branch -M main
git push -u origin main

# 6. Activer GitHub Pages
#    Sur GitHub : Settings → Pages → Source → "Deploy from a branch" → main / (root) → Save

# 7. Ton site sera disponible sous 1-2 minutes à l'adresse :
#    https://TON_USERNAME.github.io/eprs-inscription/
```

> **Important :** Une fois déployé, vérifie que la redirection Formspree fonctionne.
> La valeur du champ `_next` est calculée automatiquement par `script.js` à partir de l'URL courante.

---

## 🔄 Checklist de mise à jour chaque saison

Au début de chaque nouvelle saison, mets à jour les éléments suivants :

### Dans `index.html`
- [ ] Titre de la page (`<title>`) : `2025/2026` → `2026/2027`
- [ ] Texte hero : `"La saison 2025/2026 approche…"`
- [ ] Bannière alerte info : texte d'ouverture des inscriptions
- [ ] Bannière alerte warning : date limite de mutation (ex. : `15 juillet 2026`)
- [ ] Label select club : `"Club du joueur en 2024/2025"` → `"Club du joueur en 2025/2026"`
- [ ] Option select EPRS : `"EPRS"` reste, mais les autres valeurs peuvent évoluer
- [ ] Footer copyright : `© 2025` → `© 2026`

### Dans `script.js`
- [ ] Table `CATEGORIES` : **ajouter 1 an à chaque fourchette de naissance** (règle universelle)
  ```js
  // Exemple pour 2026/2027 :
  2021: 'U7',  2020: 'U7',
  2019: 'U9',  2018: 'U9',
  2017: 'U11', 2016: 'U11',
  2015: 'U13', 2014: 'U13',
  2013: 'U15', 2012: 'U15',
  2011: 'U16',
  2010: 'U17',
  2009: 'Senior', 2008: 'Senior',
  ```
- [ ] Validation `dateNaissance` : ajuster `min` et `max` (+1 an)
  ```
  min="2008-01-01" max="2021-12-31"
  ```

### Dans `confirmation.html`
- [ ] Footer copyright

### Dans `images/`
- [ ] Remplacer `hero.jpg` par une nouvelle photo de terrain/équipe si disponible
- [ ] Remplacer les photos de catégories si les groupes d'âge ont des nouvelles équipes

### Dans Formspree (tableau de bord)
- [ ] Mettre à jour l'objet de l'email de réponse automatique
- [ ] Mettre à jour la date limite de mutation dans le corps du message
- [ ] Mettre à jour les coordonnées des éducateurs si elles ont changé
- [ ] Mettre à jour la saison dans le texte du droit à l'image (`2025/2026` → `2026/2027`)

---

## 📁 Structure du projet

```
eprs-inscription/
├── index.html          → Page principale avec formulaire 4 étapes
├── style.css           → Feuille de style (mobile-first, couleurs EPRS)
├── script.js           → Logique formulaire, validation, catégories
├── confirmation.html   → Page de confirmation après envoi
├── README.md           → Ce guide
└── images/
    ├── logo.png        → Logo officiel du club (80px de hauteur)
    ├── hero.jpg        → Photo équipe / terrain (bannière hero, ~1400×500px)
    ├── u7.jpg          → Photo catégorie U7
    ├── u9.jpg          → Photo catégorie U9
    ├── u11.jpg         → Photo catégorie U11
    ├── u13.jpg         → Photo catégorie U13
    ├── u15.jpg         → Photo catégorie U15
    ├── u16.jpg         → Photo catégorie U16
    ├── u17.jpg         → Photo catégorie U17
    └── seniors.jpg     → Photo équipe Senior (utilisée pour tous les Seniors)
```

> **Note images :** Si un fichier image est absent, un placeholder bleu/rouge "📷 Photo à venir" s'affiche automatiquement grâce au mécanisme `onerror` HTML. Les images sont donc optionnelles au lancement.

---

## 🎨 Charte graphique

| Élément    | Valeur     |
|------------|------------|
| Bleu EPRS  | `#1a3a6b`  |
| Rouge EPRS | `#c0392b`  |
| Fond       | `#f8f7f4`  |
| Titre      | Oswald     |
| Corps      | Lato       |

---

## 📋 Catégories (saison 2025/2026)

L'EPRS regroupe les catégories par deux pour les jeunes, puis passe en individuel à partir de U16.

| Année de naissance | Catégorie EPRS | Note                         |
|--------------------|----------------|------------------------------|
| 2020 ou 2019       | U7             | Regroupe U6 + U7             |
| 2018 ou 2017       | U9             | Regroupe U8 + U9             |
| 2016 ou 2015       | U11            | Regroupe U10 + U11           |
| 2014 ou 2013       | U13            | Regroupe U12 + U13 ⚠️ mutation |
| 2012 ou 2011       | U15            | Regroupe U14 + U15 ⚠️ mutation |
| 2010               | U16            | ⚠️ mutation                  |
| 2009               | U17            | ⚠️ mutation                  |
| 2008 ou avant      | Senior         | Pas de mutation spécifique   |

> ⚠️ Les catégories **U13, U15, U16 et U17** sont soumises à la procédure de mutation si le joueur vient d'un autre club (date limite : 15 juillet 2025).  
> Les catégories U7, U9, U11 et Senior ne sont **pas** concernées par cette limite.

**Règle annuelle :** chaque saison, ajouter 1 an à chaque fourchette de naissance (ex. U7 : 2019/2020 → 2020/2021).

---

## ❓ Support

Guillaume Sumann — Coordinateur des jeunes EPRS  
✉️ guillaume.sumann@gmail.com
