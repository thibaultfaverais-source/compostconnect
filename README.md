# 🌿 CompostConnect — Guide de déploiement

Application de suivi des composteurs partagés — SMIEEOM Val de Cher

---

## Étape 1 — Créer la base de données Firebase (gratuit)

1. Allez sur **https://console.firebase.google.com**
2. Cliquez **Créer un projet** → nommez-le `compostconnect-smieeom`
3. Désactivez Google Analytics (pas nécessaire) → **Créer le projet**
4. Dans le menu gauche, cliquez **Firestore Database** → **Créer une base de données**
   - Choisissez **Mode production**
   - Région : **eur3 (Europe)** → **Activer**
5. Allez dans l'onglet **Règles** de Firestore et remplacez le contenu par :
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   Cliquez **Publier**
6. Dans le menu gauche, cliquez **Paramètres du projet** (⚙️)
7. Descendez jusqu'à **Vos apps** → cliquez l'icône **</>** (Web)
8. Donnez un nom à l'app (ex: `CompostConnect`) → **Enregistrer l'app**
9. Copiez les valeurs de `firebaseConfig` affichées (vous en aurez besoin à l'étape 3)

---

## Étape 2 — Mettre le code sur GitHub

1. Créez un compte sur **https://github.com** si vous n'en avez pas
2. Créez un nouveau dépôt (repository) : **Nouveau** → nommez-le `compostconnect`
3. Uploadez tous les fichiers de ce dossier dans le dépôt
   - Ou utilisez Git en ligne de commande :
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/VOTRE-NOM/compostconnect.git
     git push -u origin main
     ```

---

## Étape 3 — Déployer sur Vercel (gratuit)

1. Allez sur **https://vercel.com** → **Sign up** avec votre compte GitHub
2. Cliquez **Add New Project** → importez votre dépôt `compostconnect`
3. Dans **Environment Variables**, ajoutez ces 6 variables une par une
   (valeurs copiées depuis Firebase à l'étape 1) :

   | Nom | Valeur |
   |-----|--------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `votre-projet.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `votre-projet` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `votre-projet.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
   | `VITE_FIREBASE_APP_ID` | `1:123...` |

4. Cliquez **Deploy** → Vercel construit et publie l'app automatiquement
5. Vous obtenez une URL publique du type : `https://compostconnect.vercel.app`

---

## Étape 4 — Partager avec les référents

- Envoyez l'URL Vercel à chaque référent avec son **code de site**
- Le code admin est **ADMIN**
- Les codes des 21 sites :

| Site | Code |
|------|------|
| Seigy | SEIGY |
| Thenay | THENAY |
| Sassay | SASSAY |
| Meusnes | MEUSNE |
| Soings-en-Sologne | SOINGS |
| Feings | FEINGS |
| Couddes | COUDDE |
| Montrichard | MONTRI |
| Mareuil-sur-Cher | MAREU |
| Choussy | CHOUSS |
| Fougères-sur-Bièvre | FOUGE |
| Pouillé | POUILL |
| Selles-sur-Cher | SELLES |
| Chémery | CHEMER |
| Monthou-sur-Cher | MONTHO |
| Contres | CONTRE |
| Noyers-sur-Cher | NOYERS |
| Angé | ANGE |
| Chissay-en-Touraine | CHISSA |
| Ouchamps | OUCHA |
| Thésée | THESEE |

---

## Développement local (optionnel)

```bash
# 1. Copiez le fichier d'environnement
cp .env.example .env
# Remplissez .env avec vos valeurs Firebase

# 2. Installez les dépendances
npm install

# 3. Lancez en local
npm run dev
# → Ouvrez http://localhost:5173
```

---

## Coûts

- **Firebase Firestore** : gratuit jusqu'à 1 Go de données et 50 000 lectures/jour
- **Vercel** : gratuit pour les projets personnels
- **Total : 0 €/mois** pour un usage associatif comme celui-ci
