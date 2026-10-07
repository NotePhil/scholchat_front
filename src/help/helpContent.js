/*
 * Aide contextuelle ScholChat — textes centralisés (web ; même structure de clés que le mobile).
 *
 * Clé : "<rôle>.<page>"
 *   rôle : "parent" | "eleve" | "professeur"
 *   page : "dashboard", "activites", "classes", "cours", "exercices", "devoirs", "corrections",
 *          "programmer-cours", "programmer-exercices", "mes-cours", "creer-cours", "matieres",
 *          "creer-classe", "gerer-classe", "eleves", "parents", "professeurs", "enfants",
 *          "messages", "notifications", "profil"
 * Valeur : { title, intro, steps: [string], tips: [string] }
 *   intro = à quoi sert la page ; steps = actions principales ; tips = astuces.
 *
 * Pour modifier un texte, changez-le ici : le bouton « ? » de chaque page le lit directement.
 */

export const HELP_ROLE_LABELS = {
  parent: "Parent",
  eleve: "Élève",
  professeur: "Professeur",
};

// Shared blocks (same text for several roles)
const MESSAGES = {
  title: "Messages",
  intro: "Échangez avec les membres de vos classes : professeurs, élèves et parents.",
  steps: [
    "Choisissez une conversation dans la liste, ou démarrez-en une nouvelle.",
    "Écrivez votre message puis appuyez sur Envoyer ; vous pouvez joindre des fichiers.",
    "Un point de couleur signale les conversations non lues.",
  ],
  tips: [
    "Restez courtois : les messages sont visibles par leurs destinataires et peuvent être signalés.",
    "Les nouveaux messages arrivent aussi dans les notifications (cloche en haut à droite).",
  ],
};

const NOTIFICATIONS = {
  title: "Notifications",
  intro: "La cloche en haut à droite regroupe tout ce qui vous concerne : nouveaux cours, devoirs, corrections, demandes et validations.",
  steps: [
    "Cliquez sur la cloche pour ouvrir la liste ; le chiffre indique les notifications non lues.",
    "Cliquez sur une notification pour aller directement à la page concernée.",
    "Utilisez « Tout marquer comme lu » ou supprimez celles dont vous n'avez plus besoin.",
  ],
  tips: ["Le filtre « Non lues » permet de ne voir que les nouveautés."],
};

const profil = (extraSteps = [], extraTips = []) => ({
  title: "Mon profil et paramètres",
  intro: "Gérez vos informations personnelles, votre mot de passe, l'apparence de l'application et vos profils.",
  steps: [
    "Onglet « Mon Profil » : cliquez sur « Modifier » pour mettre à jour votre nom, téléphone ou adresse, puis « Enregistrer ».",
    "Onglet « Sécurité » : changez votre mot de passe (8 caractères minimum, majuscule, minuscule, chiffre et caractère spécial).",
    "Onglet « Apparence » : mode clair ou sombre, langue et couleur de l'interface.",
    ...extraSteps,
  ],
  tips: ["Votre adresse e-mail est votre identifiant de connexion : elle ne se modifie pas ici.", ...extraTips],
});

const ACTIVITES = (who) => ({
  title: "Activités",
  intro: `Le fil des activités et événements ${who}.`,
  steps: [
    "Faites défiler le fil pour voir les dernières activités et événements.",
    "Cliquez sur une activité pour en voir le détail.",
  ],
  tips: ["Les activités importantes génèrent aussi une notification."],
});

