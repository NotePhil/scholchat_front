import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Check, 
  ArrowLeft, 
  Mail, 
  RefreshCw,
  Loader2,
  LockKeyhole,
  CheckCircle2
} from "lucide-react";
import ForgotPasswordService from "../services/forgotPassword";
import logoImage from "../components/assets/images/logo.png";
import { useTranslation } from "../hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [success, setSuccess] = useState(false);
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    localStorage.clear();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");

    // Premium validation sequence
    const timer = setTimeout(() => {
      if (token) {
        setFormData((prev) => ({ ...prev, token }));
        setIsValidating(false);
      } else {
        setIsValidating(false);
        setMessage({
          text: t('forgot_password.invalid_link', "Lien de réinitialisation invalide ou expiré."),
          type: "error",
        });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [location.search, t]);

  const checkPasswordStrength = (pass) => {
    setPasswordRules({
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") checkPasswordStrength(value);
    if (message.text) setMessage({ text: "", type: "" });
  };

  const validateForm = () => {
    if (!formData.token) {
      setMessage({ text: t('forgot_password.invalid_token', "Lien de réinitialisation invalide."), type: "error" });
      return false;
    }
    if (!Object.values(passwordRules).every(Boolean)) {
      setMessage({ text: t('forgot_password.password_weak', "Le mot de passe ne respecte pas les critères de sécurité."), type: "error" });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: t('forgot_password.password_mismatch', "Les mots de passe ne correspondent pas."), type: "error" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await ForgotPasswordService.resetPassword({
        token: formData.token,
        password: formData.password
      });
      
      if (result) {
        localStorage.clear();
        setSuccess(true);
        setMessage({
          text: t('forgot_password.reset_success', "Votre mot de passe a été réinitialisé avec succès !"),
          type: "success",
        });
        setTimeout(() => navigate("/schoolchat/login", { replace: true }), 3000);
      } else {
        throw new Error("Échec de la réinitialisation.");
      }
    } catch (err) {
      setMessage({
        text: err.message || t('forgot_password.reset_error', "Une erreur s'est produite. Veuillez réessayer."),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1d] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] rounded-full animate-pulse style={{ animationDelay: '2s' }}" />
      </div>

      <AnimatePresence mode="wait">
        {isValidating ? (
          <motion.div
            key="validating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 border-r-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                  <LockKeyhole className="w-10 h-10 text-blue-400 animate-pulse" />
                </div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-4xl font-black text-white tracking-tight">
                Authentification Sécurisée
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
              <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed italic">
                Nous vérifions l'intégrité de votre jeton de réinitialisation et établissons une liaison cryptée de bout en bout...
              </p>
            </motion.div>

            <div className="mt-12 flex items-center gap-2 px-6 py-2.5 bg-white/5 rounded-full border border-white/10">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-xs font-bold text-blue-100 uppercase tracking-[0.2em]">Initialisation SSL...</span>
            </div>
          </motion.div>
        ) : success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full mx-4 p-10 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl text-center"
          >
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Access Restored</h2>
            <p className="text-slate-400 mb-10 text-lg">
              Your password has been successfully updated. Secure access to your account is now available.
            </p>
            <div className="space-y-4">
               <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest">Redirecting to Login</p>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                />
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full mx-4 relative"
          >
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <KeyRound size={120} />
                </div>
                
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full"></div>
                  <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                    <img src={logoImage} alt="ScholChat" className="h-12 w-auto" />
                  </div>
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2">New Password</h1>
                <p className="text-blue-100/70 font-medium italic">Create a strong multi-layered security key</p>
              </div>

              <div className="p-10">
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mb-8 p-5 rounded-2xl flex items-center gap-4 border ${
                      message.type === "error" 
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-300" 
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {message.type === "error" ? <AlertTriangle size={22} className="shrink-0" /> : <Check size={22} className="shrink-0" />}
                    <p className="font-medium text-sm">{message.text}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={20} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-14 pr-14 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/10 transition-all outline-none text-white font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Identity Key</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <ShieldCheck size={20} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full pl-14 pr-14 py-4.5 border rounded-2xl focus:ring-4 transition-all outline-none text-white font-medium ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword 
                              ? "bg-rose-500/10 border-rose-500/30 focus:ring-rose-500/20 focus:border-rose-500/50" 
                              : "bg-white/5 border-white/10 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/10"
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="grid grid-cols-2 gap-3 p-5 bg-white/5 rounded-2xl border border-white/5">
                    {[
                      { key: 'length', label: '8+ Characters' },
                      { key: 'uppercase', label: 'Uppercase' },
                      { key: 'lowercase', label: 'Lowercase' },
                      { key: 'number', label: 'Includes Number' },
                    ].map((rule) => (
                      <div key={rule.key} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordRules[rule.key] ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                        <span className={`text-[11px] font-semibold tracking-tight ${passwordRules[rule.key] ? 'text-slate-200' : 'text-slate-500'}`}>{rule.label}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !Object.values(passwordRules).every(Boolean)}
                    className="w-full relative group overflow-hidden"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                    <div className={`relative w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                      loading || !Object.values(passwordRules).every(Boolean)
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl hover:-translate-y-1 active:scale-95"
                    }`}>
                      {loading ? (
                        <>
                          <RefreshCw className="animate-spin w-6 h-6" />
                          <span>Updating Security...</span>
                        </>
                      ) : (
                        <>
                          Update Password
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                          </motion.div>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>
            </div>
            
            <footer className="mt-10 text-center">
              <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.4em] mb-2">
                &copy; 2026 ScholChat Security Operations
              </p>
              <div className="flex justify-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span>End-to-End Encryption</span>
                <span className="text-slate-700">&bull;</span>
                <span>PCI-DSS Compliant</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
        }
        input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        .py-4\.5 {
          padding-top: 1.125rem;
          padding-bottom: 1.125rem;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
