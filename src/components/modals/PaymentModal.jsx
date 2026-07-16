import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Shield,
  Lock,
  CreditCard,
  Smartphone,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  Receipt,
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    key: "orange",
    label: "Orange Money",
    desc: "Paiement mobile",
    icon: Smartphone,
    ring: "ring-orange-500",
    grad: "from-orange-500 to-amber-500",
  },
  {
    key: "mtn",
    label: "MTN Mobile Money",
    desc: "Paiement mobile",
    icon: Smartphone,
    ring: "ring-yellow-400",
    grad: "from-yellow-400 to-amber-400",
  },
  {
    key: "card",
    label: "Carte bancaire",
    desc: "Visa, Mastercard",
    icon: CreditCard,
    ring: "ring-blue-500",
    grad: "from-blue-600 to-indigo-600",
  },
];

const formatCard = (field, value) => {
  if (field === "number") return value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);
  if (field === "expiry") return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
  if (field === "cvv") return value.replace(/\D/g, "").slice(0, 4);
  return value;
};

/**
 * Modale de paiement simulé, partagée par tous les flux d'offre/forfait (création de classe,
 * création d'établissement, prolongation/changement d'offre, renouvellement). Un seul composant
 * pour un rendu cohérent, professionnel et responsive (mobile-first) partout dans l'app.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {(paymentInfo: object) => void} onSuccess - reçoit { paymentMethod, amount, ... }
 * @param {number} montant
 * @param {string} title - ex: "Paiement sécurisé"
 * @param {string} label - ce qui est payé, ex: nom de l'offre
 * @param {string} [subLabel] - détail secondaire, ex: "Périodicité mensuelle"
 * @param {boolean} [isDark]
 */
