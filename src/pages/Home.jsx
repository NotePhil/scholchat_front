import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBell,
  faBookOpen,
  faChalkboardUser,
  faCheck,
  faClipboardList,
  faComments,
  faEnvelopeOpenText,
  faKey,
  faLayerGroup,
  faPeopleRoof,
  faSchool,
  faShieldHalved,
  faUserCheck,
  faUserGraduate,
  faUserGroup,
  faUsers,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "../components/frontoffice/ui";
import { StoreBadges } from "../components/frontoffice/StoreBadges";
import { scrollToSection } from "../components/common/Header";
import community from "../assets/illustrations/community.png";
import onboarding1 from "../assets/illustrations/onboarding-1.png";
import onboarding2 from "../assets/illustrations/onboarding-2.png";
import onboarding3 from "../assets/illustrations/onboarding-3.png";
import onboarding4 from "../assets/illustrations/onboarding-4.png";

const FEATURES = [
  { icon: faSchool, color: "#8C52FF", title: "Classes", text: "Créez ou rejoignez une classe avec un code. Demandes approuvées par le professeur." },
  { icon: faBookOpen, color: "#3B82F6", title: "Cours", text: "Cours riches avec chapitres, images, vidéos et documents. Planification des leçons." },
  { icon: faVideo, color: "#10B981", title: "Sessions en direct", text: "Visioconférence en temps réel avec chapitres et présence." },
  { icon: faClipboardList, color: "#F59E0B", title: "Exercices & devoirs", text: "QCM, vrai/faux, questions ouvertes, pièces jointes. Corrections et notes." },
  { icon: faComments, color: "#4F46E5", title: "Messagerie", text: "Chat en temps réel avec photos, vidéos et fichiers." },
  { icon: faBell, color: "#EF4444", title: "Fil d'actualité & notifications", text: "Événements, sorties, annonces. Notifications instantanées." },
  { icon: faUserGroup, color: "#8C52FF", title: "Parents", text: "Suivez plusieurs enfants, depuis un seul compte." },
  { icon: faLayerGroup, color: "#3B82F6", title: "Multi-profil", text: "Un compte, plusieurs rôles. Changez à tout moment." },
];

const SHOWCASE = [
  { img: onboarding1, title: "Vos classes et cours au même endroit" },
  { img: onboarding2, title: "Sessions en direct et devoirs" },
  { img: onboarding3, title: "Messagerie et notifications en temps réel" },
  { img: onboarding4, title: "Parents : suivez tous vos enfants" },
];

const ROLES = [
  {
    role: "professeur",
    icon: faChalkboardUser,
    color: "#8C52FF",
    title: "Professeur",
    text: "Enseignez, partagez et suivez vos élèves. Créez vos classes, vos cours et vos devoirs.",
  },
  {
    role: "eleve",
    icon: faUserGraduate,
    color: "#3B82F6",
    title: "Élève",
    text: "Apprenez, progressez et réussissez. Rejoignez votre classe avec le code de votre professeur.",
  },
  {
    role: "parent",
    icon: faUsers,
    color: "#10B981",
    title: "Parent",
    text: "Suivez vos enfants et communiquez avec les enseignants, depuis un seul compte.",
  },
];

const STEPS = [
  { icon: faKey, title: "Obtenez le code de classe", text: "Il vous est fourni par le professeur ou l'établissement." },
  { icon: faUserCheck, title: "Créez votre compte", text: "Vos informations, le code de la classe, puis confirmation." },
  { icon: faShieldHalved, title: "Validation du professeur", text: "Le professeur de la classe approuve votre demande." },
  { icon: faEnvelopeOpenText, title: "Connectez-vous", text: "Vous recevez vos identifiants par e-mail, sur le web comme sur mobile." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } }),
};

const SectionTitle = ({ eyebrow, title, text }) => (
  <div className="text-center max-w-2xl mx-auto mb-12">
    {eyebrow && (
      <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#8C52FF] mb-3">{eyebrow}</span>
    )}
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">{title}</h2>
    {text && <p className="mt-4 text-slate-500 dark:text-slate-400">{text}</p>}
  </div>
);

