import React, { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import { useTranslation } from "../../hooks/useTranslation";
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowLeft, 
  Share2, 
  Linkedin, 
  Twitter, 
  Facebook,
  Tag,
  ArrowRight,
  BookOpen,
  Lightbulb
} from "lucide-react";

/**
 * BlogSinglePage Component - Professional Blog Article Reader
 * Each blog post has unique content, proper translations, and responsive design
 */
export const BlogSinglePage = ({ theme }) => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const themeClasses = useMemo(() => {
    const isDark = theme === "dark";
    return {
      bg: isDark ? "bg-gray-900" : "bg-gray-50",
      text: isDark ? "text-gray-100" : "text-gray-900",
      subtext: isDark ? "text-gray-400" : "text-gray-600",
      cardBg: isDark ? "bg-gray-800/50" : "bg-white",
      border: isDark ? "border-gray-700" : "border-gray-200",
      accent: isDark ? "text-blue-400" : "text-blue-600",
      quoteBg: isDark ? "bg-blue-900/20" : "bg-blue-50"
    };
  }, [theme]);

  // Blog Post Content Database with unique content for each post
  const blogContent = useMemo(() => {
    const contentMap = {
      item1: {
        category: "Innovation",
        author: "Marie Dubois",
        date: "15 Nov 2024",
        readTime: "8",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=85",
        tags: ["Communication", "Digital", "Innovation"],
        quote: t("pages.blog.posts.post1.excerpt", "Découvrez comment les plateformes numériques transforment la façon dont les écoles se connectent avec les parents et les élèves."),
        sections: [
          {
            heading: "La Révolution Numérique dans l'Éducation",
            content: "Les établissements scolaires du monde entier adoptent des plateformes de communication numériques pour créer des liens plus forts entre enseignants, parents et élèves. Cette transformation ne concerne pas seulement la technologie - il s'agit de repenser fondamentalement la façon dont nous collaborons dans l'éducation."
          },
          {
            heading: "Impact sur l'Engagement des Parents",
            content: "Les études montrent que lorsque les parents sont activement impliqués dans l'éducation de leurs enfants grâce à une communication en temps réel, les résultats scolaires s'améliorent de manière significative. Les plateformes numériques permettent aux parents de rester informés des progrès, des événements et des défis, créant ainsi un véritable partenariat éducatif."
          },
          {
            heading: "Avantages pour les Enseignants",
            content: "Pour les enseignants, les outils de communication numériques rationalisent les tâches administratives, libérant plus de temps pour se concentrer sur l'enseignement. La possibilité de partager instantanément des mises à jour, des photos et des rapports de progrès transforme la relation enseignant-parent."
          }
        ]
      },
      item2: {
        category: "Pédagogie",
        author: "Pierre Martin",
        date: "28 Oct 2024",
        readTime: "7",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=85",
        tags: ["Apprentissage", "Distance", "Méthodologie"],
        quote: t("pages.blog.posts.post2.excerpt", "Nouvelles méthodologies qui transforment les expériences éducatives"),
        sections: [
          {
            heading: "L'Évolution de l'Apprentissage à Distance",
            content: "L'apprentissage à distance a évolué bien au-delà des simples cours vidéo. Les meilleures pratiques actuelles incluent des approches d'apprentissage mixte qui combinent l'enseignement synchrone et asynchrone, créant des expériences d'apprentissage plus flexibles et personnalisées."
          },
          {
            heading: "Engagement Actif des Élèves",
            content: "La clé du succès dans l'apprentissage virtuel réside dans le maintien de l'engagement des élèves. Cela signifie utiliser des outils interactifs, des activités de groupe, des sondages en direct et des discussions qui encouragent la participation active plutôt que l'écoute passive."
          },
          {
            heading: "Mesurer le Succès",
            content: "L'évaluation dans les environnements d'apprentissage à distance nécessite de nouvelles approches. Les évaluations formatives continues, les portfolios numériques et les projets collaboratifs offrent de meilleures perspectives sur l'apprentissage des élèves que les examens traditionnels."
          }
        ]
      },
      item3: {
        category: "Famille",
        author: "Sophie Laurent",
        date: "10 Oct 2024",
        readTime: "6",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=85",
        tags: ["Parents", "Soutien", "Maison"],
        quote: t("pages.blog.posts.post3.excerpt", "Comment les environnements collaboratifs améliorent la réussite des élèves"),
        sections: [
          {
            heading: "Créer un Espace d'Apprentissage Efficace",
            content: "L'environnement physique joue un rôle crucial dans l'apprentissage à domicile. Un espace calme, bien éclairé et organisé aide les enfants à se concentrer et à développer de bonnes habitudes d'étude. Cet espace n'a pas besoin d'être grand, mais il doit être cohérent et sans distractions."
          },
          {
            heading: "Établir des Routines Solides",
            content: "Les routines offrent structure et prévisibilité, essentielles pour un apprentissage efficace. Établir des heures régulières pour les devoirs, les pauses et le jeu aide les enfants à développer l'autodiscipline et la gestion du temps."
          },
          {
            heading: "Communication avec les Enseignants",
            content: "Un partenariat solide avec les enseignants est fondamental. Utilisez les plateformes de communication scolaire pour rester informé des progrès, des défis et des opportunités. N'hésitez pas à poser des questions et à partager des observations sur l'apprentissage de votre enfant."
          }
        ]
      },
      item4: {
        category: "Technologie",
        author: "Thomas Bernard",
        date: "5 Oct 2024",
        readTime: "9",
        image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=85",
        tags: ["EdTech", "Innovation", "Futur"],
        quote: t("pages.blog.posts.post4.excerpt", "Explorer les dernières tendances technologiques éducatives"),
        sections: [
          {
            heading: "L'IA dans l'Éducation",
            content: "L'intelligence artificielle transforme l'éducation en permettant un apprentissage personnalisé à grande échelle. Les systèmes d'IA peuvent adapter le contenu au niveau de chaque élève, identifier les lacunes dans l'apprentissage et fournir un soutien ciblé."
          },
          {
            heading: "Réalité Virtuelle et Augmentée",
            content: "Les technologies VR et AR créent des expériences d'apprentissage immersives impossibles dans les salles de classe traditionnelles. Les élèves peuvent explorer l'histoire ancienne, visiter des écosystèmes lointains ou manipuler des modèles moléculaires complexes."
          },
          {
            heading: "Analyse de Données Éducatives",
            content: "Les données permettent aux enseignants de prendre des décisions éclairées sur l'enseignement et l'apprentissage. Les tableaux de bord analytiques révèlent des modèles dans les performances des élèves, aidant à identifier tôt ceux qui pourraient avoir besoin de soutien supplémentaire."
          }
        ]
      },
      item5: {
        category: "Évaluation",
        author: "Aminata Diallo",
        date: "22 Sep 2024",
        readTime: "7",
        image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=85",
        tags: ["Évaluation", "Pédagogie", "Feedback"],
        quote: t("pages.blog.posts.post5.excerpt", "Approches innovantes pour évaluer les progrès des élèves"),
        sections: [
          {
            heading: "Au-delà des Examens Traditionnels",
            content: "L'évaluation moderne reconnaît que les tests standardisés ne capturent qu'une partie limitée de l'apprentissage des élèves. Les approches innovantes incluent des portfolios, des présentations, des projets collaboratifs et l'auto-évaluation des élèves."
          },
          {
            heading: "Feedback Formatif Continu",
            content: "Le feedback régulier et constructif est plus efficace que les évaluations sommatives occasionnelles. En fournissant des commentaires fréquents et spécifiques, les enseignants aident les élèves à comprendre leurs forces et les domaines à améliorer."
          },
          {
            heading: "Évaluation par les Pairs",
            content: "Encourager les élèves à évaluer le travail de leurs pairs développe des compétences de pensée critique et approfondit leur propre compréhension. Cette approche favorise également la collaboration et la communauté d'apprentissage."
          }
        ]
      },
      item6: {
        category: "Partenariat",
        author: "Jean Koffi",
        date: "14 Sep 2024",
        readTime: "8",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=85",
        tags: ["Collaboration", "Communication", "Réussite"],
        quote: t("pages.blog.posts.post6.excerpt", "Comment une collaboration efficace améliore la réussite des élèves"),
        sections: [
          {
            heading: "Fondements d'un Partenariat Solide",
            content: "Un partenariat efficace entre parents et enseignants repose sur une communication ouverte, le respect mutuel et des objectifs partagés. Lorsque parents et enseignants travaillent ensemble, les élèves bénéficient d'un système de soutien cohérent."
          },
          {
            heading: "Communication Bidirectionnelle",
            content: "Le meilleur partenariat va au-delà des bulletins scolaires. Il comprend des conversations régulières sur les forces, les défis et le bien-être général de l'élève. Les plateformes numériques facilitent cette communication continue."
          },
          {
            heading: "Impact sur la Réussite des Élèves",
            content: "La recherche montre que les élèves dont les parents et les enseignants collaborent efficacement ont de meilleurs résultats académiques, une meilleure estime de soi et de meilleures compétences sociales. Ce partenariat crée un environnement optimal pour l'apprentissage."
          }
        ]
      }
    };

    const data = contentMap[id] || contentMap.item1;
    const postKey = `pages.blog.posts.post${id?.replace('item', '') || '1'}`;
    
    return {
      ...data,
      title: t(`${postKey}.title`, data.title || "Article de blog"),
      category: t(`${postKey}.category`, data.category),
      author: t(`${postKey}.author`, data.author),
      date: t(`${postKey}.date`, data.date)
    };
  }, [id, t]);

  // Related articles
  const relatedArticles = useMemo(() => {
    const allIds = ["item1", "item2", "item3", "item4", "item5", "item6"];
    return allIds
      .filter(itemId => itemId !== id)
      .slice(0, 2)
      .map(itemId => {
        const postNum = itemId.replace('item', '');
        return {
          id: itemId,
          title: t(`pages.blog.posts.post${postNum}.title`, "Article connexe" ),
          date: t(`pages.blog.posts.post${postNum}.date`, "2024"),
          img: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1524178232363-1fb2b075b655' : '1427504494785-3a9ca7044f45'}?w=400&q=80`
        };
      });
  }, [id, t]);

  return (
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-500`}>
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Header Navigation */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 max-w-4xl">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/schoolchat/blog")}
          className={`flex items-center gap-2 ${themeClasses.subtext} hover:${themeClasses.accent} transition-colors font-semibold text-sm group`}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t("common.actions.back", "Retour")}
        </motion.button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Category Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase rounded-full">
              {blogContent.category}
            </span>
            <span className={`flex items-center gap-1 text-sm ${themeClasses.subtext}`}>
              <Clock className="w-4 h-4" />
              {blogContent.readTime} min
            </span>
          </div>

          {/* Title */}
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-6 ${themeClasses.text} leading-tight`}>
            {blogContent.title}
          </h1>

          {/* Meta Info */}
          <div className={`flex flex-wrap items-center gap-4 mb-8 ${themeClasses.subtext} text-sm`}>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {blogContent.author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {blogContent.date}
            </div>
          </div>

          {/* Featured Image */}
          <div className={`relative rounded-2xl overflow-hidden ${themeClasses.border} border shadow-2xl mb-8`}>
            <img 
              src={blogContent.image}
              alt={blogContent.title}
              className="w-full h-64 sm:h-96 object-cover"
              loading="eager"
            />
          </div>
        </motion.div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl mb-16">
        <div className="grid lg:grid-cols-[1fr_300px] gap-12">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Opening Quote */}
            <div className={`${themeClasses.quoteBg} ${themeClasses.border} border-l-4 border-l-blue-600 p-6 rounded-r-xl mb-8`}>
              <Lightbulb className="w-6 h-6 text-blue-600 mb-3" />
              <p className={`${themeClasses.text} text-lg italic font-medium leading-relaxed`}>
                "{blogContent.quote}"
              </p>
            </div>

            {/* Article Sections */}
            <div className="space-y-8">
              {blogContent.sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${themeClasses.text}`}>
                    {section.heading}
                  </h2>
                  <p className={`${themeClasses.subtext} text-base sm:text-lg leading-relaxed`}>
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t ${themeClasses.border}">
              <div className="flex flex-wrap items-center gap-3">
                <Tag className={`w-5 h-5 ${themeClasses.subtext}`} />
                {blogContent.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className={`px-3 py-1 ${themeClasses.cardBg} ${themeClasses.border} border rounded-full text-sm font-semibold ${themeClasses.text}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mt-8">
              <p className={`text-sm font-bold uppercase tracking-wide mb-4 ${themeClasses.subtext}`}>
                {t("common.share", "Partager")}
              </p>
              <div className="flex gap-3">
                {[
                  { icon: <Twitter className="w-4 h-4" />, color: "hover:bg-blue-500" },
                  { icon: <Facebook className="w-4 h-4" />, color: "hover:bg-blue-600" },
                  { icon: <Linkedin className="w-4 h-4" />, color: "hover:bg-blue-700" }
                ].map((social, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 ${themeClasses.cardBg} ${themeClasses.border} border rounded-xl text-white ${social.color} transition-all`}
                  >
                    {social.icon}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Related Articles */}
            <div className={`${themeClasses.cardBg} ${themeClasses.border} border rounded-2xl p-6`}>
              <h3 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>
                {t("pages.blogSingle.related", "Articles Similaires")}
              </h3>
              <div className="space-y-4">
                {relatedArticles.map((article, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    onClick={() => navigate(`/schoolchat/blog/${article.id}`)}
                    className="flex gap-4 cursor-pointer group"
                  >
                    <div className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ${themeClasses.border} border`}>
                      <img src={article.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${themeClasses.text} group-hover:${themeClasses.accent} transition-colors line-clamp-2`}>
                        {article.title}
                      </h4>
                      <p className={`text-xs ${themeClasses.subtext} mt-1`}>{article.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className={`bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white`}>
              <BookOpen className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-bold mb-2">
                {t("pages.blogSingle.cta.title", "Prêt à transformer votre école ?")}
              </h3>
              <p className="text-sm text-blue-100 mb-4">
                {t("pages.blogSingle.cta.subtitle", "Découvrez nos solutions")}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/schoolchat/courses")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all"
              >
                {t("pages.blogSingle.cta.button", "Découvrir")}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default BlogSinglePage;