export const HELP_CONTENT = {
  /* ───────────────────────────── PARENT ───────────────────────────── */
  "parent.dashboard": {
    title: "Tableau de bord parent",
    intro: "Une vue d'ensemble de la scolarité de l'enfant sélectionné : classes, cours programmés, progression et devoirs.",
    steps: [
      "Choisissez l'enfant à suivre avec le sélecteur (en haut de la page ou dans l'en-tête).",
      "Cliquez sur une carte (Classes, Cours programmés…) pour ouvrir la page correspondante.",
      "Bouton « Rejoindre une classe » : saisissez le code donné par le professeur pour inscrire votre enfant.",
    ],
    tips: [
      "Changer d'enfant demande votre mot de passe, pour protéger les données de chacun.",
      "Aucun enfant ? Ajoutez-en un depuis « Mes enfants ».",
    ],
  },
  "parent.activites": ACTIVITES("des classes de vos enfants"),
  "parent.classes": {
    title: "Classes de mon enfant",
    intro: "Les classes de l'enfant sélectionné, avec l'état de chaque demande d'accès.",
    steps: [
      "Cliquez sur « Rejoindre une classe » et saisissez le code fourni par le professeur : la classe trouvée s'affiche pour vérification.",
      "Cliquez sur « Continuer », choisissez l'enfant concerné puis confirmez la demande.",
      "Une fois la demande approuvée par le professeur, cliquez sur « Entrer dans la classe » pour voir ses cours.",
    ],
    tips: [
      "« En attente » : le professeur n'a pas encore répondu. « Refusée » : contactez le professeur.",
      "Utilisez le champ de filtre pour retrouver rapidement une classe.",
    ],
  },
  "parent.cours": {
    title: "Cours programmés",
    intro: "Le planning des cours des classes de votre enfant.",
    steps: [
      "Parcourez les cours à venir, en cours et terminés.",
      "Ouvrez un cours pour voir son contenu et, s'il est en direct, le rejoindre.",
    ],
    tips: ["Un cours en direct est signalé par un badge ; une notification est aussi envoyée."],
  },
  "parent.exercices": {
    title: "Exercices",
    intro: "Les exercices proposés dans les classes de votre enfant.",
    steps: [
      "Consultez la liste des exercices disponibles.",
      "Ouvrez un exercice pour voir son énoncé.",
    ],
    tips: ["Les devoirs à rendre se trouvent dans « Mes Devoirs »."],
  },
  "parent.devoirs": {
    title: "Devoirs",
    intro: "Les devoirs de l'enfant sélectionné : à faire, rendus et corrigés.",
    steps: [
      "Ouvrez un devoir pour voir l'énoncé et la date limite.",
      "Enfant mineur sans compte : vous pouvez répondre au devoir pour lui, puis l'envoyer.",
      "Enfant ayant son propre compte : vous suivez ses devoirs en lecture seule.",
      "Consultez la note et les commentaires une fois la correction disponible.",
    ],
    tips: ["Surveillez les dates limites : un devoir rendu en retard peut être refusé."],
  },
  "parent.enfants": {
    title: "Mes enfants",
    intro: "Ajoutez et gérez les enfants rattachés à votre compte.",
    steps: [
      "Cliquez sur « Ajouter un enfant » et renseignez ses informations.",
      "Sélectionnez un enfant pour suivre ses classes, cours et devoirs.",
      "Inscrivez ensuite l'enfant dans sa classe avec « Rejoindre une classe ».",
    ],
    tips: ["Un enfant majeur peut avoir son propre compte élève ; vous le suivez alors en lecture seule."],
  },
  "parent.messages": MESSAGES,
  "parent.notifications": NOTIFICATIONS,
  "parent.profil": profil(
    [
      "« Mes profils » : basculez vers un autre profil actif (professeur, élève) ou ajoutez-en un avec « Ajouter un profil ».",
      "Le statut de chaque profil y est affiché : actif, en attente de validation, documents manquants ou refusé.",
    ],
    ["Un profil professeur demande vos pièces d'identité et une validation par l'administration."],
  ),

  /* ───────────────────────────── ÉLÈVE ───────────────────────────── */
  "eleve.dashboard": {
    title: "Mon tableau de bord",
    intro: "Votre progression en un coup d'œil : classes, cours programmés, cours terminés et devoirs.",
    steps: [
      "Cliquez sur une carte pour ouvrir la page correspondante (classes, cours, devoirs).",
      "Bouton « Rejoindre une classe » : saisissez le code donné par votre professeur.",
    ],
    tips: ["Revenez souvent : les nouveaux cours et devoirs apparaissent ici et dans les notifications."],
  },
  "eleve.activites": ACTIVITES("de vos classes"),
  "eleve.classes": {
    title: "Mes classes",
    intro: "Les classes que vous suivez et l'état de vos demandes d'accès.",
    steps: [
      "Cliquez sur « Rejoindre une classe » et saisissez le code fourni par votre professeur.",
      "Vérifiez la classe affichée (nom, niveau, établissement, professeur), puis « Continuer » et confirmez.",
      "Après l'approbation du professeur, cliquez sur « Entrer dans la classe » pour voir les cours.",
    ],
    tips: [
      "« En attente » : votre demande n'a pas encore été traitée par le professeur.",
      "Certaines classes sont réservées aux mineurs : c'est alors votre parent qui fait la demande.",
    ],
  },
  "eleve.cours": {
    title: "Cours programmés",
    intro: "Le planning de vos cours : à venir, en cours et terminés.",
    steps: [
      "Ouvrez un cours pour voir son contenu et ses documents.",
      "Rejoignez un cours en direct dès qu'il commence.",
    ],
    tips: ["Activez les notifications pour ne manquer aucun cours."],
  },
  "eleve.exercices": {
    title: "Exercices",
    intro: "Les exercices proposés par vos professeurs pour vous entraîner.",
    steps: ["Choisissez un exercice dans la liste.", "Lisez l'énoncé et entraînez-vous."],
    tips: ["Les devoirs notés à rendre se trouvent dans « Mes Devoirs »."],
  },
  "eleve.devoirs": {
    title: "Mes devoirs",
    intro: "Vos devoirs à faire, rendus et corrigés.",
    steps: [
      "Ouvrez un devoir « À faire » pour voir l'énoncé et la date limite.",
      "Rédigez vos réponses puis cliquez sur « Soumettre ».",
      "Quand la correction est disponible, consultez votre note et les commentaires.",
    ],
    tips: ["Soumettez avant la date limite ; vérifiez vos réponses avant l'envoi."],
  },
  "eleve.messages": MESSAGES,
  "eleve.notifications": NOTIFICATIONS,
  "eleve.profil": profil(
    [
      "« Mes profils » affiche les profils de votre compte et leur statut.",
      "Depuis le profil élève, il n'est pas possible de changer de profil : déconnectez-vous puis choisissez l'autre profil à la connexion.",
    ],
    [],
  ),

  /* ─────────────────────────── PROFESSEUR ─────────────────────────── */
  "professeur.dashboard": {
    title: "Tableau de bord",
    intro: "Vue d'ensemble de votre activité : classes, cours, exercices et demandes en attente.",
    steps: [
      "Consultez les indicateurs clés de vos classes.",
      "Utilisez le menu de gauche pour créer un cours, programmer une séance ou corriger des devoirs.",
    ],
    tips: ["Les demandes d'accès à vos classes arrivent dans les notifications."],
  },
  "professeur.activites": ACTIVITES("de vos classes"),
  "professeur.mes-cours": {
    title: "Mes cours",
    intro: "La bibliothèque de vos cours (brouillons et publiés).",
    steps: [
      "Cliquez sur « Créer un cours » pour en rédiger un nouveau.",
      "Ouvrez un cours pour le modifier, le publier ou le supprimer.",
      "Un cours publié peut ensuite être programmé pour une classe.",
    ],
    tips: ["Gardez vos cours en brouillon tant qu'ils ne sont pas prêts."],
  },
  "professeur.creer-cours": {
    title: "Créer un cours",
    intro: "Rédigez un cours : titre, matière, contenu et documents.",
    steps: [
      "Renseignez le titre, la matière et la description.",
      "Ajoutez le contenu et les pièces jointes (documents, images, vidéos).",
      "Enregistrez en brouillon ou publiez le cours.",
    ],
    tips: ["Un cours publié reste modifiable depuis « Mes cours »."],
  },
  "professeur.programmer-cours": {
    title: "Programmer un cours",
    intro: "Planifiez une séance d'un de vos cours pour une classe.",
    steps: [
      "Choisissez la classe et le cours à programmer.",
      "Indiquez la date, l'heure et la durée de la séance.",
      "Validez : les élèves et parents de la classe sont notifiés.",
    ],
    tips: ["Vérifiez le fuseau horaire avant de valider."],
  },
  "professeur.cours": {
    title: "Cours programmés",
    intro: "Le planning de toutes vos séances programmées.",
    steps: [
      "Retrouvez les séances à venir, en cours et terminées.",
      "Démarrez une séance en direct au moment prévu, ou modifiez-la.",
    ],
    tips: ["Le bouton « Programmer » permet d'ajouter rapidement une nouvelle séance."],
  },
  "professeur.matieres": {
    title: "Matières",
    intro: "Les matières que vous enseignez, utilisées pour classer vos cours et exercices.",
    steps: ["Ajoutez une matière si elle n'existe pas encore.", "Associez vos cours et exercices à la bonne matière."],
    tips: [],
  },
  "professeur.exercices": {
    title: "Mes exercices",
    intro: "Créez et gérez vos exercices et devoirs.",
    steps: [
      "Cliquez sur « Créer » pour rédiger un exercice (questions, barème, pièces jointes).",
      "Modifiez ou supprimez un exercice depuis la liste.",
      "Programmez-le ensuite pour une classe dans « Programmer ».",
    ],
    tips: ["Un barème clair facilite la correction."],
  },
  "professeur.programmer-exercices": {
    title: "Programmer un exercice",
    intro: "Donnez un exercice à une classe comme devoir, avec une date limite.",
    steps: [
      "Choisissez l'exercice et la classe.",
      "Fixez la date de publication et la date limite de remise.",
      "Validez : les élèves et parents sont notifiés.",
    ],
    tips: ["Laissez un délai raisonnable avant la date limite."],
  },
  "professeur.corrections": {
    title: "Corrections",
    intro: "Les copies rendues par vos élèves, à corriger.",
    steps: [
      "Choisissez un devoir puis une copie à corriger.",
      "Attribuez une note et ajoutez vos commentaires.",
      "Publiez la correction : l'élève (et son parent) est notifié.",
    ],
    tips: ["Filtrez par classe ou par devoir pour avancer plus vite."],
  },
  "professeur.creer-classe": {
    title: "Créer une classe",
    intro: "Créez une classe et obtenez son code d'accès pour vos élèves et leurs parents.",
    steps: [
      "Renseignez le nom, le niveau et, si besoin, l'établissement.",
      "Indiquez si la classe est ouverte aux élèves majeurs.",
      "Validez : la classe peut nécessiter l'approbation de l'établissement avant d'être active.",
    ],
    tips: ["Une fois active, partagez le code de la classe avec vos élèves et leurs parents."],
  },
  "professeur.gerer-classe": {
    title: "Gérer mes classes",
    intro: "Toutes vos classes : membres, demandes d'accès, code et paramètres.",
    steps: [
      "Ouvrez une classe pour voir ses membres et ses cours.",
      "Onglet des demandes : approuvez ou refusez les demandes d'accès des élèves et parents.",
      "Copiez le code de la classe pour l'envoyer à de nouveaux élèves.",
    ],
    tips: ["Approuver une inscription par code envoie ses identifiants au nouvel utilisateur."],
  },
  "professeur.classes": {
    title: "Classes",
    intro: "La liste de vos classes et leur état.",
    steps: ["Ouvrez une classe pour la gérer.", "Créez une nouvelle classe depuis le menu « Classes »."],
    tips: [],
  },
  "professeur.eleves": {
    title: "Élèves",
    intro: "Les élèves inscrits dans vos classes.",
    steps: ["Recherchez un élève par son nom.", "Ouvrez sa fiche pour voir ses classes et le contacter."],
    tips: [],
  },
  "professeur.parents": {
    title: "Parents",
    intro: "Les parents des élèves de vos classes.",
    steps: ["Recherchez un parent par son nom.", "Contactez-le via la messagerie."],
    tips: [],
  },
  "professeur.professeurs": {
    title: "Professeurs",
    intro: "Les professeurs avec qui vous partagez des classes.",
    steps: ["Consultez la liste et contactez un collègue via la messagerie."],
    tips: [],
  },
  "professeur.messages": MESSAGES,
  "professeur.notifications": NOTIFICATIONS,
  "professeur.profil": profil(
    [
      "« Documents de vérification » : consultez ou remplacez vos pièces (CNI recto/verso, photo).",
      "« Mes profils » : basculez vers un autre profil actif (parent, élève) ou ajoutez-en un.",
    ],
    ["Remplacer un document remet votre profil professeur en attente de validation."],
  ),
};

