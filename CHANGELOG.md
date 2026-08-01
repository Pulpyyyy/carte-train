# Changelog

Toutes les modifications notables de la carte sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et la numérotation
[Semantic Versioning](https://semver.org/lang/fr/). La version fait foi dans
`CARD_VERSION`, en tête de `dist/carte-train.js` : c'est elle que lit la chaîne de release
pour poser le tag.

## [1.0.0] - 2026-08-01

Première version.

### Ajouté

- Carte `custom:train-traveler-card` : un tableau des prochains trains lu directement dans
  l'attribut `journeys` des sensors de l'intégration
  [Train Traveler](https://github.com/Matthyeux/train-traveler). La découverte se fait par
  les attributs et non par le préfixe d'`entity_id` : renommer une entité ne casse rien.
- **Onze colonnes** : `route`, `departure`, `arrival`, `duration`, `physical_mode`,
  `status`, `line`, `direction`, `from`, `to`, `disruption`. Forme courte ou forme longue
  (`key`, `name`, `align`, `width`, `sortable`).
- **Plusieurs trajets dans un seul tableau** : `entities` accepte autant de sensors que
  voulu, et `entity` au singulier reste accepté. Liste vide = tous les trajets de
  l'intégration, futurs compris.
- **Tri** sur huit colonnes plus `manual`, clic sur les en-têtes pour trier à la volée, et
  deux chemins de retour au tri configuré : le bouton ↺ et le troisième clic.
- **Durée colorée** en dégradé HSL continu entre `duration_green` et `duration_red`.
- **Statut** : retard en orange puis en rouge selon `delay_warn` et `delay_alert`,
  perturbation sans retard chiffré en ⚠ orange avec son message en infobulle, tiret vert
  sinon.
- **Trains passés** retirés du tableau à mesure que l'heure avance (`hide_past`), et
  **compte à rebours** du prochain départ (`show_countdown`), tous deux rafraîchis toutes
  les 30 secondes tant que la carte est à l'écran.
- **Horaires** en trois formats (`time_format`) : `auto` n'affiche la date que lorsqu'elle
  change, `time` et `datetime` la forcent.
- **Éditeur graphique** en six sections repliables — Trajets, Tri, Colonnes, Affichage,
  Couleurs et seuils, Noms des trajets — avec résumé par section, verrous sur le dernier
  élément coché et repli sur `<details>` / `<input>` tant que `ha-expansion-panel` et
  `ha-switch` ne sont pas enregistrés.
- **Sélecteur de carte « par entité »** (HA 2026.6+) : deux mises en page proposées sur un
  sensor `journeys`.
- **Français et anglais**, carte et éditeur, suivant `hass.locale.language`, sans
  rechargement de page.
- `tools/screenshot.html` et `tools/screenshot.ps1` : banc de rendu qui charge la vraie
  carte depuis `dist/`, contrôle son rendu avant de garder les captures et régénère
  `.img/card.png` et `.img/dark.png`.
