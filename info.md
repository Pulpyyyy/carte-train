# Train Traveler Card

Tableau des prochains trains pour Home Assistant, à partir de l'intégration [Train Traveler](https://github.com/Matthyeux/train-traveler) : une ligne par train, une colonne par information.

**Fonctionnalités :**
- 🚂 Lecture des entités par leur **attribut `journeys`**, insensible aux renommages
- 🔀 Plusieurs trajets dans un seul tableau, aller et retour côte à côte
- ↕️ Choix et ordre des trajets et des colonnes, en YAML comme à la souris
- 🖱️ Tri configurable et clic sur les en-têtes pour trier à la volée
- 🎨 Durée en dégradé vert → rouge, retards en vert / orange / rouge, seuils réglables
- ⏱️ Les trains partis quittent le tableau tout seuls, compte à rebours du prochain départ
- ✏️ Éditeur graphique en six sections repliables
- 📱 Sélecteur de carte « par entité » de HA 2026.6+

**Contenu :**
- Carte Lovelace `custom:train-traveler-card` (éditeur visuel inclus)

**Compatibilité :**
- Home Assistant 2024.4.0+ (le sélecteur par entité demande 2026.6+, ignoré avant)
- Intégration [Train Traveler](https://github.com/Matthyeux/train-traveler) requise
- Tous les navigateurs supportant les Web Components
