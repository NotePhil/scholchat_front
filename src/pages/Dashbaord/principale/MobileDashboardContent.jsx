import React from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Target, 
  Users, 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Bell,
  Search,
  MessageCircle,
  Calendar
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

const MobileDashboardContent = ({ stats, isDark, t, fetchDashboardData }) => {
  const StatItem = ({ icon: Icon, label, value, color, desc }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-[32px] shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 flex items-center space-x-4">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-100 shadow-inner`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
        <h3 className="text-xl font-black dark:text-white leading-tight">{value}</h3>
        <p className="text-[10px] text-gray-500 font-bold">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-6 pb-32 pt-4 px-4 bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* Welcome Section */}
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tighter">Hello, Prince</h1>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em]">Dashboard Overview</p>
        </div>
        <div className="flex space-x-2">
          <button className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300">
            <Search size={20} />
          </button>
          <button className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300 relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </button>
        </div>
      </section>

      {/* Progress Chart */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-[40px] shadow-xl border border-gray-100 dark:border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black dark:text-white">Success Trend</h3>
            <p className="text-xs text-gray-500">Weekly student performance</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="h-40">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                {day: 'M', val: 40}, {day: 'T', val: 30}, {day: 'W', val: 65}, 
                {day: 'T', val: 45}, {day: 'F', val: 80}, {day: 'S', val: 55}
              ]}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </section>

      {/* Quick Actions List */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
           <h3 className="text-lg font-black dark:text-white">Keep Going</h3>
           <button className="text-blue-600 font-bold text-xs flex items-center">
              View All <ArrowRight size={14} className="ml-1" />
           </button>
        </div>
        <div className="space-y-3">
           <div className="bg-white dark:bg-slate-800 p-4 rounded-[28px] shadow-lg border border-gray-100 dark:border-white/5 flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                 <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                    <Calendar size={20} />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm dark:text-white">Mathematics 101</h4>
                    <p className="text-[10px] text-gray-500">Live in 15 minutes</p>
                 </div>
              </div>
              <button className="p-2 text-gray-400 group-hover:text-blue-600 transition-colors">
                 <ArrowRight size={20} />
              </button>
           </div>
           
           <div className="bg-white dark:bg-slate-800 p-4 rounded-[28px] shadow-lg border border-gray-100 dark:border-white/5 flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                 <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-500/20">
                    <Activity size={20} />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm dark:text-white">Science Project</h4>
                    <p className="text-[10px] text-gray-500">Draft due tomorrow</p>
                 </div>
              </div>
              <button className="p-2 text-gray-400 group-hover:text-green-600 transition-colors">
                 <ArrowRight size={20} />
              </button>
           </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-20">
            <MessageCircle size={100} />
         </div>
         <h3 className="text-2xl font-black mb-2 px-1">Community</h3>
         <p className="text-gray-400 text-sm mb-6 max-w-[200px]">Join 2,400+ students and teachers in the forum.</p>
         <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-sm shadow-xl">
            Join Chat
         </button>
      </section>
    </div>
  );
};

export default MobileDashboardContent;
