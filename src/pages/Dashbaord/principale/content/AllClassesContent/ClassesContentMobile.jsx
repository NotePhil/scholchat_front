import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Key, 
  GraduationCap, 
  ChevronRight, 
  Building, 
  Filter,
  CheckCircle,
  Clock,
  Users,
  AlertCircle,
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ClassesContentMobile = ({ 
  classes, 
  searchTerm, 
  setSearchTerm, 
  currentTab, 
  setCurrentTab,
  onManageClass,
  onJoinByToken,
  onCreateClass,
  accessToken,
  setAccessToken,
  userRole,
  accessRequestCounts
}) => {
  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" }
  ];

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.nom.toLowerCase().includes(searchTerm.toLowerCase());
    if (currentTab === "all") return matchesSearch;
    if (currentTab === "active") return matchesSearch && cls.statut === "ACTIF";
    if (currentTab === "pending") return matchesSearch && cls.statut === "EN_ATTENTE_APPROBATION";
    return matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 pb-32">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-black dark:text-white mb-6">Classes</h1>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search classes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-4 pl-12 pr-4 rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white"
          />
        </div>

        {/* Join by Token Bar */}
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-[32px] text-white shadow-2xl shadow-blue-500/30 mb-8 relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-10">
              <Key size={120} />
           </div>
           <h3 className="text-lg font-black mb-1">Access a Class</h3>
           <p className="text-blue-100/80 text-[10px] font-bold uppercase tracking-widest mb-4">Enter your access token</p>
           <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Token Code..." 
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 placeholder:text-blue-200 outline-none focus:bg-white/30 transition-all text-sm font-bold"
              />
              <button 
                onClick={onJoinByToken}
                className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all"
              >
                JOIN
              </button>
           </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setCurrentTab(tab.id)}
               className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                 currentTab === tab.id 
                 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                 : "bg-white dark:bg-slate-800 text-gray-500 border border-gray-100 dark:border-white/5"
               }`}
             >
               {tab.label}
             </button>
           ))}
        </div>
      </header>

      {/* Classes List */}
      <div className="px-4 space-y-4">
        {filteredClasses.map((cls, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={cls.id}
            className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-xl border border-gray-100 dark:border-white/5 relative overflow-hidden"
          >
             {accessRequestCounts[cls.id] > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                   {accessRequestCounts[cls.id]} NEW
                </div>
             )}

             <div className="flex items-center space-x-4 mb-5">
                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 text-blue-600 rounded-3xl border border-blue-500/10">
                   <GraduationCap size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-black dark:text-white leading-tight">{cls.nom}</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cls.matiere}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center space-x-2">
                   <Users size={14} className="text-blue-500" />
                   <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Students</p>
                      <p className="text-xs font-bold dark:text-white">{cls.eleves?.length || 0}</p>
                   </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center space-x-2">
                   <CheckCircle size={14} className="text-green-500" />
                   <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Status</p>
                      <p className="text-xs font-bold dark:text-white">{cls.statut}</p>
                   </div>
                </div>
             </div>

             {cls.etablissement && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl mb-6 border border-gray-100 dark:border-white/5">
                   <Building size={14} className="text-gray-400" />
                   <span className="text-[10px] font-bold text-gray-500 truncate">{cls.etablissement.nom}</span>
                </div>
             )}

             <div className="flex space-x-2">
                <button 
                  onClick={() => onManageClass(cls.id)}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  GO TO CLASS
                </button>
                <button className="p-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs transition-all active:scale-95">
                   <MoreVertical size={18} />
                </button>
             </div>
          </motion.div>
        ))}

        {filteredClasses.length === 0 && (
          <div className="py-20 text-center">
             <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
                <GraduationCap size={40} className="text-gray-400" />
             </div>
             <h4 className="font-bold dark:text-white">No classes match</h4>
             <p className="text-xs text-gray-500">Try adjusting your filters or search</p>
          </div>
        )}
      </div>

      {/* FAB for Create Class */}
      {(userRole === "PROFESSEUR" || userRole === "ADMINISTRATEUR" || userRole === "ADMIN") && (
        <button 
          onClick={onCreateClass}
          className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30] active:scale-95 transition-transform"
        >
          <Plus size={32} />
        </button>
      )}
    </div>
  );
};

export default ClassesContentMobile;
