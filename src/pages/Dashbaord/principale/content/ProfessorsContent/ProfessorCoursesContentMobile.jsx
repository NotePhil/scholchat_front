import React, { useState } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle, 
  FileText,
  TrendingUp,
  Activity,
  Star,
  ChevronRight,
  RefreshCw,
  Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ProfessorCoursesContentMobile = ({ 
  courses, 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus,
  onViewCourse,
  onEditCourse,
  onCreateCourse,
  onRefresh,
  loading
}) => {
  const tabs = [
    { id: "all", label: "All", icon: BookOpen, color: "bg-blue-600" },
    { id: "PUBLIE", label: "Published", icon: CheckCircle, color: "bg-green-600" },
    { id: "BROUILLON", label: "Drafts", icon: FileText, color: "bg-yellow-600" }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.titre?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && course.etat === filterStatus;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 pb-32">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black dark:text-white">My Courses</h1>
          <button onClick={onRefresh} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search courses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-4 pl-12 pr-4 rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white"
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
           <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-lg border border-gray-100 dark:border-white/5">
              <div className="flex items-center space-x-2 mb-2">
                 <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <TrendingUp size={14} />
                 </div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth</span>
              </div>
              <p className="text-2xl font-black dark:text-white">+{courses.length}</p>
           </div>
           <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-lg border border-gray-100 dark:border-white/5">
              <div className="flex items-center space-x-2 mb-2">
                 <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                    <Star size={14} />
                 </div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</span>
              </div>
              <p className="text-2xl font-black dark:text-white">{courses.filter(c => c.etat === "PUBLIE").length}</p>
           </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setFilterStatus(tab.id)}
               className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 filterStatus === tab.id 
                 ? `${tab.color} text-white shadow-lg` 
                 : "bg-white dark:bg-slate-800 text-gray-500 border border-gray-100 dark:border-white/5"
               }`}
             >
               <tab.icon size={14} />
               <span>{tab.label}</span>
             </button>
           ))}
        </div>
      </header>

      {/* Course List */}
      <div className="px-4 space-y-4">
        {filteredCourses.map((course, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={course.id}
            onClick={() => onViewCourse(course)}
            className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-xl border border-gray-100 dark:border-white/5 active:scale-95 transition-all group overflow-hidden relative"
          >
             {/* Decorative Background Icon */}
             <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <BookOpen size={120} />
             </div>

             <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                   course.etat === 'PUBLIE' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                   {course.etat}
                </div>
                <MoreVertical size={18} className="text-gray-300" />
             </div>

             <h3 className="text-xl font-black dark:text-white mb-2 leading-tight">{course.titre}</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 font-medium leading-relaxed">
                {course.description || "No description provided for this course."}
             </p>

             <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center space-x-2">
                   <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-[10px]">
                      {course.matiere?.nom?.charAt(0) || "M"}
                   </div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[100px]">
                      {course.matiere?.nom || "Subject"}
                   </span>
                </div>
                <div className="flex items-center space-x-2">
                   <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         onEditCourse(course);
                      }}
                      className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"
                   >
                      <Edit2 size={16} />
                   </button>
                   <div className="flex items-center space-x-1 text-gray-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">{new Date(course.dateCreation).toLocaleDateString()}</span>
                   </div>
                </div>
             </div>
          </motion.div>
        ))}

        {filteredCourses.length === 0 && (
          <div className="py-20 text-center">
             <div className="p-8 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-6">
                <FileText size={48} className="text-gray-300" />
             </div>
             <h4 className="text-lg font-black dark:text-white">No courses found</h4>
             <p className="text-sm text-gray-500 font-medium">Create your first course to get started</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={onCreateCourse}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30] active:scale-95 transition-transform"
      >
        <Plus size={32} />
      </button>
    </div>
  );
};

export default ProfessorCoursesContentMobile;
