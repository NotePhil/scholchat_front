import React from "react";
import { 
  GraduationCap, 
  Search, 
  Settings, 
  Edit, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Calendar,
  Filter,
  RefreshCw,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";

const ManageClassListMobile = ({ 
  classes, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  handleManageClass, 
  handleEditClass,
  pendingRequests,
  onRefresh
}) => {
  return (
    <div className="flex flex-col space-y-4 px-4 pb-32 pt-2 bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* Header & Search */}
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-slate-950 pt-2 pb-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black dark:text-white">Classes</h2>
          <button 
            onClick={onRefresh}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5"
          >
            <RefreshCw size={20} className="text-blue-600" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search classes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-4 pl-12 pr-4 rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-4">
        {classes.map((classe, idx) => {
          const pendingCount = pendingRequests[classe.id] || 0;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={classe.id} 
              className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-xl border border-gray-100 dark:border-white/5 relative overflow-hidden group"
            >
              {pendingCount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-red-500/20 z-10">
                  {pendingCount} REQUESTS
                </div>
              )}

              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black dark:text-white leading-tight">{classe.nom}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{classe.niveau}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <div className="flex items-center text-[10px] font-bold text-blue-600 uppercase">
                       <CheckCircle size={10} className="mr-1" />
                       <span>{classe.etat}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Students</p>
                  <p className="text-sm font-bold dark:text-white">{classe.eleves?.length || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Created</p>
                   <p className="text-sm font-bold dark:text-white">{new Date(classe.dateCreation).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => handleManageClass(classe)}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  MANAGE
                </button>
                <button 
                  onClick={() => handleEditClass(classe)}
                  className="p-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs transition-all active:scale-95"
                >
                  <Edit size={18} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {classes.length === 0 && (
          <div className="py-20 text-center">
            <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
              <GraduationCap size={40} className="text-gray-400" />
            </div>
            <h4 className="font-bold dark:text-white">No classes found</h4>
            <p className="text-xs text-gray-500">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30]">
        <Plus size={28} />
      </button>
    </div>
  );
};

export default ManageClassListMobile;
