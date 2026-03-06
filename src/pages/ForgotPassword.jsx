import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  LockKeyhole
} from "lucide-react";
import ForgotPasswordService from "../services/forgotPassword";
import logoImage from "../components/assets/images/logo.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request"); // "request" or "confirmation"

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (message.text) setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await ForgotPasswordService.requestPasswordReset(email);
      setStep("confirmation");
      setMessage({
        text: "Instructions envoyées! Vérifiez votre boîte de réception.",
        type: "success",
      });
    } catch (error) {
      console.error("Erreur lors de la demande:", error);
      setMessage({
        text: "Erreur lors de l'envoi des instructions. Veuillez réessayer plus tard.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-down">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-10 text-center relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <LockKeyhole size={120} />
            </div>
            
            <div className="relative inline-block mb-6 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white rounded-2xl p-4 shadow-xl">
                <img src={logoImage} alt="ScholChat Logo" className="h-12 w-auto" />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {step === "request" ? "Mot de passe oublié" : "Vérifiez votre email"}
            </h1>
            <p className="text-blue-100 mt-2 text-sm font-medium opacity-80">
              {step === "request"
                ? "Entrez votre e-mail pour réinitialiser votre accès"
                : "Un lien de réinitialisation a été envoyé"}
            </p>
          </div>

          <div className="p-8 sm:p-10">
            {step === "request" ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {message.text && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${
                    message.type === "error" 
                      ? "bg-red-50 text-red-800 border border-red-100" 
                      : "bg-green-50 text-green-800 border border-green-100"
                  }`}>
                    {message.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Adresse e-mail
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="exemple@email.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </div>
                  ) : (
                    "Envoyer les instructions"
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6 py-4 animate-fade-in">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50/50">
                  <CheckCircle2 className="text-green-600" size={40} />
                </div>
                
                <div className="space-y-3">
                  <p className="text-gray-600 leading-relaxed">
                    Si un compte existe avec l'adresse <span className="font-bold text-gray-900">{email}</span>, 
                    vous recevrez un email avec les instructions très prochainement.
                  </p>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-800 text-sm">
                    Pensez à vérifier votre dossier <span className="font-bold underline">Spam</span> si vous ne recevez rien d'ici quelques minutes.
                  </div>
                </div>

                <button
                  onClick={() => setStep("request")}
                  className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                >
                  Ressayer avec une autre adresse
                </button>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-gray-100 text-center">
              <button
                onClick={() => navigate("/schoolchat/login")}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold transition-all group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-10 font-medium tracking-widest uppercase">
          &copy; {new Date().getFullYear()} ScholChat. Accès sécurisé.
        </p>
      </div>

      <style jsx>{`
        @keyframes animate-fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes animate-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-down {
          animation: animate-fade-in-down 0.8s ease-out;
        }
        .animate-fade-in {
          animation: animate-fade-in 0.6s ease-in;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