const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  montant = 0,
  title = "Paiement sécurisé",
  label = "Souscription à l'offre",
  subLabel = "",
  isDark = false,
}) => {
  const [step, setStep] = useState(1); // 1 methode, 2 details, 3 traitement, 4 succes
  const [method, setMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMethod("");
      setPhone("");
      setPhoneError("");
      setCard({ number: "", expiry: "", cvv: "", name: "" });
      setCardErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cardBg = isDark ? "bg-gray-800" : "bg-white";
  const textMain = isDark ? "text-gray-100" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const border = isDark ? "border-gray-700" : "border-gray-200";
  const inputBg = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900";
  const summaryBg = isDark ? "bg-gray-900/60" : "bg-gray-50";

  const handleSubmit = () => {
    if (method === "orange" || method === "mtn") {
      const cleaned = phone.replace(/\s/g, "");
      if (!/^[6-9][0-9]{8}$/.test(cleaned)) {
        setPhoneError("Numéro invalide — 9 chiffres, ex : 699999999");
        return;
      }
      setStep(3);
      setTimeout(() => {
        setStep(4);
        setTimeout(() => onSuccess({
          paymentMethod: method === "orange" ? "OM" : "MOMO",
          phoneNumber: `+237${cleaned}`,
          amount: montant,
        }), 900);
      }, 1600);
      return;
    }

    const errs = {};
    if (card.number.replace(/\s/g, "").length !== 16) errs.number = "16 chiffres requis";
    if (!card.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) errs.expiry = "Format MM/AA";
    if (!card.cvv.match(/^\d{3,4}$/)) errs.cvv = "3 ou 4 chiffres";
    if (!card.name.trim()) errs.name = "Nom requis";
    if (Object.keys(errs).length) {
      setCardErrors(errs);
      return;
    }
    setStep(3);
    setTimeout(() => {
      setStep(4);
      setTimeout(() => onSuccess({
        paymentMethod: "CARD",
        cardNumber: card.number.replace(/\s/g, ""),
        expiryDate: card.expiry,
        cvv: card.cvv,
        cardHolderName: card.name,
        amount: montant,
      }), 900);
    }, 1600);
  };

  const selectedMethod = PAYMENT_METHODS.find((m) => m.key === method);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && step !== 3 && onClose()}
      >
        <motion.div
          key="sheet"
          initial={{ y: 80, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className={`relative w-full sm:max-w-md max-h-[92vh] sm:max-h-[88vh] overflow-y-auto ${cardBg}
            rounded-t-3xl sm:rounded-3xl shadow-2xl border ${border}`}
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className={`h-1.5 w-10 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
          </div>

          {/* Header */}
          <div className="relative px-5 sm:px-6 pt-4 sm:pt-6 pb-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 sm:rounded-t-3xl overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-base sm:text-lg truncate">{title}</h3>
                  <p className="text-blue-100 text-xs sm:text-sm truncate">{label}</p>
                </div>
              </div>
              {step !== 3 && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5 sm:py-6">
            {/* Order summary */}
            <div className={`rounded-2xl ${summaryBg} border ${border} p-4 mb-5 flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${textMain}`}>{label}</p>
                {subLabel && <p className={`text-xs ${textMuted} truncate`}>{subLabel}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-bold ${textMain}`}>{montant.toLocaleString("fr-FR")}</p>
                <p className={`text-[11px] ${textMuted} -mt-0.5`}>FCFA</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-2.5">
                  <p className={`text-sm font-medium ${textMain} mb-3`}>Choisissez votre méthode de paiement</p>
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => { setMethod(m.key); setStep(2); }}
                        className={`w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all text-left
                          ${isDark ? "border-gray-700 hover:border-gray-500 active:bg-gray-700/50" : "border-gray-200 hover:border-gray-300 active:bg-gray-50"}
                          hover:shadow-md`}
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold ${textMain}`}>{m.label}</p>
                          <p className={`text-xs ${textMuted}`}>{m.desc}</p>
                        </div>
                        <ChevronLeft className={`w-4 h-4 rotate-180 ${textMuted}`} />
                      </button>
                    );
                  })}
                  <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${border} text-xs ${textMuted}`}>
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    Paiement simulé à des fins de démonstration — aucune donnée réelle n'est transmise.
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={`flex items-center gap-1 text-xs font-medium ${textMuted} hover:${textMain} mb-1`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Changer de méthode
                  </button>

                  {(method === "orange" || method === "mtn") ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedMethod.grad} flex items-center justify-center`}>
                          <Smartphone className="w-4 h-4 text-white" />
                        </div>
                        <p className={`text-sm font-semibold ${textMain}`}>{selectedMethod.label}</p>
                      </div>
                      <label className={`block text-xs font-medium ${textMuted} mb-1.5`}>Numéro de téléphone *</label>
                      <div className="relative">
                        <Smartphone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoFocus
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 9)); setPhoneError(""); }}
                          placeholder="6XX XX XX XX"
                          className={`w-full pl-11 pr-4 py-3.5 text-[16px] border rounded-xl ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 ${phoneError ? "border-red-500" : ""}`}
                        />
                      </div>
                      {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
                      <div className={`p-3 rounded-xl text-xs ${isDark ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                        💡 Une demande de confirmation sera envoyée sur ce numéro pour valider {montant.toLocaleString("fr-FR")} FCFA.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-xs font-medium ${textMuted} mb-1.5`}>Numéro de carte *</label>
                        <div className="relative">
                          <CreditCard className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                          <input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            value={card.number}
                            onChange={(e) => setCard((p) => ({ ...p, number: formatCard("number", e.target.value) }))}
                            placeholder="1234 5678 9012 3456"
                            className={`w-full pl-11 pr-4 py-3.5 text-[16px] border rounded-xl ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 ${cardErrors.number ? "border-red-500" : ""}`}
                          />
                        </div>
                        {cardErrors.number && <p className="text-xs text-red-600 mt-1">{cardErrors.number}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-xs font-medium ${textMuted} mb-1.5`}>Expiration *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={card.expiry}
                            onChange={(e) => setCard((p) => ({ ...p, expiry: formatCard("expiry", e.target.value) }))}
                            placeholder="MM/AA"
                            className={`w-full px-4 py-3.5 text-[16px] border rounded-xl ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 ${cardErrors.expiry ? "border-red-500" : ""}`}
                          />
                          {cardErrors.expiry && <p className="text-xs text-red-600 mt-1">{cardErrors.expiry}</p>}
                        </div>
                        <div>
                          <label className={`block text-xs font-medium ${textMuted} mb-1.5`}>CVV *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={card.cvv}
                            onChange={(e) => setCard((p) => ({ ...p, cvv: formatCard("cvv", e.target.value) }))}
                            placeholder="123"
                            className={`w-full px-4 py-3.5 text-[16px] border rounded-xl ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 ${cardErrors.cvv ? "border-red-500" : ""}`}
                          />
                          {cardErrors.cvv && <p className="text-xs text-red-600 mt-1">{cardErrors.cvv}</p>}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textMuted} mb-1.5`}>Nom sur la carte *</label>
                        <input
                          type="text"
                          value={card.name}
                          onChange={(e) => setCard((p) => ({ ...p, name: e.target.value.toUpperCase() }))}
                          placeholder="JEAN DUPONT"
                          className={`w-full px-4 py-3.5 text-[16px] border rounded-xl ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 ${cardErrors.name ? "border-red-500" : ""}`}
                        />
                        {cardErrors.name && <p className="text-xs text-red-600 mt-1">{cardErrors.name}</p>}
                      </div>
                      <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${isDark ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" /> Paiement sécurisé — données chiffrées (SSL)
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    Payer {montant.toLocaleString("fr-FR")} FCFA
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 mb-5">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/40" />
                    <Loader2 className="absolute inset-0 w-16 h-16 text-blue-600 animate-spin" strokeWidth={2.5} />
                  </div>
                  <p className={`font-semibold ${textMain}`}>Traitement du paiement…</p>
                  <p className={`text-sm ${textMuted} mt-1`}>
                    {method === "card" ? "Vérification de la carte en cours" : "Validation via mobile money en cours"}
                  </p>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10 flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5"
                  >
                    <CheckCircle2 className="w-9 h-9 text-green-600" />
                  </motion.div>
                  <p className={`font-semibold text-lg ${textMain}`}>Paiement accepté !</p>
                  <p className={`text-sm ${textMuted} mt-1`}>Activation en cours…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
