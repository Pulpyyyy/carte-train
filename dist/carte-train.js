/*!
 * train-traveler-card — tableau des prochains trains pour Home Assistant.
 *
 * Lit directement les entites de l'integration "Train Traveler" : tout sensor
 * portant un attribut `journeys` qui est une liste de trajets est pris en
 * compte. Aucun filtre sur le prefixe d'entity_id, la carte est donc insensible
 * aux renommages et ne demande aucun sensor template intermediaire.
 *
 * Ecrit en JS natif (pas de build, pas de dependance) et volontairement en
 * syntaxe ES2017 : pas de `?.` ni de `??`, pour rester lisible par les outils
 * d'analyse et par les navigateurs anciens.
 */

const CARD_VERSION = "1.0.0";

console.info(
  `%c 🚂 Train Traveler Card %c v${CARD_VERSION} %c`,
  "background:#2196F3;color:white;padding:2px 8px;border-radius:3px 0 0 3px;font-weight:bold",
  "background:#4CAF50;color:white;padding:2px 8px;border-radius:0 3px 3px 0",
  "background:none"
);

/* ---------- traduction ----------

   Les textes vivent ici, dans le fichier de la carte. Un plugin HACS est un
   fichier unique : HACS ne recree pas d'arborescence a cote de la ressource
   Lovelace, un import relatif vers `lang/xx.js` ne se resoudrait donc pas une
   fois installe. Les tables sont regroupees en tete du fichier pour que les
   langues se relisent en regard l'une de l'autre, avec les memes clefs dans le
   meme ordre.

   Ajouter une langue : copier une table sous le meme jeu de clefs, l'ajouter a
   `STRINGS`, puis etendre `setLanguageFrom`.

   La langue suit celle de Home Assistant : francais des que `hass` annonce une
   variante de `fr`, anglais sinon. La resolution est faite a l'arrivee de `hass`
   et retenue dans `currentLang` : toutes les cartes d'une meme installation
   partagent la langue du frontend, il n'y a donc rien a porter par instance, et
   `setConfig` peut ainsi traduire ses messages d'erreur meme quand il est appele
   avant le premier `hass`.

   `{nom}` marque une valeur inseree a l'execution : la garder telle quelle. */

const FR = {
  col_route: "Trajet",
  col_departure: "Départ",
  col_arrival: "Arrivée",
  col_duration: "Durée",
  col_physical_mode: "Mode",
  col_status: "Statut",
  col_line: "Ligne",
  col_direction: "Direction",
  col_from: "De",
  col_to: "Vers",
  col_disruption: "Perturbation",

  no_route: "Aucun trajet : vérifie l'intégration Train Traveler.",
  no_wanted_route: "Aucun des trajets demandés n'est remonté par l'intégration.",
  no_journey: "Plus aucun départ à venir.",
  sort_by: "Trier par {label}",
  sort_back_to: "Revenir au tri configuré : {label}",
  sort_manual_header: "Ordre personnalisé des trajets · cliquer pour trier par départ",
  sort_manual_label: "≡ Ordre personnalisé",
  sort_reset: "Revenir au tri défini dans la configuration",

  next_in: "Prochain départ {when}",
  next_none: "Aucun départ à venir",
  now: "maintenant",
  in_minutes: "dans {count} min",
  in_hours: "dans {hours} h {minutes}",
  in_days: "dans {count} j",
  ago_minutes: "il y a {count} min",
  departed: "parti",

  on_time: "à l'heure",
  delayed_by: "retard de {delay}",
  disrupted: "perturbé",

  err_empty: "Configuration vide",
  err_columns: "`columns` doit être une liste",
  err_entities: "`entities` doit être une liste d'entity_id",
  err_route_names: "`route_names` doit être une table `entity_id: nom`",
  err_max_journeys: "`max_journeys` doit être un entier entre 0 et 100",
  err_thresholds: "`duration_green` doit être inférieur à `duration_red`",

  card_name: "Train Traveler",
  card_description: "Tableau des prochains trains : horaires, durée, mode et retards.",
  stub_title: "Prochains trains",
  suggest_table: "Prochains trains — {route}",
  suggest_compact: "Prochains trains, vue compacte",

  ed_title: "Titre",
  ed_show_title: "Afficher le titre",
  ed_show_countdown: "Compte à rebours du prochain départ",
  ed_sort: "Tri par défaut",
  ed_sort_desc: "Tri décroissant",
  ed_sortable: "En-têtes cliquables pour trier",
  ed_max_journeys: "Nombre de trains affichés",
  ed_hide_past: "Masquer les trains déjà partis",
  ed_time_format: "Format des horaires",
  ed_compact_mode: "Mode de transport compact",
  ed_more_info: "Clic sur une ligne = fiche de l'entité",
  ed_duration_colors: "Colorer la durée du trajet",
  ed_duration_green: "Durée verte jusqu'à (min)",
  ed_duration_red: "Durée rouge à partir de (min)",
  ed_delay_warn: "Retard orange à partir de (s)",
  ed_delay_alert: "Retard rouge à partir de (s)",
  ed_color_ok: "Couleur « à l'heure »",
  ed_color_warn: "Couleur retard modéré",
  ed_color_alert: "Couleur retard important",

  help_sort:
    "« ≡ Ordre personnalisé » reprend l'ordre de la section Trajets, les autres trient sur une donnée.",
  help_sortable:
    "Sans effet sur le tri de départ : la carte propose toujours un retour à celui-ci.",
  help_max_journeys: "0 pour afficher tous les trains remontés par l'intégration.",
  help_hide_past: "Un train dont l'heure de départ est passée quitte le tableau tout seul.",
  help_time_format:
    "« Automatique » n'affiche la date que lorsqu'elle change : heure seule pour aujourd'hui.",
  help_compact_mode: "« TER / Intercités » devient « TER/Intercités ».",
  help_more_info: "Ouvre la fiche du sensor du trajet.",
  help_duration_colors: "Dégradé vert → rouge entre les deux seuils ci-dessous.",

  opt_route: "Trajet",
  opt_departure: "Heure de départ",
  opt_arrival: "Heure d'arrivée",
  opt_duration: "Durée",
  opt_physical_mode: "Mode de transport",
  opt_status: "Retard",
  opt_line: "Ligne",
  opt_direction: "Direction",
  opt_from: "Gare de départ",
  opt_to: "Gare d'arrivée",
  opt_disruption: "Perturbation",
  opt_manual: "≡ Ordre personnalisé des trajets",

  opt_time_auto: "Automatique",
  opt_time_time: "Heure seule",
  opt_time_datetime: "Date et heure",

  sec_routes: "Trajets",
  sec_routes_hint:
    "Cocher les trajets à afficher, ▲ / ▼ pour les ordonner. Tant que rien n'est touché ici, la carte suit tous les trajets de l'intégration, futurs compris ; la première modification fige la liste.",
  order_unused: "Tri du tableau : {sort}. Cet ordre ne l'atteint qu'avec « {manual} ».",
  order_use: "Suivre cet ordre",
  order_now: "Le tableau suit maintenant votre ordre.",
  order_back: "Revenir à {sort}",

  sec_sort: "Tri",
  sec_sort_hint:
    "Ordre de départ du tableau. « ≡ Ordre personnalisé » reprend celui de la section Trajets ; les autres trient sur une donnée. Un clic sur un en-tête trie à la volée sans rien écrire ici, et la carte propose alors un retour à ce réglage.",
  sec_columns: "Colonnes",
  sec_columns_hint:
    "Interrupteur pour afficher ou masquer, ▲ / ▼ pour ordonner. Les colonnes affichées sont regroupées en tête de liste, dans leur ordre d'affichage.",
  sec_display: "Affichage",
  sec_colors: "Couleurs et seuils",
  sec_colors_hint:
    "Les seuils de retard sont en secondes, ceux de durée en minutes. Les couleurs acceptent toute valeur CSS.",
  sec_names: "Noms des trajets",
  sec_names_hint: "Laisser vide pour garder le nom de l'entité.",

  hidden: "Masqués",
  show_column: "Afficher la colonne {label}",
  hide_column: "Masquer la colonne {label}",
  show_route: "Afficher {label}",
  hide_route: "Masquer {label}",
  move_up: "Monter {label}",
  move_down: "Descendre {label}",
  lock_column: "Au moins une colonne doit rester affichée",
  lock_route: "Au moins un trajet doit rester coché",

  ed_no_route: "Aucun trajet remonté par l'intégration.",
  ed_route: "Trajet",
  ed_col_name: "Nom affiché",
  ed_journeys: "{count} train",
  ed_journeys_plural: "{count} trains",

  sum_no_route: "aucun trajet détecté",
  sum_some: "{count} sur {total}",
  sum_all: "tous ({count})",
  sum_not_sortable: " · en-têtes non cliquables",
  sum_no_title: "sans titre",
  sum_all_journeys: "tous les trains",
  sum_max_journeys: "{count} trains max",
  sum_no_override: "aucune surcharge",
  sum_override: "{count} surcharge",
  sum_overrides: "{count} surcharges",
  sum_colors_off: "durée non colorée",
  sum_colors_on: "vert < {green} min · rouge > {red} min"
};

