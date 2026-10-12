# Documentation projet — BéBé Dome

**Version document :** 1.0  
**Date :** 9 août 2026  
**Stack :** Laravel 12 · React 19 · Inertia.js 2 · PostgreSQL · Tailwind CSS 4  

Ce document décrit l’application e-commerce **BéBé Dome** et les fonctionnalités réalisées (boutique, administration, listes de naissance, authentification, emails, déploiement).

---

## 1. Présentation

BéBé Dome est une boutique en ligne dédiée aux produits pour bébés. L’expérience est une application web moderne (SPA-like) basée sur **Inertia.js** : le backend Laravel sert des pages React sans API REST séparée pour le front boutique.

**Objectifs produit :**
- Catalogue clair avec catégories hiérarchiques
- Panier / wishlist / commande à domicile (paiement à la livraison)
- **Packs** curatés + **listes de naissance** partageables
- Espaces Admin et Client distincts
- Multilingue : français (défaut), anglais, arabe (RTL)

---

## 2. Architecture technique

| Couche | Technologie |
|--------|-------------|
| Backend | PHP 8.2+ / Laravel 12 |
| Front | React 19, TypeScript, Inertia 2, Vite, Tailwind 4 |
| Auth | Sessions Laravel + Socialite (Google / Facebook) |
| Rôles | Spatie Permission (`admin`, `customer`) |
| Médias | Spatie Media Library + disque `public` |
| PDF | DomPDF (factures commande) |
| BDD | PostgreSQL 16 (port hôte Docker **5433**) |
| Deploy | Docker multi-stage, Nginx, PHP-FPM, Supervisor, Railway |

Le worker de files d’attente (`php artisan queue:work`) est démarré automatiquement en production via **Supervisor**.

---

## 3. Boutique (shop)

### 3.1 Page d’accueil
Ordre des sections :
1. Cover / hero  
2. Marques (brands)  
3. Promotions  
4. Produits récents  
5. **Packs** listes de naissance  
6. Bannière produit  
7. Catégories  
8. Bloc confiance / livraison (COD)

### 3.2 Catalogue & navigation
- `/products` — catalogue  
- `/categories`, `/category/{slug}` — arbre de catégories (`parent_id`)  
- `/product/{slug}` — fiche produit (variants, galerie, avis)  
- `/search` — recherche + suggestions API  

### 3.3 Panier, wishlist, checkout
- Panier & wishlist côté client (localStorage / sessionStorage)  
- Checkout invité possible  
- Livraison : domicile, entreprise, retrait  
- Paiement live : **cash on delivery** (`config/payments.php`)  
- Chargily (CIB / Eddahabia) : prévu, non branché (`CHARGILY_ENABLED`)

### 3.4 i18n
Sélecteur de langue (globe). Fichiers : `resources/lang/{fr,en,ar}.json`.

---

## 4. Packs & listes de naissance

Fonctionnalité majeure livrée pour BéBé Dome.

### 4.1 Packs (admin)
- CRUD `/admin/birth-list-packs`  
- Types bébé : Nouveau-né / Bébé / Bambin  
- Affichés sur l’accueil et la vitrine `/listes-de-naissance`  
- Le client peut **cloner un pack** comme base de sa liste personnelle  

### 4.2 Listes personnelles (client)
- Création / édition (nom, prénom bébé optionnel, photo de couverture)  
- Upload image propre (JPG, PNG, WEBP, GIF — max 5 Mo) avec messages d’erreur  
- Ajout de produits depuis le catalogue  

### 4.3 Bouton « Ajouter à la liste » (partout)
Icône cadeau 🎁 sur les cartes produit (accueil, promos, catalogue, catégorie, recherche, wishlist) + bouton sur la fiche produit.

| Contexte | Comportement |
|----------|----------------|
| Desktop | Tooltip au survol (« Ajouter à *Nom de la liste* ») |
| Mobile | Icône toujours visible ; choix de liste en bottom sheet |
| 1 liste | Ajout immédiat |
| Plusieurs listes | Sélecteur |
| Aucune liste | Redirection création |
| Invité | Redirection login |

### 4.4 Partage & invités
- Lien public `/liste/{token}`  
- Actions invité : réserver, annuler, offrir, cagnotte  
- Visibilité privée → lien inaccessible aux étrangers  

Navbar boutique : libellé **Packs And Lists** (FR : Packs et listes).

---

## 5. Authentification & emails

### 5.1 Inscription / Google
- Inscription email + mot de passe  
- OAuth Google (et Facebook) en session web  
- Après Google (client) → redirection **accueil boutique** (plus le dashboard)  
- Pas d’OTP email après Google : l’email est déjà vérifié par Google  

### 5.2 Email de bienvenue
- Mailable `WelcomeEmail`  
- Texte : compte créé chez BéBé Dome — bienvenue  
- Envoyé à la **création** de compte (register + nouveau Google)  
- Dev : **Mailtrap sandbox** (inbox Mailtrap, pas Gmail réel)  

### 5.3 Commandes
- Email confirmation commande + facture PDF  
- Notification admin nouvelle commande  

---

## 6. Tableaux de bord

### Admin (`/admin/…`)
Statistiques, catégories (arbre), attributs, produits, **packs**, promotions, hero/marques, commandes clients, clients, recherche, notifications.

### Client (`/client/…`)
Tableau de bord, commandes, listes de naissance, wishlist, profil (avatar).

---

## 7. Déploiement Railway

1. Image Docker production (`railway.toml`)  
2. Variables d’environnement (`APP_KEY`, `APP_URL`, DB, `MAIL_*`, OAuth…)  
3. **Volume** obligatoire : `/var/www/html/storage/app/public`  
4. Port public = `$PORT` (Nginx), healthcheck `/up`  
5. Sans volume, les images uploadées disparaissent à chaque redeploy  

---

## 8. Installation locale (rappel)

```bash
docker compose up -d db
composer install && cp .env.example .env
php artisan key:generate && php artisan migrate --seed && php artisan storage:link
npm install && npm run dev
php artisan serve
```

Comptes seed : `admin@bebedome.dz` / `client@bebedome.dz` — mot de passe `zmartcs123`.

Tests : `composer test` ou `php artisan test`.

---

## 9. Synthèse des livrables récents

| Livrable | Statut |
|----------|--------|
| Arbre de catégories (parent / enfants) | ✅ |
| Listes de naissance + packs + partage invités | ✅ |
| Bouton Add-to-list sur toute la boutique | ✅ |
| UI upload couverture liste (validation + erreurs) | ✅ |
| Navbar « Packs And Lists » | ✅ |
| OAuth Google → shop home | ✅ |
| Welcome email + config Mailtrap | ✅ |
| Checkout COD | ✅ |
| i18n FR / EN / AR | ✅ |
| Docker + queue worker + notes Railway | ✅ |
| Chargily Pay (intégration réelle) | ⏳ Prévu |

---

## 10. Contact projet

Application réalisée pour la boutique **BéBé Dome**.  
Documentation générée pour le dépôt GitHub — dossier `docs/`.

---

*BéBé Dome — Documentation technique & fonctionnelle — © 2026*