/** Session role (normalizedUserRole of useAuth: professor, tutor, parent, student…) → help role. */
export const helpRoleFromSession = (role) => {
  const r = String(role || "").toLowerCase().replace(/^role_/, "");
  if (r === "professor" || r === "tutor" || r === "professeur") return "professeur";
  if (r === "parent") return "parent";
  if (r === "student" || r === "eleve") return "eleve";
  return null;
};

// Dashboard tab (URL section) → help page
const TAB_TO_PAGE = {
  dashboard: "dashboard",
  activities: "activites",
  classes: "classes",
  cours: "cours",
  courses: "mes-cours",
  "create-course": "creer-cours",
  "schedule-course": "programmer-cours",
  "manage-exercises": "exercices",
  devoirs: "devoirs",
  "schedule-exercise": "programmer-exercices",
  "corrections-exercise": "corrections",
  matieres: "matieres",
  "create-class": "creer-classe",
  "manage-class": "gerer-classe",
  students: "eleves",
  parents: "parents",
  professors: "professeurs",
  "my-children": "enfants",
  messages: "messages",
  notifications: "notifications",
  settings: "profil",
};

export const helpPageFromTab = (tab) => TAB_TO_PAGE[tab] || null;

export const getHelp = (role, page) => (role && page ? HELP_CONTENT[`${role}.${page}`] || null : null);

/** All help topics of a role: [{ key, page, title }]. */
export const listHelpTopics = (role) =>
  Object.entries(HELP_CONTENT)
    .filter(([key]) => key.startsWith(`${role}.`))
    .map(([key, v]) => ({ key, page: key.slice(role.length + 1), title: v.title }));