const EN = {
  col_route: "Route",
  col_departure: "Departure",
  col_arrival: "Arrival",
  col_duration: "Duration",
  col_physical_mode: "Mode",
  col_status: "Status",
  col_line: "Line",
  col_direction: "Direction",
  col_from: "From",
  col_to: "To",
  col_disruption: "Disruption",

  no_route: "No route: check the Train Traveler integration.",
  no_wanted_route: "None of the requested routes is reported by the integration.",
  no_journey: "No upcoming departure left.",
  sort_by: "Sort by {label}",
  sort_back_to: "Back to the configured sort: {label}",
  sort_manual_header: "Custom route order · click to sort by departure",
  sort_manual_label: "≡ Custom order",
  sort_reset: "Back to the sort defined in the configuration",

  next_in: "Next departure {when}",
  next_none: "No upcoming departure",
  now: "now",
  in_minutes: "in {count} min",
  in_hours: "in {hours} h {minutes}",
  in_days: "in {count} d",
  ago_minutes: "{count} min ago",
  departed: "departed",

  on_time: "on time",
  delayed_by: "{delay} late",
  disrupted: "disrupted",

  err_empty: "Empty configuration",
  err_columns: "`columns` must be a list",
  err_entities: "`entities` must be a list of entity ids",
  err_route_names: "`route_names` must be an `entity_id: name` table",
  err_max_journeys: "`max_journeys` must be an integer between 0 and 100",
  err_thresholds: "`duration_green` must be lower than `duration_red`",

  card_name: "Train Traveler",
  card_description: "Next trains table: times, duration, mode and delays.",
  stub_title: "Next trains",
  suggest_table: "Next trains — {route}",
  suggest_compact: "Next trains, compact view",

  ed_title: "Title",
  ed_show_title: "Show the title",
  ed_show_countdown: "Countdown to the next departure",
  ed_sort: "Default sort",
  ed_sort_desc: "Descending",
  ed_sortable: "Clickable headers for sorting",
  ed_max_journeys: "Number of trains shown",
  ed_hide_past: "Hide trains that already left",
  ed_time_format: "Time format",
  ed_compact_mode: "Compact transport mode",
  ed_more_info: "Clicking a row opens the entity dialog",
  ed_duration_colors: "Colour the journey duration",
  ed_duration_green: "Green duration up to (min)",
  ed_duration_red: "Red duration from (min)",
  ed_delay_warn: "Orange delay from (s)",
  ed_delay_alert: "Red delay from (s)",
  ed_color_ok: "“On time” colour",
  ed_color_warn: "Moderate delay colour",
  ed_color_alert: "Heavy delay colour",

  help_sort: "“≡ Custom order” follows the Routes section; the others sort on a value.",
  help_sortable:
    "Does not affect the starting sort: the card always offers a way back to it.",
  help_max_journeys: "0 shows every train reported by the integration.",
  help_hide_past: "A train whose departure time has passed leaves the table on its own.",
  help_time_format: "“Automatic” shows the date only when it changes: time only for today.",
  help_compact_mode: "“TER / Intercités” becomes “TER/Intercités”.",
  help_more_info: "Opens the dialog of the route sensor.",
  help_duration_colors: "Green → red gradient between the two thresholds below.",

  opt_route: "Route",
  opt_departure: "Departure time",
  opt_arrival: "Arrival time",
  opt_duration: "Duration",
  opt_physical_mode: "Transport mode",
  opt_status: "Delay",
  opt_line: "Line",
  opt_direction: "Direction",
  opt_from: "Departure station",
  opt_to: "Arrival station",
  opt_disruption: "Disruption",
  opt_manual: "≡ Custom route order",

  opt_time_auto: "Automatic",
  opt_time_time: "Time only",
  opt_time_datetime: "Date and time",

  sec_routes: "Routes",
  sec_routes_hint:
    "Tick the routes to show, ▲ / ▼ to order them. As long as nothing is changed here, the card follows every route of the integration, future ones included; the first change freezes the list.",
  order_unused: "Table sorted by: {sort}. This order only reaches it with “{manual}”.",
  order_use: "Follow this order",
  order_now: "The table now follows your order.",
  order_back: "Back to {sort}",

  sec_sort: "Sorting",
  sec_sort_hint:
    "Starting order of the table. “≡ Custom order” follows the Routes section; the others sort on a value. Clicking a header sorts on the fly without writing anything here, and the card then offers a way back to this setting.",
  sec_columns: "Columns",
  sec_columns_hint:
    "Switch to show or hide, ▲ / ▼ to order. Shown columns are grouped at the top of the list, in display order.",
  sec_display: "Display",
  sec_colors: "Colours and thresholds",
  sec_colors_hint:
    "Delay thresholds are in seconds, duration ones in minutes. Colours accept any CSS value.",
  sec_names: "Route names",
  sec_names_hint: "Leave empty to keep the entity name.",

  hidden: "Hidden",
  show_column: "Show the {label} column",
  hide_column: "Hide the {label} column",
  show_route: "Show {label}",
  hide_route: "Hide {label}",
  move_up: "Move {label} up",
  move_down: "Move {label} down",
  lock_column: "At least one column must stay visible",
  lock_route: "At least one route must stay ticked",

  ed_no_route: "No route reported by the integration.",
  ed_route: "Route",
  ed_col_name: "Displayed name",
  ed_journeys: "{count} train",
  ed_journeys_plural: "{count} trains",

  sum_no_route: "no route detected",
  sum_some: "{count} of {total}",
  sum_all: "all ({count})",
  sum_not_sortable: " · headers not clickable",
  sum_no_title: "no title",
  sum_all_journeys: "every train",
  sum_max_journeys: "{count} trains max",
  sum_no_override: "no override",
  sum_override: "{count} override",
  sum_overrides: "{count} overrides",
  sum_colors_off: "duration not coloured",
  sum_colors_on: "green < {green} min · red > {red} min"
};

const STRINGS = { fr: FR, en: EN };

let currentLang = "en";

/* Le frontend expose la langue dans `locale.language` ; `language` est la forme
   ancienne, gardee en secours. */
const setLanguageFrom = function (hass) {
  const raw =
    (hass && hass.locale && hass.locale.language) || (hass && hass.language) || "";
  currentLang = String(raw).toLowerCase().indexOf("fr") === 0 ? "fr" : "en";
};

const t = function (key, vars) {
  let text = STRINGS[currentLang][key];
  if (text === undefined) text = STRINGS.en[key];
  if (text === undefined) return key;
  if (vars) {
    Object.keys(vars).forEach(function (name) {
      text = text.split("{" + name + "}").join(vars[name]);
    });
  }
  return text;
};

const localeTag = function () {
  return currentLang === "fr" ? "fr-FR" : "en-GB";
};

/* Colonnes disponibles : geometrie seule, les etiquettes sont dans `STRINGS`.
   Contrairement a une carte de prix, la liste est fermee : l'integration expose
   un jeu de clefs fixe par trajet, il n'y a rien a decouvrir a l'execution. */
const META = {
  route: { align: "left", width: "18%" },
  departure: { align: "center", width: "15%" },
  arrival: { align: "center", width: "15%" },
  duration: { align: "center", width: "12%" },
  physical_mode: { align: "center" },
  status: { align: "center", width: "12%" },
  line: { align: "center", width: "10%" },
  direction: { align: "left" },
  from: { align: "left" },
  to: { align: "left" },
  disruption: { align: "left" }
};

const COLUMN_KEYS = Object.keys(META);

const DEFAULT_COLUMNS = ["departure", "arrival", "duration", "physical_mode", "status", "line"];

/* Colonnes sur lesquelles un tri a un sens. `disruption` en est exclue : trier
   des phrases libres ne renseigne sur rien. */
const SORT_KEYS = [
  "manual",
  "departure",
  "arrival",
  "duration",
  "status",
  "line",
  "physical_mode",
  "direction",
  "route"
];

const DEFAULTS = {
  title: null,
  show_title: true,
  show_countdown: true,
  entities: [],
  route_names: {},
  columns: null,
  sort: "departure",
  sort_desc: false,
  sortable: true,
  max_journeys: 0,
  hide_past: true,
  time_format: "auto",
  compact_mode: true,
  more_info: true,
  duration_colors: true,
  duration_green: 60,
  duration_red: 120,
  delay_warn: 60,
  delay_alert: 3600,
  color_ok: "#139523",
  color_warn: "#ffa500",
  color_alert: "#e70b0b",
  background: null
};

const STYLE = [
  ":host { display: block; }",
  "ha-card { overflow: hidden; }",
  ".wrap { padding: 8px 12px 12px; overflow-x: auto; }",
  ".countdown { padding: 0 2px 6px; color: var(--secondary-text-color);",
  "  font-size: 0.9em; }",
  "table { width: 100%; border-collapse: collapse; font-size: var(--train-traveler-font-size, 14px); }",
  "th { padding: 4px 6px; white-space: nowrap; font-weight: 600;",
  "     color: var(--secondary-text-color); border-bottom: 1px solid var(--divider-color); }",
  "th.sortable { cursor: pointer; user-select: none; }",
  "th.sortable:hover { color: var(--primary-text-color); }",
  "th.sorted { color: var(--primary-color); }",
  "th .caret { font-size: 0.75em; margin-left: 2px; }",
  "td { padding: 4px 6px; white-space: nowrap; font-variant-numeric: tabular-nums; }",
  /* Lignes alternees : gris neutre, lisible sur theme clair comme sombre. */
  "tbody tr:nth-child(even) td { background: var(--train-traveler-stripe, rgba(127,127,127,0.12)); }",
  "tbody tr:hover td { background: var(--train-traveler-hover, rgba(127,127,127,0.22)); }",
  "tbody tr.clickable { cursor: pointer; }",
  /* Un train deja parti reste lisible mais s'efface : il n'est la que parce que
     `hide_past` a ete mis a `false`, ce n'est plus une option de voyage. */
  "tbody tr.past td { opacity: 0.45; }",
  "td.col-route, td.col-direction, td.col-from, td.col-to, td.col-disruption {",
  "  white-space: normal; overflow-wrap: break-word; }",
  "td.col-disruption { font-size: 0.9em; }",
  ".strong { font-weight: 700; }",
  ".date { color: var(--secondary-text-color); font-size: 0.85em; }",
  ".left { text-align: left; }",
  ".center { text-align: center; }",
  ".right { text-align: right; }",
  ".empty { padding: 16px; color: var(--secondary-text-color); }",
  /* Barre de retour au tri configure : absente tant qu'aucun clic n'a eu lieu,
     elle ne coute donc rien en hauteur dans le cas courant. */
  ".resetbar { display: flex; justify-content: flex-end; padding: 0 2px 4px; }",
  "button.reset { display: inline-flex; align-items: center; gap: 4px; cursor: pointer;",
  "  border: none; background: none; padding: 2px 4px; border-radius: 4px;",
  "  font: inherit; font-size: 0.85em; color: var(--secondary-text-color); }",
  "button.reset:hover { color: var(--primary-color); background: rgba(127,127,127,0.12); }",
  "button.reset:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }",
  "@media (max-width: 600px) {",
  "  table { font-size: 12px; }",
  "  th, td { padding: 3px 4px; }",
  "}"
].join("\n");

const fireEvent = function (node, type, detail) {
  const ev = new CustomEvent(type, {
    detail: detail || {},
    bubbles: true,
    composed: true,
    cancelable: false
  });
  node.dispatchEvent(ev);
  return ev;
};

const toNumber = function (value, fallback) {
  const n = parseFloat(value);
  return isFinite(n) ? n : fallback;
};

