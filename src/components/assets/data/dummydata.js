export const LinkData = [
  {
    id: 1,
    title: "accueil",
    url: "/",
  },
  {
    id: 2,
    title: "À propos",
    url: "/schoolchat/about",
  },
  {
    id: 3,
    title: "Nos produits",
    isSelect: true,
    options: [
      { id: 1, title: "Nos tarifs", url: "/functionalities" },
      { id: 2, title: "Crèches", url: "/instructor" },
      { id: 3, title: "écoles maternelles", url: "/courses" },
      { id: 4, title: "écoles primaires", url: "/courses" },
      { id: 5, title: "lycées", url: "/courses" },
    ],
  },
  {
    id: 5,
    title: "FAQ",
    url: "/schoolchat/blog",
  },
];

// Updated product categories for the courses section
export const courses = [
  {
    id: 1,
    cover: "../images/nos-tarifs.jpg",
    title: "Nos tarifs",
  },
  {
    id: 2,
    cover: "../images/creches.jpg",
    title: "Crèches",
  },
  {
    id: 3,
    cover: "../images/ecoles-maternelles.jpg",
    title: "Écoles maternelles",
  },
  {
    id: 4,
    cover: "../images/ecoles-primaires.jpg",
    title: "Écoles primaires",
  },
  {
    id: 5,
    cover: "../images/lycees.jpg",
    title: "Lycées",
  },
];