export const Home = ({ theme }) => {
  const location = useLocation();

  // Header links point to "/#section": scroll there once the page is rendered.
  useEffect(() => {
    const id = location.hash ? location.hash.slice(1) : null;
    if (!id) return undefined;
    const timer = setTimeout(() => scrollToSection(id), 350);
    return () => clearTimeout(timer);
  }, [location.hash, location.key]);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        {/* ───────── Hero ───────── */}
        <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#8C52FF]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full bg-[#3B82F6]/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-[#4F46E5] dark:text-indigo-300 px-3 py-1 text-xs font-semibold mb-5">
                <FontAwesomeIcon icon={faPeopleRoof} /> L'école connectée, partout.
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
                Connectez votre école, vos élèves et vos{" "}
                <span className="bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] bg-clip-text text-transparent">familles</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl">
                ScholChat simplifie la communication, l'apprentissage et la gestion scolaire. Une seule plateforme pour tous.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button to="/schoolchat/signup" icon={faArrowRight}>
                  Créer un compte
                </Button>
                <Button to="/schoolchat/login" variant="secondary">
                  Se connecter
                </Button>
              </div>
              <StoreBadges className="mt-8" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/30" />
              <img src={community} alt="Professeur, élèves et parents réunis autour de ScholChat" className="relative w-full max-w-xl mx-auto" />
            </motion.div>
          </div>
        </section>

        {/* ───────── Fonctionnalités ───────── */}
        <section id="fonctionnalites" className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-900/60 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Fonctionnalités"
              title="Une plateforme complète, pour tous les acteurs"
              text="Professeurs, élèves et parents partagent le même espace : classes, cours, sessions en direct, devoirs et messagerie."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all"
                >
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg mb-4"
                    style={{ background: f.color }}
                  >
                    <FontAwesomeIcon icon={f.icon} />
                  </span>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SHOWCASE.map((s, i) => (
                <motion.figure
                  key={s.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-center"
                >
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-800 dark:to-indigo-950/60 p-3 mb-3">
                    <img src={s.img} alt="" className="w-full h-40 object-contain" loading="lazy" />
                  </div>
                  <figcaption className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.title}</figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Pour qui ───────── */}
        <section className="py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Je suis…" title="Un espace adapté à chaque profil" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ROLES.map((r) => (
                <Link
                  key={r.role}
                  to={`/schoolchat/signup?role=${r.role}`}
                  className="group rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center hover:border-[#8C52FF]/50 hover:shadow-lg transition-all"
                >
                  <span
                    className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl mb-4"
                    style={{ background: r.color }}
                  >
                    <FontAwesomeIcon icon={r.icon} />
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{r.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{r.text}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] dark:text-indigo-300">
                    Créer mon compte <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Comment ça marche (élèves / parents) ───────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-br from-[#4F46E5] to-[#8C52FF] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold">Élèves et parents : rejoignez votre classe en 4 étapes</h2>
              <p className="mt-3 text-indigo-100">Votre inscription est rattachée à une classe grâce à son code.</p>
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl bg-white/10 backdrop-blur p-5 border border-white/15">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-full bg-white text-[#4F46E5] font-bold flex items-center justify-center">{i + 1}</span>
                    <FontAwesomeIcon icon={s.icon} className="text-xl text-indigo-100" />
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-indigo-100">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── Tarifs ───────── */}
        <section id="tarifs" className="py-16 lg:py-24 scroll-mt-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Tarifs"
              title="Des offres adaptées à chaque classe"
              text="Les professeurs et les établissements choisissent l'offre de leurs classes ; élèves et parents en profitent directement."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Élèves et parents</h3>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Inclus avec la classe</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {["Accès aux classes approuvées", "Cours, devoirs et sessions en direct", "Messagerie et notifications", "Suivi de plusieurs enfants"].map((x) => (
                    <li key={x} className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheck} className="text-[#10B981]" /> {x}
                    </li>
                  ))}
                </ul>
                <Button to="/schoolchat/signup" variant="secondary" className="mt-6 w-full">
                  Créer un compte
                </Button>
              </div>
              <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-[#4F46E5] to-[#8C52FF] shadow-xl shadow-indigo-500/20">
                <h3 className="text-lg font-semibold">Professeurs et établissements</h3>
                <p className="mt-1 text-2xl font-bold">Mensuel ou annuel</p>
                <ul className="mt-5 space-y-2 text-sm text-indigo-50">
                  {["Création de classes et de cours", "Sessions en direct et exercices", "Gestion des demandes d'accès", "Offres renouvelables"].map((x) => (
                    <li key={x} className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheck} /> {x}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/schoolchat/functionalities"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#4F46E5] px-6 py-3 font-semibold hover:bg-indigo-50"
                >
                  Voir les offres <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── À propos ───────── */}
        <section id="a-propos" className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-900/60 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
            <img src={onboarding4} alt="Une famille suit la scolarité de ses enfants sur ScholChat" className="w-full max-w-md mx-auto" loading="lazy" />
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#8C52FF] mb-3">À propos</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Rapprocher l'école et les familles</h2>
              <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                ScholChat réunit professeurs, élèves et parents dans un espace sécurisé : chaque inscription à une classe est
                validée par son professeur, et chaque parent suit la scolarité de ses enfants en temps réel, sur le web comme
                sur mobile.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button to="/schoolchat/about" variant="secondary">
                  En savoir plus
                </Button>
                <Button to="/schoolchat/contact" variant="ghost">
                  Nous contacter
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── CTA ───────── */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-900 dark:bg-slate-900 border border-slate-800 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Prêt à connecter votre classe ?</h2>
                <p className="mt-2 text-slate-400">Créez votre compte gratuitement, puis retrouvez ScholChat sur mobile.</p>
              </div>
              <div className="flex flex-col items-center lg:items-end gap-4">
                <Button to="/schoolchat/signup" icon={faArrowRight}>
                  Créer un compte
                </Button>
                <StoreBadges compact />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