const isPlainObject = function (value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

/* L'entree est posee par `defineProperty` et non par affectation : une clef
   `__proto__` devient ainsi une entree ordinaire au lieu de changer le
   prototype de la table.

   La table garde en revanche `Object.prototype`. Un objet sans prototype serait
   plus sur encore, mais la configuration ne nous appartient pas : Home Assistant
   la fige en profondeur avec `deep-freeze`, qui appelle `o.hasOwnProperty(...)`
   sur chaque valeur et leve `hasOwnProperty is not a function` sur un objet sans
   prototype. Le dialogue d'edition abandonne alors avant d'appliquer la config,
   et toute modification faite a la souris revient en arriere. Les lectures
   passent donc par `tableValue`, qui rend le meme service. */
const stringKeys = function (table) {
  const out = {};
  Object.keys(table).forEach(function (key) {
    Object.defineProperty(out, String(key), {
      value: table[key],
      writable: true,
      enumerable: true,
      configurable: true
    });
  });
  return out;
};

/* Lecture d'une table de surcharges. Sans ce filtre, une clef comme
   `constructor` ou `toString` remonterait une fonction heritee d'`Object` en
   guise de nom de trajet. */
const tableValue = function (table, key) {
  if (!table) return undefined;
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
};

/* Nombre d'entites de l'installation. Volontairement sans `Object.keys`, qui
   allouerait un tableau de plusieurs milliers de chaines a chaque appel : on ne
   veut qu'un compteur, pour reperer une entite apparue ou disparue. */
const statesCount = function (hass) {
  let count = 0;
  if (!hass || !hass.states) return count;
  for (const id in hass.states) count++;
  return count;
};

/* Home Assistant remplace l'objet `hass` a chaque changement d'etat de la
   maison, mais ne remplace l'objet d'etat que de l'entite concernee : une
   comparaison d'identite sur les seuls sensors de l'integration suffit donc a
   savoir s'il y a lieu de retravailler. Sans cette garde, allumer une lampe
   ferait reparcourir toutes les entites pour, neuf fois sur dix, ne rien
   trouver. Le compteur rattrape les apparitions et disparitions d'entites, que
   la comparaison d'identite ne verrait pas. */
const readingsUnchanged = function (previous, next, watched, count) {
  if (!previous || !next || !previous.states || !next.states || !watched) return false;
  if (statesCount(next) !== count) return false;
  for (let i = 0; i < watched.length; i++) {
    if (previous.states[watched[i]] !== next.states[watched[i]]) return false;
  }
  return true;
};

/* Un trajet de l'integration est un objet portant au moins une heure de depart.
   C'est le seul critere : tout le reste (ligne, direction, retard) peut manquer
   selon le reseau interroge, et une entite dont l'attribut `journeys` ressemble
   a autre chose ne doit pas etre confondue avec un trajet. */
const looksLikeJourney = function (value) {
  return isPlainObject(value) && value.departure_time !== undefined;
};

const parseTime = function (value) {
  if (value === undefined || value === null || value === "") return null;
  const stamp = Date.parse(value);
  return isFinite(stamp) ? stamp : null;
};

const sameDay = function (a, b) {
  if (a === null || b === null) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

/* "TER / Intercités" -> "TER/Intercités" : le mode de transport voyage dans une
   colonne etroite, les espaces autour de la barre y coutent une largeur qu'ils
   n'apportent pas. */
const compactMode = function (mode) {
  return String(mode).replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim();
};

/* "1h05", "35 min" : la duree d'un trajet se lit en heures et minutes, jamais en
   secondes, et une heure ronde ne merite pas un "0 min" de plus.

   Les secondes sont tronquees et non arrondies. Un arrondi ferait afficher "1h00"
   a 59 min 59 s, alors que les seuils de couleur, eux, comparent les secondes
   brutes : le texte annoncerait une heure la ou la couleur dirait le contraire.
   Tronquer garde les deux d'accord, et c'est de toute facon la lecture attendue
   d'une duree ecoulee. */
const formatDuration = function (seconds) {
  const total = Math.max(0, Math.floor(toNumber(seconds, 0) / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return minutes + " min";
  return hours + "h" + (minutes < 10 ? "0" + minutes : minutes);
};

/* Meme decoupage que `formatDuration`, en plus court : un retard s'affiche a
   cote d'un signe "+", dans une colonne deja etroite. */
const formatDelay = function (seconds) {
  const total = Math.max(0, Math.floor(toNumber(seconds, 0) / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return total + "m";
  return hours + "h" + (minutes < 10 ? "0" + minutes : minutes);
};

/* Distance dans le temps, en clair. La minute est l'unite utile : sous une
   minute, un depart est "maintenant" et non "dans 34 s". */
const relativeTime = function (stamp, now) {
  const diff = Math.round((stamp - now) / 1000);
  if (diff < 0) {
    const past = Math.round(-diff / 60);
    return past < 1 ? t("now") : t("ago_minutes", { count: past });
  }
  const minutes = Math.round(diff / 60);
  if (minutes < 1) return t("now");
  if (minutes < 60) return t("in_minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return t("in_hours", { hours: hours, minutes: rest < 10 ? "0" + rest : rest });
  }
  return t("in_days", { count: Math.round(hours / 24) });
};

/* Cle de colonne : accepte la forme courte ("departure") comme la forme longue
   ({ key: "departure", name: "Train" }). */
const columnKeyOf = function (entry) {
  if (typeof entry === "string") return entry;
  if (!isPlainObject(entry)) return "";
  return entry.key || entry.column || "";
};

/* Etiquette d'une colonne. Une clef inconnue — faute de frappe dans `columns`,
   colonne d'une version ulterieure — est rendue telle quelle : `t` renvoyant sa
   propre clef quand la traduction manque, un simple `||` afficherait
   `col_quelquechose` en en-tete au lieu de l'identifiant ecrit en configuration,
   qui est le seul indice utile pour retrouver la faute. */
const columnLabelOf = function (key) {
  if (!META[key]) return key;
  return t("col_" + key);
};

class TrainTravelerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._signature = "";
    this._rowCount = 0;
    /* Tri demande a la volee par un clic sur un en-tete. Null = celui de la
       configuration. Remis a zero a chaque setConfig. */
    this._sortKey = null;
    this._sortDesc = null;
    /* Sensors de l'integration reperes au dernier passage, et nombre total
       d'entites : de quoi ecarter sans travail les `hass` sans rapport. */
    this._watched = null;
    this._stateCount = 0;
    /* Noeuds conserves entre deux rendus. */
    this._styleNode = null;
    this._cardNode = null;
    this._countdownNode = null;
    this._timer = null;
  }

  /* ---------- decouverte des donnees de l'integration ---------- */

  /* Un "trajet" (route) = une entite portant une liste `journeys`, soit un
     couple origine / destination suivi par l'integration.

     Le resultat est memoise sur l'identite de l'objet `hass` : la carte et
     l'editeur appellent cette methode plusieurs fois par passe (colonnes,
     trajets, resumes...), et rien ne justifie de reparcourir a chaque fois les
     memes milliers d'entites. Le tableau rendu est partage, les appelants ne
     doivent donc pas le modifier. */
  static routes(hass) {
    if (hass && hass === TrainTravelerCard._routesHass) {
      return TrainTravelerCard._routesValue;
    }
    const out = [];
    if (!hass || !hass.states) {
      TrainTravelerCard._routesHass = hass;
      TrainTravelerCard._routesValue = out;
      return out;
    }
    const states = hass.states;
    for (const id in states) {
      if (!Object.prototype.hasOwnProperty.call(states, id)) continue;
      if (id.slice(0, 7) !== "sensor.") continue;
      const attrs = states[id].attributes;
      if (!attrs || !Array.isArray(attrs.journeys) || !attrs.journeys.length) continue;
      if (!looksLikeJourney(attrs.journeys[0])) continue;
      const first = attrs.journeys[0];
      out.push({
        id: id,
        name: attrs.friendly_name ? String(attrs.friendly_name) : id,
        from: first.departure ? String(first.departure) : "",
        to: first.arrival ? String(first.arrival) : "",
        count: attrs.journeys.length,
        journeys: attrs.journeys
      });
    }
    out.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    TrainTravelerCard._routesHass = hass;
    TrainTravelerCard._routesValue = out;
    return out;
  }

  /* ---------- interface carte Lovelace ---------- */

  static getConfigElement() {
    return document.createElement("train-traveler-card-editor");
  }

  static getStubConfig(hass) {
    const routes = TrainTravelerCard.routes(hass);
    return {
      title: t("stub_title"),
      entities: routes.length ? [routes[0].id] : [],
      columns: DEFAULT_COLUMNS.slice()
    };
  }

  setConfig(config) {
    if (!config) throw new Error(t("err_empty"));
    const cfg = Object.assign({}, DEFAULTS, config);

    /* `entity` au singulier : forme courante d'une carte a une seule entite, et
       ce que produit le selecteur "par entite" de Home Assistant. */
    if (cfg.entity && !config.entities) cfg.entities = [cfg.entity];
    delete cfg.entity;

    if (cfg.columns !== null && !Array.isArray(cfg.columns)) {
      throw new Error(t("err_columns"));
    }
    if (!Array.isArray(cfg.entities)) {
      throw new Error(t("err_entities"));
    }
    if (!isPlainObject(cfg.route_names)) {
      throw new Error(t("err_route_names"));
    }
    const max = Math.round(toNumber(cfg.max_journeys, DEFAULTS.max_journeys));
    if (!isFinite(max) || max < 0 || max > 100) {
      throw new Error(t("err_max_journeys"));
    }
    cfg.max_journeys = max;

    cfg.duration_green = Math.max(0, toNumber(cfg.duration_green, DEFAULTS.duration_green));
    cfg.duration_red = Math.max(0, toNumber(cfg.duration_red, DEFAULTS.duration_red));
    /* Seuils croises : le degrade se calcule sur leur ecart, une division par
       zero ou negative rendrait la couleur arbitraire plutot que fausse — mieux
       vaut le dire que peindre n'importe quoi. */
    if (cfg.duration_colors && cfg.duration_green >= cfg.duration_red) {
      throw new Error(t("err_thresholds"));
    }
    cfg.delay_warn = Math.max(0, toNumber(cfg.delay_warn, DEFAULTS.delay_warn));
    cfg.delay_alert = Math.max(cfg.delay_warn, toNumber(cfg.delay_alert, DEFAULTS.delay_alert));

    if (["auto", "time", "datetime"].indexOf(cfg.time_format) === -1) {
      cfg.time_format = DEFAULTS.time_format;
    }
    if (!cfg.columns || cfg.columns.length === 0) cfg.columns = DEFAULT_COLUMNS.slice();
    cfg.entities = cfg.entities.map(String);
    cfg.route_names = stringKeys(cfg.route_names);

    this._config = cfg;
    this._sortKey = null;
    this._sortDesc = null;
    this._signature = "";
    this._watched = null;
    this._update();
  }

  set hass(hass) {
    const previous = this._hass;
    const before = currentLang;
    this._hass = hass;
    setLanguageFrom(hass);
    /* Rien de l'integration n'a bouge : ni recalcul, ni rendu. Un changement de
       langue du frontend force en revanche un nouveau rendu, tous les libelles
       en dependant. */
    if (before === currentLang && readingsUnchanged(previous, hass, this._watched, this._stateCount)) {
      return;
    }
    if (before !== currentLang) this._signature = "";
    this._update();
  }

  get hass() {
    return this._hass;
  }

  /* Le tableau vieillit tout seul : un train part, un compte a rebours descend.
     L'integration, elle, ne se rafraichit que toutes les douze minutes par
     defaut. Un reveil regulier est donc le seul moyen d'afficher l'heure qu'il
     est vraiment, et il ne vit que tant que la carte est a l'ecran. */
  connectedCallback() {
    if (this._timer) return;
    const self = this;
    this._timer = window.setInterval(function () {
      self._tick();
    }, 30000);
  }

  disconnectedCallback() {
    if (!this._timer) return;
    window.clearInterval(this._timer);
    this._timer = null;
  }

  _tick() {
    if (!this._config || !this._hass) return;
    /* Le compte a rebours change presque a chaque reveil, le tableau presque
       jamais : on met le premier a jour sur place, et on laisse la signature
       decider pour le second. */
    this._refreshCountdown();
    this._update();
  }

  getCardSize() {
    return 1 + Math.max(1, this._rowCount);
  }

  /* Vue "sections" : pleine largeur par defaut, un tableau a six colonnes n'a
     rien a faire dans une demi-colonne. */
  getGridOptions() {
    return { columns: "full", min_columns: 6, min_rows: 3 };
  }

  /* ---------- construction des lignes ---------- */

  _columns() {
    return this._config.columns.map(function (entry) {
      const spec = typeof entry === "string" ? { key: entry } : Object.assign({}, entry);
      const key = columnKeyOf(entry);
      const meta = META[key];
      return {
        key: key,
        label: spec.name !== undefined ? spec.name : columnLabelOf(key),
        align: spec.align || (meta && meta.align) || "center",
        width: spec.width || (meta && meta.width) || null,
        sortable: spec.sortable !== undefined ? !!spec.sortable : SORT_KEYS.indexOf(key) !== -1
      };
    });
  }

  /* Nom affiche d'un trajet : surcharge de la configuration, sinon nom de
     l'entite. */
  _routeName(route) {
    const custom = tableValue(this._config.route_names, route.id);
    if (custom !== undefined && custom !== null && String(custom) !== "") return String(custom);
    return route.name;
  }

  /* Vrai des que le tableau ne suit plus le tri de la configuration. Le sens seul
     peut avoir ete change : quand le tri configure porte deja sur la colonne
     cliquee, `_toggleSort` ne touche qu'a `_sortDesc` et laisse `_sortKey` a
     null. Tester la seule clef laissait alors la carte dans un tri qui n'est pas
     celui demande, sans le bouton de retour pour le dire. */
  _sortOverridden() {
    return this._sortKey !== null || this._sortDesc !== null;
  }

  /* Tri courant : clic sur un en-tete s'il y en a eu un, sinon configuration. */
  _activeSort() {
    const cfg = this._config;
    return {
      key: this._sortKey !== null ? this._sortKey : cfg.sort,
      desc: this._sortDesc !== null ? this._sortDesc : !!cfg.sort_desc
    };
  }

  /* Valeur comparable d'une ligne pour une colonne. `null` = valeur absente,
     toujours renvoyee en fin de tableau quel que soit le sens du tri. */
  _sortValue(row, key) {
    switch (key) {
      case "departure":
        return row.departure;
      case "arrival":
        return row.arrival;
      case "duration":
        return row.duration;
      case "status":
        return row.delay === null ? 0 : row.delay;
      case "route":
        return row.routeName;
      case "line":
        return row.line || null;
      case "physical_mode":
        return row.mode || null;
      case "direction":
        return row.direction || null;
      case "from":
        return row.from || null;
      case "to":
        return row.to || null;
      default:
        return null;
    }
  }

  _sortRows(rows) {
    const cfg = this._config;
    const active = this._activeSort();
    const dir = active.desc ? -1 : 1;
    const self = this;

    /* "manual" : l'ordre est celui de la liste `entities` de la configuration,
       les trains d'un meme trajet restant classes par heure de depart. Le rang
       est indexe une fois pour toutes : chercher dans la liste depuis le
       comparateur multiplierait le cout du tri par sa longueur. */
    if (active.key === "manual") {
      const order = new Map();
      cfg.entities.forEach(function (id, index) {
        if (!order.has(id)) order.set(id, index);
      });
      rows.sort(function (a, b) {
        const ai = order.has(a.route) ? order.get(a.route) : -1;
        const bi = order.has(b.route) ? order.get(b.route) : -1;
        if (ai !== bi) {
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return dir * (ai - bi);
        }
        return self._compareDeparture(a, b);
      });
      return rows;
    }

    rows.sort(function (a, b) {
      const av = self._sortValue(a, active.key);
      const bv = self._sortValue(b, active.key);
      const aEmpty = av === null || av === undefined;
      const bEmpty = bv === null || bv === undefined;
      if (aEmpty || bEmpty) {
        if (aEmpty && bEmpty) return self._compareDeparture(a, b);
        return aEmpty ? 1 : -1;
      }
      let cmp;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), currentLang);
      if (cmp !== 0) return dir * cmp;
      return self._compareDeparture(a, b);
    });
    return rows;
  }

  /* Depart de la rame : le seul departage qui ait un sens entre deux trains
     autrement identiques, et le seul qui ne depende pas du tri en cours. */
  _compareDeparture(a, b) {
    if (a.departure !== null && b.departure !== null && a.departure !== b.departure) {
      return a.departure - b.departure;
    }
    return a.index - b.index;
  }

  /* Trajets retenus : liste `entities` de la configuration, ou tous ceux que
     l'integration remonte quand elle est vide. */
  _wantedRoutes() {
    const wanted = this._config.entities;
    const routes = TrainTravelerCard.routes(this._hass);
    if (!wanted.length) return routes;
    const byId = new Map();
    routes.forEach(function (route) {
      byId.set(route.id, route);
    });
    const out = [];
    wanted.forEach(function (id) {
      const route = byId.get(id);
      if (route && out.indexOf(route) === -1) out.push(route);
    });
    return out;
  }

  _rows() {
    const cfg = this._config;
    const self = this;
    const now = Date.now();
    const rows = [];

    this._wantedRoutes().forEach(function (route) {
      const routeName = self._routeName(route);
      route.journeys.forEach(function (journey, index) {
        if (!looksLikeJourney(journey)) return;
        const departure = parseTime(journey.departure_time);
        const arrival = parseTime(journey.arrival_time);
        /* Un depart passe n'est pas une erreur : l'integration garde les trains
           du jour, et certains voudront les voir. `hide_past` tranche. */
        const past = departure !== null && departure < now;
        if (past && cfg.hide_past) return;
        const disruptions = Array.isArray(journey.disruptions) ? journey.disruptions : [];
        rows.push({
          key: route.id + "#" + index,
          route: route.id,
          routeName: routeName,
          index: index,
          line: journey.line ? String(journey.line) : "",
          direction: journey.direction ? String(journey.direction) : "",
          mode: journey.physical_mode ? String(journey.physical_mode) : "",
          from: journey.departure ? String(journey.departure) : "",
          to: journey.arrival ? String(journey.arrival) : "",
          departure: departure,
          arrival: arrival,
          duration: toNumber(journey.duration, null),
          delay: toNumber(journey.delay, null),
          disruptions: disruptions,
          past: past
        });
      });
    });

    this._sortRows(rows);
    /* La coupe est faite apres le tri : "les trois prochains" et "les trois plus
       rapides" ne designent pas les memes trains, et c'est le tri qui dit
       lequel des deux est demande. */
    if (cfg.max_journeys > 0 && rows.length > cfg.max_journeys) {
      rows.length = cfg.max_journeys;
    }
    return rows;
  }

  /* Prochain depart, quel que soit le tri affiche : le compte a rebours parle du
     temps qui passe, pas de l'ordre des colonnes. Les lignes ecartees par
     `max_journeys` en font partie — masquer un train ne le retarde pas. */
  _nextDeparture(rows) {
    const now = Date.now();
    let best = null;
    rows.forEach(function (row) {
      if (row.departure === null || row.departure < now) return;
      if (best === null || row.departure < best) best = row.departure;
    });
    return best;
  }

  /* ---------- rendu ---------- */

  _update() {
    if (!this._config || !this._hass) return;
    /* Sensors a surveiller au prochain `set hass`, releves ici pendant que la
       liste est de toute facon parcourue. */
    this._watched = TrainTravelerCard.routes(this._hass).map(function (route) {
      return route.id;
    });
    this._stateCount = statesCount(this._hass);

    const rows = this._rows();
    const active = this._activeSort();
    const signature =
      active.key +
      "/" +
      active.desc +
      "#" +
      rows
        .map(function (r) {
          return [
            r.key,
            r.departure,
            r.arrival,
            r.duration,
            r.delay,
            r.line,
            r.mode,
            r.past ? "1" : "0",
            r.disruptions.length
          ].join("|");
        })
        .join(";");
    if (signature === this._signature) return;
    this._signature = signature;
    this._rowCount = rows.length;
    this._render(rows);
  }

  /* Une liste `entities` non vide fige un ordre voulu par l'utilisateur, que
     l'editeur laisse ranger avec les fleches. */
  _hasManualOrder() {
    return this._config.entities.length > 0;
  }

  /* Libelle du tri de la configuration, pour le bouton de retour. */
  _configuredSortLabel() {
    const cfg = this._config;
    if (cfg.sort === "manual") return t("sort_manual_label");
    return columnLabelOf(cfg.sort) + (cfg.sort_desc ? " ▼" : " ▲");
  }

  /* Clic sur un en-tete : colonne differente = tri ascendant, meme colonne =
     on inverse, puis un troisieme clic rend la main au tri configure.

     Ce troisieme etat existe parce que le tri de la configuration n'a pas
     toujours d'en-tete a cliquer : `manual` n'en a aucun par construction, et
     rien n'oblige a afficher la colonne sur laquelle `sort` porte. Sans lui,
     un clic malheureux enfermait la carte dans un tri jusqu'au rechargement de
     la page. Il est offert sur toutes les colonnes : c'est la seule facon de
     rester joignable quelles que soient les colonnes affichees. */
  _toggleSort(key) {
    const cfg = this._config;
    const active = this._activeSort();
    if (active.key !== key) {
      this._sortKey = key;
      this._sortDesc = false;
    } else if (!active.desc) {
      this._sortDesc = true;
    } else if (cfg.sort === key && !!cfg.sort_desc === true) {
      /* Le tri configure est deja l'etat descendant : il n'y a pas de troisieme
         etat a distinguer, on boucle simplement. */
      this._sortDesc = false;
    } else {
      /* Null et non une valeur : on rend le tri configure tel quel,
         `sort_desc` compris. */
      this._sortKey = null;
      this._sortDesc = null;
    }
    return this._resort();
  }

  _resort() {
    this._signature = "";
    this._update();
  }

  /* Texte du compte a rebours, mis a jour sur place par le reveil : reconstruire
     le tableau chaque demi-minute pour une ligne de texte serait payer cher une
     poignee de caracteres. */
  _refreshCountdown() {
    if (!this._countdownNode) return;
    const next = this._nextDeparture(this._rows());
    this._countdownNode.textContent =
      next === null
        ? t("next_none")
        : t("next_in", { when: relativeTime(next, Date.now()) }) +
          " · " +
          new Date(next).toLocaleTimeString(localeTag(), { hour: "2-digit", minute: "2-digit" });
  }

  _render(rows) {
    const cfg = this._config;
    const root = this.shadowRoot;

    /* La feuille de style ne depend pas des donnees : posee une seule fois, elle
       evite au navigateur de reparser tout le CSS a chaque rendu. Seule la carte
       est remplacee. */
    if (!this._styleNode) {
      this._styleNode = document.createElement("style");
      this._styleNode.textContent = STYLE;
      root.appendChild(this._styleNode);
    }
    if (this._cardNode) {
      root.removeChild(this._cardNode);
      this._cardNode = null;
    }
    this._countdownNode = null;

    const card = document.createElement("ha-card");
    /* `show_title: false` garde le titre en configuration mais masque l'en-tete. */
    if (cfg.show_title !== false && cfg.title) card.header = cfg.title;
    if (cfg.background) card.style.background = cfg.background;

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    card.appendChild(wrap);
    this._cardNode = card;
    root.appendChild(card);

    const self = this;

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      if (!TrainTravelerCard.routes(this._hass).length) empty.textContent = t("no_route");
      else if (!this._wantedRoutes().length) empty.textContent = t("no_wanted_route");
      else empty.textContent = t("no_journey");
      wrap.appendChild(empty);
      return;
    }

    if (cfg.show_countdown) {
      const line = document.createElement("div");
      line.className = "countdown";
      wrap.appendChild(line);
      this._countdownNode = line;
      this._refreshCountdown();
    }

    /* Retour au tri configure. Le troisieme clic sur un en-tete fait la meme
       chose, mais il se devine mal et suppose une colonne a portee : cette barre
       est le chemin visible, et elle ne depend d'aucune colonne. */
    if (this._sortOverridden()) {
      const bar = document.createElement("div");
      bar.className = "resetbar";
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "reset";
      reset.textContent = "↺ " + this._configuredSortLabel();
      reset.title = t("sort_reset");
      reset.setAttribute("aria-label", t("sort_reset"));
      reset.addEventListener("click", function () {
        self._sortKey = null;
        self._sortDesc = null;
        self._resort();
      });
      bar.appendChild(reset);
      wrap.appendChild(bar);
    }

    const columns = this._columns();
    const table = document.createElement("table");

    const colgroup = document.createElement("colgroup");
    columns.forEach(function (c) {
      const col = document.createElement("col");
      if (c.width) col.style.width = c.width;
      colgroup.appendChild(col);
    });
    table.appendChild(colgroup);

    const active = this._activeSort();
    const manualOrder = this._hasManualOrder();
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    columns.forEach(function (c) {
      const th = document.createElement("th");
      th.className = c.align;
      th.textContent = c.label;
      if (cfg.sortable && c.sortable && c.key) {
        th.classList.add("sortable");
        /* L'ordre manuel n'a pas d'en-tete a lui : quand la colonne des trajets
           est affichee, c'est elle qui le signale. */
        const showsManual = c.key === "route" && manualOrder && active.key === "manual";
        if (showsManual) {
          th.title = t("sort_manual_header");
        } else if (active.key === c.key && active.desc) {
          th.title = t("sort_back_to", { label: self._configuredSortLabel() });
        } else {
          th.title = t("sort_by", { label: c.label || c.key });
        }
        if (showsManual || active.key === c.key) {
          th.classList.add("sorted");
          const caret = document.createElement("span");
          caret.className = "caret";
          caret.textContent = showsManual ? "≡" : active.desc ? "▼" : "▲";
          th.appendChild(caret);
        }
        th.addEventListener("click", function () {
          self._toggleSort(c.key);
        });
      }
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      const tr = document.createElement("tr");
      if (row.past) tr.classList.add("past");
      columns.forEach(function (c) {
        tr.appendChild(self._cell(c, row));
      });
      if (cfg.more_info) {
        tr.classList.add("clickable");
        tr.addEventListener("click", function () {
          fireEvent(self, "hass-more-info", { entityId: row.route });
        });
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  /* Horaire d'une cellule. En mode automatique, la date n'apparait que lorsque
     le jour change : l'heure du prochain train se lit d'un coup d'oeil, celle de
     demain matin ne trompe personne. `reference` est le jour auquel comparer —
     aujourd'hui pour un depart, le depart lui-meme pour une arrivee, un train de
     nuit n'ayant pas a repeter la date de son depart. */
  _timeCell(td, stamp, reference) {
    if (stamp === null) {
      td.textContent = "-";
      return;
    }
    const cfg = this._config;
    const date = new Date(stamp);
    const time = date.toLocaleTimeString(localeTag(), { hour: "2-digit", minute: "2-digit" });
    const withDate =
      cfg.time_format === "datetime" ||
      (cfg.time_format === "auto" && !sameDay(stamp, reference));
    if (withDate) {
      const day = document.createElement("span");
      day.className = "date";
      /* Espace insecable dans le texte plutot qu'une marge CSS : la date et
         l'heure restent separees a la lecture comme a la copie, et la cellule ne
         se coupe jamais entre les deux. */
      day.textContent =
        date.toLocaleDateString(localeTag(), { day: "numeric", month: "short" }) + " ";
      td.appendChild(day);
    }
    td.appendChild(document.createTextNode(time));
  }

  /* Duree coloree : vert jusqu'au premier seuil, rouge au-dela du second, teinte
     intermediaire entre les deux. Un degre de teinte HSL suffit — la saturation
     et la luminosite restent fixes pour que toutes les durees se lisent avec le
     meme contraste, sur theme clair comme sombre. */
  _durationCell(td, row) {
    if (row.duration === null) {
      td.textContent = "-";
      return;
    }
    const cfg = this._config;
    const text = formatDuration(row.duration);
    if (!cfg.duration_colors) {
      td.textContent = text;
      return;
    }
    const minutes = row.duration / 60;
    const span = cfg.duration_red - cfg.duration_green;
    let ratio = span > 0 ? (minutes - cfg.duration_green) / span : 0;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;
    const node = document.createElement("span");
    node.className = "strong";
    node.style.color = "hsl(" + Math.round(120 * (1 - ratio)) + ", 80%, 45%)";
    node.textContent = text;
    td.appendChild(node);
  }

  /* Statut : le retard quand il y en a un, un tiret vert sinon. Une perturbation
     sans retard chiffre — greve, service reduit — n'est pas "a l'heure" pour
     autant : elle sort en orange, son message en infobulle. */
  _statusCell(td, row) {
    const cfg = this._config;
    const node = document.createElement("span");
    node.className = "strong";
    const delay = row.delay;
    if (delay !== null && delay >= cfg.delay_alert) {
      node.style.color = cfg.color_alert;
      node.textContent = "+" + formatDelay(delay);
      td.title = t("delayed_by", { delay: formatDelay(delay) });
    } else if (delay !== null && delay >= cfg.delay_warn) {
      node.style.color = cfg.color_warn;
      node.textContent = "+" + formatDelay(delay);
      td.title = t("delayed_by", { delay: formatDelay(delay) });
    } else if (row.disruptions.length) {
      node.style.color = cfg.color_warn;
      node.textContent = "⚠";
      td.title = this._disruptionText(row) || t("disrupted");
    } else {
      node.style.color = cfg.color_ok;
      node.textContent = "—";
      td.title = t("on_time");
    }
    td.appendChild(node);
  }

  /* Message de perturbation. L'integration en garde un par trajet, mais rien
     n'interdit d'en recevoir plusieurs : on les joint plutot que d'en taire. */
  _disruptionText(row) {
    const parts = [];
    row.disruptions.forEach(function (item) {
      if (!isPlainObject(item)) return;
      const message = item.disruption_message || item.message || item.disruption_type || "";
      if (message) parts.push(String(message));
    });
    return parts.join(" · ");
  }

  _cell(column, row) {
    const td = document.createElement("td");
    td.className = column.align + " col-" + column.key;

    switch (column.key) {
      case "route":
        td.textContent = row.routeName;
        break;
      case "departure":
        this._timeCell(td, row.departure, Date.now());
        break;
      case "arrival":
        this._timeCell(td, row.arrival, row.departure !== null ? row.departure : Date.now());
        break;
      case "duration":
        this._durationCell(td, row);
        break;
      case "physical_mode":
        td.textContent = row.mode
          ? this._config.compact_mode
            ? compactMode(row.mode)
            : row.mode
          : "-";
        break;
      case "status":
        this._statusCell(td, row);
        break;
      case "line":
        td.textContent = row.line || "-";
        break;
      case "direction":
        td.textContent = row.direction || "-";
        break;
      case "from":
        td.textContent = row.from || "-";
        break;
      case "to":
        td.textContent = row.to || "-";
        break;
      case "disruption": {
        const text = this._disruptionText(row);
        td.textContent = text || "-";
        if (text) td.title = text;
        break;
      }
      default:
        td.textContent = "-";
    }
    return td;
  }
}

/* ---------- editeur graphique ---------- */

/* Champs de l'editeur ayant un texte d'aide sous le libelle. On n'en met que la
   ou le libelle ne suffit pas : une aide sous chaque champ ne se lit plus. */
const EDITOR_HELPED = [
  "sort",
  "sortable",
  "max_journeys",
  "hide_past",
  "time_format",
  "compact_mode",
  "more_info",
  "duration_colors"
];

const EDITOR_STYLE = [
  ":host { display: block; }",
  "ha-expansion-panel { display: block; margin-bottom: 8px; }",
  /* Repli de secours quand `ha-expansion-panel` n'est pas (encore) enregistre. */
  "details.panel { display: block; margin-bottom: 8px; border: 1px solid var(--divider-color);",
  "  border-radius: 6px; }",
  "details.panel > summary { cursor: pointer; padding: 10px 12px; font-weight: 500;",
  "  color: var(--primary-text-color); }",
  "details.panel > summary .sum { color: var(--secondary-text-color); font-weight: 400; }",
  ".inner { padding: 4px 12px 12px; }",
  ".hint { color: var(--secondary-text-color); font-size: 12px; margin: 0 0 10px; line-height: 1.4; }",

  /* Une ligne = [switch] [libelle + sous-titre] [champs] [fleches]. */
  ".row { display: flex; align-items: center; gap: 8px; padding: 2px 0; min-height: 34px; }",
  ".row.head-row { border-bottom: 1px solid var(--divider-color); margin-bottom: 4px;",
  "  padding-bottom: 6px; }",
  ".row .grow { flex: 1 1 auto; min-width: 0; }",
  ".row.off .label { color: var(--secondary-text-color); }",
  ".label { flex: 0 0 40%; min-width: 0; }",
  ".label .main { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
  "  color: inherit; }",
  ".sub { color: var(--secondary-text-color); font-size: 11px; }",
  /* Entete des colonnes de champs : meme base de flex que les champs eux-memes,
     pour que les libelles tombent bien au-dessus. */
  ".col-head { flex: 1 1 0; min-width: 60px; color: var(--secondary-text-color);",
  "  font-size: 11px; }",
  ".label .sub { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",

  /* Separateur entre la partie active et la partie masquee. */
  ".sep { display: flex; align-items: center; gap: 8px; margin: 10px 0 2px;",
  "  color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase;",
  "  letter-spacing: 0.06em; }",
  ".sep::after { content: ''; flex: 1 1 auto; height: 1px; background: var(--divider-color); }",

  ".sw { flex: 0 0 auto; }",
  "input.sw { width: 18px; height: 18px; margin: 0 6px; accent-color: var(--primary-color); }",

  "input.txt { box-sizing: border-box; height: 32px; padding: 4px 8px;",
  "  border: 1px solid var(--divider-color); border-radius: 4px;",
  "  background: var(--card-background-color, transparent); color: var(--primary-text-color);",
  "  font-family: inherit; font-size: 13px; }",
  "input.txt:focus { outline: none; border-color: var(--primary-color);",
  "  box-shadow: 0 0 0 1px var(--primary-color); }",
  ".row input.txt { flex: 1 1 0; min-width: 60px; }",

  "button.mini { flex: 0 0 auto; width: 30px; height: 30px; line-height: 1;",
  "  border: 1px solid var(--divider-color); border-radius: 4px; cursor: pointer;",
  "  background: transparent; color: var(--primary-text-color); font-size: 13px; }",
  "button.mini:hover:not(:disabled) { background: rgba(127,127,127,0.16); }",
  "button.mini:disabled { opacity: 0.3; cursor: default; }",
  ".empty { color: var(--secondary-text-color); font-size: 13px; padding: 6px 0; }",

  /* Barre laterale etroite : le libelle passe au-dessus des champs. */
  "@media (max-width: 460px) {",
  "  .row { flex-wrap: wrap; padding: 6px 0; }",
  "  .label { flex: 1 1 100%; order: -1; }",
  "  .row input.txt { flex: 1 1 40%; }",
  "}"
].join("\n");

class TrainTravelerCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._built = false;
    this._forms = [];
    this._upgradeWaiting = false;
    /* Tri d'avant une bascule automatique sur l'ordre personnalise, garde le
       temps d'en proposer le retour. Hors configuration : rien a ecrire dans le
       YAML pour un chemin de retour. */
    this._previousSort = null;
    /* Meme garde que la carte : l'editeur ouvert ne doit pas se reconstruire
       parce qu'une lampe a change d'etat. */
    this._watched = null;
    this._stateCount = 0;
    this._sigRoutes = null;
    this._sigColumns = null;
    this._sigNames = null;
  }

  setConfig(config) {
    this._config = Object.assign({}, DEFAULTS, config);
    if (this._config.entity && !config.entities) this._config.entities = [this._config.entity];
    delete this._config.entity;
    if (!this._config.columns || !this._config.columns.length) {
      this._config.columns = DEFAULT_COLUMNS.slice();
    }
    if (!Array.isArray(this._config.entities)) this._config.entities = [];
    this._config.entities = this._config.entities.map(String);
    if (!isPlainObject(this._config.route_names)) this._config.route_names = {};
    this._config.route_names = stringKeys(this._config.route_names);
    this._watched = null;
    this._render();
  }

  set hass(hass) {
    const previous = this._hass;
    const before = currentLang;
    this._hass = hass;
    setLanguageFrom(hass);
    if (before === currentLang && readingsUnchanged(previous, hass, this._watched, this._stateCount)) {
      return;
    }
    /* Changement de langue : tous les libelles en dependent, on reconstruit. */
    if (before !== currentLang) this._rebuild();
    else this._render();
  }

  /* Emet la nouvelle configuration. On nettoie les tables vides pour ne pas
     polluer le YAML avec `route_names: {}`. */
  _emit(patch) {
    const next = Object.assign({}, this._config, patch);
    /* L'ordre personnalise n'a de sens qu'avec une liste ecrite : sans elle,
       tous les trajets sont a egalite et le tri retombe silencieusement sur
       l'heure de depart. On fige donc la liste au moment ou l'utilisateur
       choisit cet ordre, plutot que de lui laisser un tri qui ne fait rien. */
    if (next.sort === "manual" && (!next.entities || !next.entities.length)) {
      next.entities = TrainTravelerCard.routes(this._hass).map(function (route) {
        return route.id;
      });
    }
    if (isPlainObject(next.route_names) && !Object.keys(next.route_names).length) {
      delete next.route_names;
    }
    if (!next.title) delete next.title;
    this._config = Object.assign({}, DEFAULTS, next);
    fireEvent(this, "config-changed", { config: next });
  }

  /* Met a jour une entree de `route_names` ; valeur vide = on retire la clef,
     pour ne pas laisser de `"sensor.x": ""` dans le YAML. */
  _emitName(key, value) {
    const next = Object.assign({}, this._config.route_names);
    /* Meme precaution que `stringKeys` : une clef `__proto__` ne doit pas
       changer le prototype de la table au lieu d'y creer une entree. */
    if (value) {
      Object.defineProperty(next, String(key), {
        value: value,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } else delete next[key];
    this._emit({ route_names: next });
  }

  /* ---------- schemas, un par section ----------
     L'editeur suit l'ordre des decisions : quels trajets, dans quel ordre,
     quelles colonnes, puis l'habillage (titre, format, couleurs). */

  _schemaSort() {
    const sorts = SORT_KEYS.map(function (key) {
      return { value: key, label: t("opt_" + key) };
    });
    return [
      { name: "sort", selector: { select: { mode: "dropdown", options: sorts } } },
      { name: "sort_desc", selector: { boolean: {} } },
      { name: "sortable", selector: { boolean: {} } }
    ];
  }

  _schemaDisplay() {
    return [
      { name: "title", selector: { text: {} } },
      { name: "show_title", selector: { boolean: {} } },
      { name: "show_countdown", selector: { boolean: {} } },
      { name: "max_journeys", selector: { number: { min: 0, max: 100, mode: "box" } } },
      { name: "hide_past", selector: { boolean: {} } },
      {
        name: "time_format",
        selector: {
          select: {
            mode: "dropdown",
            options: ["auto", "time", "datetime"].map(function (key) {
              return { value: key, label: t("opt_time_" + key) };
            })
          }
        }
      },
      { name: "compact_mode", selector: { boolean: {} } },
      { name: "more_info", selector: { boolean: {} } }
    ];
  }

  _schemaColors() {
    return [
      { name: "duration_colors", selector: { boolean: {} } },
      { name: "duration_green", selector: { number: { min: 0, max: 600, mode: "box" } } },
      { name: "duration_red", selector: { number: { min: 0, max: 600, mode: "box" } } },
      { name: "delay_warn", selector: { number: { min: 0, max: 7200, mode: "box" } } },
      { name: "delay_alert", selector: { number: { min: 0, max: 86400, mode: "box" } } },
      { name: "color_ok", selector: { text: {} } },
      { name: "color_warn", selector: { text: {} } },
      { name: "color_alert", selector: { text: {} } }
    ];
  }

  /* ---------- briques d'interface ---------- */

  /* Section repliable. `ha-expansion-panel` quand le frontend l'a enregistre,
     `<details>` sinon : meme contrat (`_body`, `_setSummary`) dans les deux cas,
     le reste de l'editeur n'a pas a savoir lequel est utilise. */
  _section(title, hint, expanded) {
    const useHa = !!customElements.get("ha-expansion-panel");
    const root = document.createElement(useHa ? "ha-expansion-panel" : "details");
    const inner = document.createElement("div");
    inner.className = "inner";

    if (useHa) {
      root.outlined = true;
      root.leftChevron = true;
      root.header = title;
      root.expanded = !!expanded;
      root._setSummary = function (text) {
        root.secondary = text;
      };
    } else {
      root.className = "panel";
      root.open = !!expanded;
      const summary = document.createElement("summary");
      summary.textContent = title + " ";
      const sum = document.createElement("span");
      sum.className = "sum";
      summary.appendChild(sum);
      root.appendChild(summary);
      root._setSummary = function (text) {
        sum.textContent = text ? "— " + text : "";
      };
    }

    if (hint) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = hint;
      inner.appendChild(p);
    }
    const body = document.createElement("div");
    inner.appendChild(body);
    root.appendChild(inner);
    root._body = body;
    root._inner = inner;
    return root;
  }

  /* Titre de groupe entre la partie active et la partie masquee d'une liste :
     sans lui, la frontiere ne tient qu'a une nuance de gris. */
  _separator(text) {
    const sep = document.createElement("div");
    sep.className = "sep";
    sep.textContent = text;
    return sep;
  }

  _button(label, title, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mini";
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.addEventListener("click", onClick);
    return btn;
  }

  /* `ha-switch` quand le frontend l'a deja enregistre, case a cocher sinon :
     l'editeur reste utilisable meme si l'element n'est pas encore charge. */
  _switch(checked, title, onChange) {
    const useHa = !!customElements.get("ha-switch");
    const el = document.createElement(useHa ? "ha-switch" : "input");
    if (!useHa) el.type = "checkbox";
    el.className = "sw";
    el.checked = !!checked;
    el.title = title;
    el.setAttribute("aria-label", title);
    el.addEventListener("change", function () {
      onChange(!!el.checked);
    });
    return el;
  }

  /* Un interrupteur verrouille sans explication est un bug percu : on dit
     pourquoi il ne bouge pas. */
  _lockSwitch(el, why) {
    el.disabled = true;
    el.title = why;
    el.setAttribute("aria-label", why);
    return el;
  }

  /* Champ texte : on ne commet la valeur qu'au blur / Entree, sinon chaque
     frappe declencherait un config-changed et un re-rendu de l'editeur. */
  _textField(value, placeholder, onCommit) {
    const input = document.createElement("input");
    input.className = "txt";
    input.type = "text";
    input.value = value || "";
    input.placeholder = placeholder || "";
    input.addEventListener("change", function () {
      onCommit(input.value.trim());
    });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") input.blur();
    });
    return input;
  }

  /* Libelle principal + precision discrete (entity_id, nombre de trains) :
     l'utilisateur reconnait la ligne sans avoir a survoler pour lire un title. */
  _label(main, sub) {
    const box = document.createElement("div");
    box.className = "label grow";
    const strong = document.createElement("span");
    strong.className = "main";
    strong.textContent = main;
    box.appendChild(strong);
    if (sub) {
      const small = document.createElement("span");
      small.className = "sub";
      small.textContent = sub;
      box.appendChild(small);
    }
    box.title = sub ? main + " — " + sub : main;
    return box;
  }

  /* `ha-switch` et `ha-expansion-panel` peuvent n'etre enregistres qu'apres le
     premier rendu : on reconstruit l'editeur une fois, avec les vrais elements
     plutot qu'avec les solutions de repli. */
  _awaitUpgrade() {
    if (this._upgradeWaiting) return;
    const missing = ["ha-switch", "ha-expansion-panel"].filter(function (tag) {
      return !customElements.get(tag);
    });
    if (!missing.length) return;
    this._upgradeWaiting = true;
    const self = this;
    /* `race` et non `all` : chaque element enregistre declenche une seule
       reconstruction, et l'attente repart pour ceux qui manquent encore. */
    Promise.race(
      missing.map(function (tag) {
        return customElements.whenDefined(tag);
      })
    ).then(function () {
      self._upgradeWaiting = false;
      self._rebuild();
    });
  }

  _rebuild() {
    /* Rien n'est encore construit : il n'y a pas d'ancien rendu a jeter, mais le
       rendu initial reste a faire. Sans cela, une langue resolue au premier
       `set hass` — le cas courant, `currentLang` valant `en` avant lui — laisse
       l'editeur vide quand `hass` arrive avant `setConfig`. */
    if (!this._built) {
      this._render();
      return;
    }
    this.shadowRoot.innerHTML = "";
    this._built = false;
    this._forms = [];
    this._sigRoutes = null;
    this._sigColumns = null;
    this._sigNames = null;
    this._render();
  }

  /* ---------- panneau "colonnes" ---------- */

  /* Toutes les colonnes possibles sont listees : actives d'abord, dans l'ordre
     d'affichage, inactives ensuite. Le switch active / desactive, les fleches ne
     servent qu'a ordonner la partie active. */
  _renderColumns() {
    const body = this._panelColumns._body;
    const cfg = this._config;
    const available = COLUMN_KEYS.slice();
    const used = cfg.columns.map(columnKeyOf);
    /* Une colonne configuree mais inconnue de la carte reste listee : sinon
       l'utilisateur ne pourrait plus la desactiver. */
    used.forEach(function (key) {
      if (key && available.indexOf(key) === -1) available.push(key);
    });
    const signature = JSON.stringify(cfg.columns) + "|" + available.join(",");
    if (signature === this._sigColumns) return;
    this._sigColumns = signature;
    body.innerHTML = "";

    const self = this;
    const inactive = available.filter(function (key) {
      return used.indexOf(key) === -1;
    });
    const entries = cfg.columns
      .map(function (entry, index) {
        return { key: columnKeyOf(entry), entry: entry, index: index };
      })
      .concat(
        inactive.map(function (key) {
          return { key: key, entry: null, index: -1 };
        })
      );

    let separated = false;
    entries.forEach(function (item) {
      const active = item.index !== -1;
      if (!active && !separated) {
        separated = true;
        if (cfg.columns.length) body.appendChild(self._separator(t("hidden")));
      }
      const custom =
        isPlainObject(item.entry) && item.entry.name !== undefined ? item.entry.name : null;
      const row = document.createElement("div");
      row.className = active ? "row" : "row off";

      const toggle = self._switch(
        active,
        t(active ? "hide_column" : "show_column", { label: columnLabelOf(item.key) }),
        function () {
          self._toggleColumn(item.key, !active);
        }
      );
      /* La derniere colonne active ne peut pas etre retiree : une liste vide
         serait reinterpretee comme "colonnes par defaut". */
      if (active && cfg.columns.length === 1) {
        self._lockSwitch(toggle, t("lock_column"));
      }
      row.appendChild(toggle);

      row.appendChild(
        self._label(
          custom !== null ? String(custom) : columnLabelOf(item.key),
          custom !== null ? item.key : null
        )
      );

      const up = self._button("▲", t("move_up", { label: columnLabelOf(item.key) }), function () {
        self._moveColumn(item.index, -1);
      });
      up.disabled = !active || item.index === 0;
      const down = self._button("▼", t("move_down", { label: columnLabelOf(item.key) }), function () {
        self._moveColumn(item.index, 1);
      });
      down.disabled = !active || item.index === cfg.columns.length - 1;

      row.appendChild(up);
      row.appendChild(down);
      body.appendChild(row);
    });
  }

  _toggleColumn(key, enable) {
    const columns = this._config.columns.slice();
    if (enable) {
      columns.push(key);
    } else {
      for (let i = columns.length - 1; i >= 0; i--) {
        if (columnKeyOf(columns[i]) === key) columns.splice(i, 1);
      }
    }
    this._emit({ columns: columns });
  }

  _moveColumn(index, delta) {
    const columns = this._config.columns.slice();
    const target = index + delta;
    if (target < 0 || target >= columns.length) return;
    const moved = columns.splice(index, 1)[0];
    columns.splice(target, 0, moved);
    this._emit({ columns: columns });
  }

  /* ---------- panneau "trajets" ---------- */

  /* Liste effective des trajets retenus. `entities: []` signifie "tous" :
     l'editeur affiche alors tous les trajets connus comme coches, dans l'ordre
     de l'integration, et la premiere action de l'utilisateur fige cette liste en
     configuration. */
  _effectiveRoutes(known) {
    if (this._config.entities.length) return this._config.entities.slice();
    return known.map(function (route) {
      return route.id;
    });
  }

  /* Meme logique que les colonnes : tous les trajets connus sont listes, les
     retenus d'abord, dans leur ordre d'affichage. */
  _renderRoutes() {
    const body = this._panelRoutes._body;
    const cfg = this._config;
    const known = TrainTravelerCard.routes(this._hass);
    const signature =
      JSON.stringify(cfg.entities) +
      "|" +
      cfg.sort +
      "|" +
      (this._previousSort ? this._previousSort.sort : "") +
      "|" +
      known
        .map(function (route) {
          return route.id + ":" + route.name + ":" + route.count;
        })
        .join(",");
    if (signature === this._sigRoutes) return;
    this._sigRoutes = signature;
    body.innerHTML = "";

    const self = this;

    if (!known.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = t("ed_no_route");
      body.appendChild(empty);
      return;
    }

    /* Ordre affiche : les trajets retenus dans l'ordre voulu, puis les exclus. */
    const active = this._effectiveRoutes(known).filter(function (id) {
      return known.some(function (route) {
        return route.id === id;
      });
    });
    const entries = active
      .map(function (id, index) {
        const found = known.filter(function (route) {
          return route.id === id;
        })[0];
        return { route: found, index: index };
      })
      .concat(
        known
          .filter(function (route) {
            return active.indexOf(route.id) === -1;
          })
          .map(function (route) {
            return { route: route, index: -1 };
          })
      );

    let separated = false;
    entries.forEach(function (item) {
      const route = item.route;
      const on = item.index !== -1;
      if (!on && !separated) {
        separated = true;
        if (active.length) body.appendChild(self._separator(t("hidden")));
      }
      const row = document.createElement("div");
      row.className = on ? "row" : "row off";

      const toggle = self._switch(
        on,
        t(on ? "hide_route" : "show_route", { label: route.name }),
        function () {
          self._toggleRoute(route.id, !on, known);
        }
      );
      /* Tout decocher ecrirait `entities: []`, que la carte relit comme "tous" :
         l'editeur ferait donc l'inverse de ce qui est demande. */
      if (on && active.length === 1) {
        self._lockSwitch(toggle, t("lock_route"));
      }
      row.appendChild(toggle);

      const details = [
        t(route.count > 1 ? "ed_journeys_plural" : "ed_journeys", { count: route.count }),
        route.id
      ];
      row.appendChild(self._label(self._displayName(route), details.join(" · ")));

      const up = self._button("▲", t("move_up", { label: route.name }), function () {
        self._moveRoute(item.index, -1, known);
      });
      up.disabled = !on || item.index === 0;
      const down = self._button("▼", t("move_down", { label: route.name }), function () {
        self._moveRoute(item.index, 1, known);
      });
      down.disabled = !on || item.index === active.length - 1;

      row.appendChild(up);
      row.appendChild(down);
      body.appendChild(row);
    });

    /* Le tableau ne suit cette liste qu'avec le tri "manual" : on dit toujours
       ou en est le tri, et on propose le geste inverse de celui qui vient d'etre
       fait. Sous un autre tri, ranger la liste ne se verrait pas : on offre d'y
       basculer. Apres la bascule faite par une fleche, on offre le retour au tri
       d'avant. */
    if (cfg.sort !== "manual") {
      this._previousSort = null;
      body.appendChild(
        this._orderNote(
          t("order_unused", { manual: t("sort_manual_label"), sort: this._sortLabel() }),
          t("order_use"),
          function () {
            self._emit({ sort: "manual", sort_desc: false });
          }
        )
      );
    } else if (this._previousSort) {
      const previous = this._previousSort;
      body.appendChild(
        this._orderNote(t("order_now"), t("order_back", { sort: this._sortLabel(previous.sort) }), function () {
          self._previousSort = null;
          self._emit({ sort: previous.sort, sort_desc: previous.desc });
        })
      );
    }
  }

  /* Nom tel que la carte l'affichera : surcharge si elle existe, nom de l'entite
     sinon. L'editeur montre le resultat, pas la matiere premiere. */
  _displayName(route) {
    const custom = tableValue(this._config.route_names, route.id);
    return custom ? String(custom) : route.name;
  }

  /* Rappel de bas de section : un texte discret, et le geste qui va avec. */
  _orderNote(text, action, onClick) {
    const note = document.createElement("div");
    note.className = "row";
    const label = document.createElement("div");
    label.className = "empty grow";
    label.textContent = text;
    note.appendChild(label);
    note.appendChild(this._button(action, action, onClick));
    return note;
  }

  /* Libelle du tri courant, tel qu'il est ecrit dans le menu de la section
     "Tri" : le rappel ci-dessus et le resume du panneau doivent nommer le tri de
     la meme facon que l'utilisateur l'a choisi. */
  _sortLabel(key) {
    const wanted = key === undefined ? this._config.sort : key;
    let label = wanted;
    this._schemaSort()[0].selector.select.options.forEach(function (option) {
      if (option.value === wanted) label = option.label;
    });
    return label;
  }

  _toggleRoute(id, enable, known) {
    /* Premiere action depuis "tous" : on materialise la liste. */
    const current = this._effectiveRoutes(known);
    let next;
    if (enable) {
      next = current.indexOf(id) === -1 ? current.concat([id]) : current;
    } else {
      next = current.filter(function (item) {
        return item !== id;
      });
      if (!next.length) return;
    }
    this._emit({ entities: next });
  }

  /* Reordonner fige la liste, comme cocher ou decocher : sans `entities` ecrit
     en configuration, il n'y a nulle part ou ranger cet ordre.

     Ranger cette liste n'a par ailleurs qu'un but : la voir dans le tableau. La
     premiere fleche bascule donc sur l'ordre personnalise, en annoncant le
     changement et en gardant le tri precedent sous le coude — un reglage voisin
     modifie sans le dire serait imprevisible, l'annoncer avec son retour ne
     l'est pas. Le sens decroissant est remis a plat au passage : garder un
     `sort_desc` herite d'un autre tri rendrait la liste a l'envers, soit
     l'inverse de ce qui vient d'etre demande. */
  _moveRoute(index, delta, known) {
    const entities = this._effectiveRoutes(known || []);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= entities.length) return;
    const moved = entities.splice(index, 1)[0];
    entities.splice(target, 0, moved);
    const patch = { entities: entities };
    if (this._config.sort !== "manual") {
      this._previousSort = { sort: this._config.sort, desc: !!this._config.sort_desc };
      patch.sort = "manual";
      patch.sort_desc = false;
    }
    this._emit(patch);
  }

  /* ---------- panneau "noms des trajets" ---------- */

  _renderNames() {
    const body = this._panelNames._body;
    const cfg = this._config;
    const all = TrainTravelerCard.routes(this._hass);
    /* On ne propose que les trajets effectivement affiches, plus ceux deja
       renommes (une surcharge orpheline doit rester modifiable). */
    const shown = all.filter(function (route) {
      return !cfg.entities.length || cfg.entities.indexOf(route.id) !== -1;
    });
    Object.keys(cfg.route_names).forEach(function (id) {
      const known = shown.some(function (route) {
        return route.id === id;
      });
      if (!known) shown.push({ id: id, name: id, count: 0 });
    });

    const signature = shown
      .map(function (route) {
        return route.id + "=" + (tableValue(cfg.route_names, route.id) || "");
      })
      .join(";");
    if (signature === this._sigNames) return;
    this._sigNames = signature;
    body.innerHTML = "";

    if (!shown.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = t("ed_no_route");
      body.appendChild(empty);
      return;
    }

    const self = this;
    const legend = document.createElement("div");
    legend.className = "row head-row";
    legend.appendChild(this._label(t("ed_route"), null));
    const cell = document.createElement("div");
    cell.className = "col-head";
    cell.textContent = t("ed_col_name");
    legend.appendChild(cell);
    body.appendChild(legend);

    shown.forEach(function (route) {
      const row = document.createElement("div");
      row.className = "row";
      row.appendChild(self._label(route.name, route.id));
      row.appendChild(
        self._textField(tableValue(cfg.route_names, route.id), route.name, function (value) {
          self._emitName(route.id, value);
        })
      );
      body.appendChild(row);
    });
  }

  /* ---------- assemblage ---------- */

  /* Un `ha-form` par section. Chacun recoit la configuration complete en `data`
     et ne declare qu'une partie du schema : l'evenement `value-changed` renvoie
     l'objet entier, les clefs des autres sections sont donc preservees. */
  _form(schemaName) {
    const form = document.createElement("ha-form");
    form.computeLabel = function (schema) {
      return t("ed_" + schema.name) || schema.name;
    };
    /* `computeHelper` place un texte sous le champ : c'est la ou Home Assistant
       attend les explications, plutot que dans un paragraphe separe. */
    form.computeHelper = function (schema) {
      return EDITOR_HELPED.indexOf(schema.name) === -1 ? "" : t("help_" + schema.name);
    };
    const self = this;
    form.addEventListener("value-changed", function (ev) {
      ev.stopPropagation();
      self._emit(ev.detail.value);
    });
    form._schemaName = schemaName;
    this._forms.push(form);
    return form;
  }

  _build() {
    const style = document.createElement("style");
    style.textContent = EDITOR_STYLE;
    this.shadowRoot.appendChild(style);
    this._forms = [];

    /* 1. Quels trajets. Seule section ouverte d'emblee : c'est la premiere
       decision, les autres ont toutes une valeur par defaut acceptable. */
    this._panelRoutes = this._section(t("sec_routes"), t("sec_routes_hint"), true);

    /* 2. Dans quel ordre. */
    this._panelSort = this._section(t("sec_sort"), t("sec_sort_hint"), false);
    this._panelSort._body.appendChild(this._form("sort"));

    /* 3. Quelles colonnes, dans quel ordre. */
    this._panelColumns = this._section(t("sec_columns"), t("sec_columns_hint"), false);

    /* 4. Habillage. */
    this._panelDisplay = this._section(t("sec_display"), null, false);
    this._panelDisplay._body.appendChild(this._form("display"));

    this._panelColors = this._section(t("sec_colors"), t("sec_colors_hint"), false);
    this._panelColors._body.appendChild(this._form("colors"));

    this._panelNames = this._section(t("sec_names"), t("sec_names_hint"), false);

    [
      this._panelRoutes,
      this._panelSort,
      this._panelColumns,
      this._panelDisplay,
      this._panelColors,
      this._panelNames
    ].forEach(
      function (panel) {
        this.shadowRoot.appendChild(panel);
      }.bind(this)
    );
    this._built = true;
    this._awaitUpgrade();
  }

  /* Chaque section repliee affiche son etat : l'utilisateur sait ce qu'il y a
     dedans sans l'ouvrir, et voit l'effet de ses reglages precedents. */
  _summaries() {
    const cfg = this._config;
    const known = TrainTravelerCard.routes(this._hass);

    this._panelRoutes._setSummary(
      !known.length
        ? t("sum_no_route")
        : cfg.entities.length
          ? t("sum_some", { count: cfg.entities.length, total: known.length })
          : t("sum_all", { count: known.length })
    );

    const sortLabel = this._sortLabel();
    this._panelSort._setSummary(
      sortLabel + (cfg.sort_desc ? " ↓" : " ↑") + (cfg.sortable ? "" : t("sum_not_sortable"))
    );

    this._panelColumns._setSummary(
      t("sum_some", { count: cfg.columns.length, total: COLUMN_KEYS.length })
    );

    const titleState = cfg.show_title === false || !cfg.title ? t("sum_no_title") : cfg.title;
    this._panelDisplay._setSummary(
      titleState +
        " · " +
        (cfg.max_journeys > 0
          ? t("sum_max_journeys", { count: cfg.max_journeys })
          : t("sum_all_journeys"))
    );

    this._panelColors._setSummary(
      cfg.duration_colors
        ? t("sum_colors_on", { green: cfg.duration_green, red: cfg.duration_red })
        : t("sum_colors_off")
    );

    const overrides = Object.keys(cfg.route_names).length;
    this._panelNames._setSummary(
      overrides
        ? t(overrides > 1 ? "sum_overrides" : "sum_override", { count: overrides })
        : t("sum_no_override")
    );
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._built) this._build();

    this._watched = TrainTravelerCard.routes(this._hass).map(function (route) {
      return route.id;
    });
    this._stateCount = statesCount(this._hass);

    const self = this;
    this._forms.forEach(function (form) {
      form.hass = self._hass;
      if (form._schemaName === "sort") form.schema = self._schemaSort();
      else if (form._schemaName === "display") form.schema = self._schemaDisplay();
      else form.schema = self._schemaColors();
      form.data = self._config;
    });

    this._renderRoutes();
    this._renderColumns();
    this._renderNames();
    this._summaries();
  }
}

