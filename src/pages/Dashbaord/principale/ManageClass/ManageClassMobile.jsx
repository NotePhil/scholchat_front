import React, { useState } from "react";
import { 
  Mic, MicOff, Camera, CameraOff, 
  Video, Clipboard, FileText, 
  Send, MoreVertical, X,
  ArrowLeft, Hand, Users,
  MessageSquare, Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ManageClassMobile = ({ classeInfo, participants, chatMessages, onBack }) => {
  const [activeTab, setActiveTab] = useState("video");
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-gray-900/50 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold truncate max-w-[150px]">{classeInfo.name}</h1>
          <p className="text-[10px] text-gray-400">Dr. Richard Martinez</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowParticipants(true)} className="p-2 bg-gray-800 rounded-2xl relative">
            <Users size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-gray-900"></span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex px-4 py-2 bg-gray-900/50 border-b border-gray-800 overflow-x-auto no-scrollbar space-x-2">
        {[
          { id: "video", label: "Meeting", icon: Video },
          { id: "assignments", label: "Homework", icon: Clipboard },
          { id: "docs", label: "Library", icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
              : "bg-gray-800 text-gray-400"
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "video" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Main Camera View */}
              <div className="flex-1 bg-gray-800 m-4 rounded-3xl overflow-hidden relative shadow-2xl">
                {!cameraActive ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/80 backdrop-blur-xl">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 border-2 border-gray-600">
                      <CameraOff size={40} className="text-gray-500" />
                    </div>
                    <p className="text-gray-400 font-medium">Your camera is off</p>
                  </div>
                ) : (
                  <img src="/api/placeholder/400/600" alt="Main video" className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold">You (Host)</span>
                </div>
              </div>

              {/* Participants Miniatures Overlay (Horizontal Scroll) */}
              <div className="px-4 pb-4">
                <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2">
                  {participants.slice(1, 6).map((p) => (
                    <div key={p.id} className="min-w-[100px] h-[140px] bg-gray-800 rounded-2xl overflow-hidden relative border border-gray-700 shadow-xl">
                      <img src={`/api/placeholder/100/140?text=${p.name.charAt(0)}`} alt={p.name} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute top-2 right-2 flex flex-col space-y-1">
                        {!p.hasMic && <div className="p-1 bg-red-500/80 backdrop-blur-sm rounded-lg"><MicOff size={10} /></div>}
                        {p.hasHand && <div className="p-1 bg-yellow-500/80 backdrop-blur-sm rounded-lg"><Hand size={10} className="text-gray-900" /></div>}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] font-bold truncate">{p.name.split(' ')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Controls Toggle Grid */}
              <div className="bg-gray-900 p-6 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-gray-800">
                <div className="flex justify-around items-center max-w-sm mx-auto">
                  <button 
                    onClick={() => setMicActive(!micActive)}
                    className={`p-5 rounded-3xl transition-all shadow-xl ${micActive ? 'bg-blue-600 shadow-blue-500/20' : 'bg-gray-800 border border-gray-700'}`}
                  >
                    {micActive ? <Mic size={24} /> : <MicOff size={24} className="text-red-500" />}
                  </button>
                  <button 
                    onClick={() => setCameraActive(!cameraActive)}
                    className={`p-5 rounded-3xl transition-all shadow-xl ${cameraActive ? 'bg-blue-600 shadow-blue-500/20' : 'bg-gray-800 border border-gray-700'}`}
                  >
                    {cameraActive ? <Camera size={24} /> : <CameraOff size={24} className="text-red-500" />}
                  </button>
                  <button onClick={() => setShowChat(true)} className="p-5 rounded-3xl bg-gray-800 border border-gray-700 shadow-xl">
                    <MessageSquare size={24} />
                  </button>
                  <button className="p-5 rounded-3xl bg-red-600 shadow-xl shadow-red-500/20">
                    <X size={24} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "assignments" && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -20, opacity: 0 }}
              className="p-4 h-full overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Assignments</h2>
                <button className="p-2 bg-blue-600 rounded-xl"><Maximize2 size={16}/></button>
              </div>
              <div className="space-y-4 pb-20">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 p-5 rounded-[28px] hover:border-blue-500/50 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Clipboard size={20} />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Due May {10+i}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Advanced Mathematics - Part {i}</h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">Complete the exercises on page {40+i} regarding linear equations and matrix transformations.</p>
                    <button className="w-full py-3 bg-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-600 transition-colors">View Details</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "docs" && (
            <motion.div 
               initial={{ x: 20, opacity: 0 }} 
               animate={{ x: 0, opacity: 1 }} 
               exit={{ x: -20, opacity: 0 }}
               className="p-4 h-full overflow-y-auto"
            >
               <h2 className="text-xl font-bold mb-6">Class Resources</h2>
               <div className="grid grid-cols-2 gap-4 pb-20">
                  {['PDF', 'DOC', 'IMG', 'VID'].map((type, i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 p-4 rounded-3xl flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                        <FileText size={24} className="text-blue-400" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 mb-1">{type} File</span>
                      <h4 className="text-xs font-bold mb-3 truncate w-full">Lecture_Note_{i+1}</h4>
                      <button className="p-2 bg-gray-700 rounded-xl w-full flex justify-center"><Send size={14}/></button>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 bg-gray-900 z-[100] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
               <h3 className="font-bold">Live Chat</h3>
               <button onClick={() => setShowChat(false)}><X/></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map((m) => (
                <div key={m.id} className="flex flex-col space-y-1">
                  <span className="text-[10px] font-bold text-blue-400">{m.user}</span>
                  <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                    <p className="text-sm">{m.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-800">
              <div className="flex space-x-2 bg-gray-800 rounded-2xl p-2">
                <input placeholder="Type a message..." className="bg-transparent flex-1 px-4 outline-none text-sm" />
                <button className="p-2 bg-blue-600 rounded-xl"><Send size={18}/></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants Overlay */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div 
             initial={{ x: "100%" }}
             animate={{ x: 0 }}
             exit={{ x: "100%" }}
             className="fixed inset-0 bg-gray-900 z-[100] p-4 pt-12"
          >
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold">Participants ({participants.length})</h2>
               <button onClick={() => setShowParticipants(false)} className="p-3 bg-gray-800 rounded-2xl"><X/></button>
            </div>
            <div className="space-y-4">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-[24px]">
                  <div className="flex items-center space-x-4">
                    <img src={`/api/placeholder/40/40?text=${p.name.charAt(0)}`} className="w-10 h-10 rounded-xl" alt={p.name} />
                    <div>
                      <h4 className="font-bold text-sm">{p.name}</h4>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{p.role}</span>
                    </div>
                  </div>
                  {!p.hasMic && <MicOff size={16} className="text-gray-600" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageClassMobile;
