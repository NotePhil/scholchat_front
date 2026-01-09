// demoData.js
export const demoUsers = [
  {
    id: 1,
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@example.com",
    type: "professeur",
    role: "TEACHER",
    classes: [1, 2], // Classes this teacher can publish to
    accessClasses: [1, 2, 3] // Classes this user can access
  },
  {
    id: 2,
    nom: "Martin",
    prenom: "Sophie",
    email: "sophie.martin@example.com",
    type: "professeur",
    role: "TEACHER",
    classes: [3],
    accessClasses: [1, 3]
  },
  {
    id: 3,
    nom: "Bernard",
    prenom: "Luc",
    email: "luc.bernard@example.com",
    type: "eleve",
    role: "STUDENT",
    classes: [1],
    accessClasses: [1]
  },
  {
    id: 4,
    nom: "Petit",
    prenom: "Emma",
    email: "emma.petit@example.com",
    type: "eleve",
    role: "STUDENT",
    classes: [2],
    accessClasses: [2]
  },
  {
    id: 5,
    nom: "Durand",
    prenom: "Pierre",
    email: "pierre.durand@example.com",
    type: "parent",
    role: "PARENT",
    classes: [1],
    accessClasses: [1]
  }
];

export const demoClasses = [
  {
    id: 1,
    nom: "6ème A",
    niveau: "6ème",
    professeurs: [1], // Teacher IDs
    eleves: [3, 5] // Student and parent IDs
  },
  {
    id: 2,
    nom: "5ème B",
    niveau: "5ème",
    professeurs: [1],
    eleves: [4]
  },
  {
    id: 3,
    nom: "4ème C",
    niveau: "4ème",
    professeurs: [2],
    eleves: []
  }
];

export const demoMessages = [
  {
    id: 1,
    objet: "Réunion parents-professeurs",
    contenu: "Bonjour, la réunion parents-professeurs aura lieu le 15 juin à 18h.",
    dateCreation: "2023-05-20T10:30:00",
    expediteur: {
      id: 1,
      nom: "Dupont Jean",
      email: "jean.dupont@example.com",
      role: "TEACHER"
    },
    destinataires: [
      {
        id: 3,
        nom: "Bernard Luc",
        email: "luc.bernard@example.com",
        role: "STUDENT"
      },
      {
        id: 5,
        nom: "Durand Pierre",
        email: "pierre.durand@example.com",
        role: "PARENT"
      }
    ],
    read: false,
    starred: true,
    classes: [1],
    isGeneral: false
  },
  {
    id: 2,
    objet: "Devoir de mathématiques",
    contenu: "Le devoir de mathématiques est à rendre pour le 10 juin.",
    dateCreation: "2023-05-18T14:15:00",
    expediteur: {
      id: 1,
      nom: "Dupont Jean",
      email: "jean.dupont@example.com",
      role: "TEACHER"
    },
    destinataires: [
      {
        id: 4,
        nom: "Petit Emma",
        email: "emma.petit@example.com",
        role: "STUDENT"
      }
    ],
    read: true,
    starred: false,
    classes: [2],
    isGeneral: true
  },
  {
    id: 3,
    objet: "Sortie scolaire",
    contenu: "La sortie scolaire au musée est prévue pour le 8 juin.",
    dateCreation: "2023-05-15T09:00:00",
    expediteur: {
      id: 2,
      nom: "Martin Sophie",
      email: "sophie.martin@example.com",
      role: "TEACHER"
    },
    destinataires: [],
    read: false,
    starred: false,
    classes: [3],
    isGeneral: true
  }
];