if (!customElements.get("train-traveler-card")) {
  customElements.define("train-traveler-card", TrainTravelerCard);
}
if (!customElements.get("train-traveler-card-editor")) {
  customElements.define("train-traveler-card-editor", TrainTravelerCardEditor);
}

/* Selecteur de carte "par entite" (HA 2026.6+) : quand l'utilisateur clique sur
   un sensor de l'integration, on propose deux mises en page pretes a l'emploi.
   Renvoyer `null` pour toute autre entite est une obligation du contrat. */
const entitySuggestion = function (hass, entityId) {
  const state = hass && hass.states ? hass.states[entityId] : null;
  const attrs = state ? state.attributes : null;
  if (!attrs || !Array.isArray(attrs.journeys) || !attrs.journeys.length) return null;
  if (!looksLikeJourney(attrs.journeys[0])) return null;

  /* Le selecteur peut interroger la carte avant tout `set hass` : on resout la
     langue ici aussi, l'objet `hass` etant fourni en argument. */
  setLanguageFrom(hass);

  const label = attrs.friendly_name ? String(attrs.friendly_name) : entityId;

  return [
    {
      label: t("suggest_table", { route: label }),
      config: {
        type: "custom:train-traveler-card",
        title: label,
        entities: [entityId],
        columns: DEFAULT_COLUMNS.slice()
      }
    },
    {
      label: t("suggest_compact"),
      config: {
        type: "custom:train-traveler-card",
        title: label,
        entities: [entityId],
        columns: ["departure", "arrival", "duration", "status"],
        max_journeys: 4,
        show_countdown: true
      }
    }
  ];
};

window.customCards = window.customCards || [];
/* Le fichier peut etre declare deux fois en ressources (migration manuelle puis
   HACS) : sans ce garde-fou, la carte apparaitrait en double dans le selecteur. */
const alreadyRegistered = window.customCards.some(function (entry) {
  return entry && entry.type === "train-traveler-card";
});
if (!alreadyRegistered) {
  window.customCards.push({
    type: "train-traveler-card",
    /* Le selecteur lit ces champs une seule fois, au chargement du fichier : ils
       sont donc resolus dans la langue par defaut tant que le frontend n'a pas
       encore parle. C'est le seul endroit ou la traduction ne peut pas suivre un
       changement de langue sans rechargement de la page. */
    get name() {
      return t("card_name");
    },
    preview: true,
    get description() {
      return t("card_description");
    },
    /* Convention du selecteur de cartes : ajoute un lien "Documentation" a cote
       de la carte dans la liste. */
    documentationURL: "https://github.com/Pulpyyyy/carte-train",
    getEntitySuggestion: entitySuggestion
  });
}
