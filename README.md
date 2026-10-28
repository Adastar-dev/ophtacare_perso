# OphtaCare — version personnelle

Application de suivi de patients pour **une ophtalmologue qui consulte dans plusieurs lieux**
(cliniques, hôpitaux, cabinets). Elle s'utilise sur iPhone et sur Mac, depuis le navigateur
ou installée comme une app sur l'écran d'accueil.

## Ce que fait l'application

- **Mes lieux** : la liste des cliniques et hôpitaux où elle consulte, chacun avec une couleur.
- **Lieu actif** (en haut de l'écran) : en arrivant dans une clinique, elle la choisit une fois.
  L'accueil, les patients, l'agenda, les consultations et les ordonnances sont alors filtrés sur ce lieu,
  et les nouvelles fiches y sont rattachées par défaut. « Tous les lieux » montre tout.
- **Patients** : recherche par nom, prénom, téléphone ou code patient, dans un lieu ou partout.
  Chaque patient a un *lieu habituel*, et **chaque consultation garde le lieu où elle a eu lieu**.
  Un patient vu dans deux lieux a donc une seule fiche, avec tout son historique.
- **Fiche patient** : identité, allergies, antécédents, historique des consultations (avec le lieu),
  tableau d'évolution (acuité, réfraction, tonus), ordonnances et rendez-vous.
- **Consultation** : acuité de loin (avec et sans correction) et de près, réfraction, tonus,
  lampe à fente, fond d'œil, diagnostic, conduite à tenir. On peut saisir une date passée
  (pour reprendre d'anciennes fiches papier) et reprendre la réfraction de la dernière visite.
- **Ordonnances** : correction optique et/ou traitement (collyres…), imprimables ou enregistrables
  en PDF. L'en-tête reprend ses informations (Paramètres) et le lieu de la consultation.
- **Agenda** : rendez-vous par lieu (couleur), statut prévu / vu / absent / annulé, et
  « Commencer la consultation » depuis un rendez-vous.

Les champs cliniques sensibles (diagnostic, observations, examens, conduite à tenir) sont
**chiffrés en base** avec la clé `APP_KEY`. **Ne perdez jamais cette clé** : sans elle, ces
champs sont illisibles. Gardez une copie du fichier `.env` en lieu sûr.

## Structure

```
backend/   API Laravel 12 (PHP 8.2+), base SQLite par défaut
frontend/  Interface Next.js 16, exportée en pages statiques
scripts/   deploy-frontend.sh : compile le frontend et le copie dans backend/public
```

En production, **un seul serveur PHP** sert à la fois l'API (`/api/…`) et l'application.

## Lancer en local (pour développer)

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed        # données de démo : demo@ophtacare.local / demo1234
php artisan serve                 # http://127.0.0.1:8000

# Frontend (autre terminal)
cd frontend
npm install
npm run dev                       # http://localhost:3000
```

Le frontend de développement appelle l'API sur `http://127.0.0.1:8000/api`
(fichier `frontend/.env.development`).

Pour tester depuis l'iPhone sur le même Wi-Fi : `php artisan serve --host=0.0.0.0`,
`npm run dev -- -H 0.0.0.0`, et mettez l'IP du Mac dans `frontend/.env.development`.

## Mise en production

1. Sur le serveur (PHP 8.2+ avec les extensions `pdo_sqlite` ou `pdo_mysql`, `mbstring`, `openssl`) :
   ```bash
   cd backend
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   php artisan key:generate
   ```
2. Dans `.env` : `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://votre-domaine`,
   `FRONTEND_URL=https://votre-domaine`.
3. Base de données et compte :
   ```bash
   touch database/database.sqlite
   php artisan migrate --force
   php artisan ophtacare:compte       # demande le nom, l'email et le mot de passe
   ```
4. Frontend : sur votre machine, `./scripts/deploy-frontend.sh`, puis envoyez le dossier
   `backend/` (avec `public/` rempli) sur le serveur.
5. Le site **doit être en HTTPS** (données médicales, connexion depuis l'iPhone).
   La racine web du domaine doit pointer sur `backend/public`.
6. `php artisan config:cache && php artisan route:cache`

### Sauvegardes

Avec SQLite, toutes les données tiennent dans `backend/database/database.sqlite`.
Copiez régulièrement ce fichier **et** le `.env` (pour la clé `APP_KEY`) vers un endroit sûr.

## Installer sur l'iPhone et le Mac

- **iPhone** : ouvrir le site dans Safari → bouton Partager → « Sur l'écran d'accueil ».
- **Mac** : Safari → Fichier → « Ajouter au Dock » (ou Chrome → Installer l'application).

## Comptes

Il n'y a **pas d'inscription** : un seul compte, créé avec `php artisan ophtacare:compte`
(la même commande permet de changer le mot de passe si elle l'oublie).
Le mot de passe se change aussi depuis Paramètres. La connexion est limitée à 5 essais par minute.

## Changements par rapport à la version multi-cliniques d'origine

- Supprimé : rôles (admin, secrétaire, caissier, patient), inscription publique, espace patient,
  paiements (guichet, Wave, Orange Money), rappels, journaux d'activité, lien public « opticien ».
- La clinique ne possède plus ses utilisateurs : c'est la praticienne qui possède ses **lieux**.
  Consultations et rendez-vous ont chacun leur lieu ; le patient a un lieu habituel facultatif.
- Consultation : tous les champs saisis sont désormais enregistrés (acuité avec correction,
  vision de près, tonus, lampe à fente, fond d'œil, conduite à tenir), avec une date modifiable.
  Une consultation ouverte depuis la fiche se rattache au rendez-vous prévu le jour même.
- Ordonnance : partie « Traitement » ajoutée, en-tête au nom de la praticienne et du lieu,
  impression sans fenêtre popup (compatible iPhone).
- Agenda : choix du patient (absent dans la version d'origine), statuts vu / absent / annulé.
- Frontend exporté en statique et servi par Laravel : un seul serveur à héberger.
- Tests automatisés de l'API : `cd backend && php artisan test`.
