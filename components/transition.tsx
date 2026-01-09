// FILE: frontend/app/components/Transition.js
"use client";
import { motion } from "framer-motion";
import { Loader2, Search, BrainCircuit, FileText } from "lucide-react";

export default function Transition({ status }) {
  // Dynamic Icon Switching
  const getIcon = () => {
    if (status.includes("Scouting")) return <Search className="w-16 h-16 text-blue-400" />;
    if (status.includes("Analyzing")) return <BrainCircuit className="w-16 h-16 text-purple-400" />;
    return <FileText className="w-16 h-16 text-green-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Spinning Ring Animation */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="relative mb-8"
        >
          <div className="w-40 h-40 rounded-full border-t-4 border-b-4 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.6)]" />
        </motion.div>
        
        {/* Icon in Center */}
        <div className="absolute top-12">
          {getIcon()}
        </div>

        {/* Text Animation */}
        <motion.h2 
          key={status} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mt-4 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
        >
          Synapsee AI Active
        </motion.h2>
        
        <div className="flex items-center gap-3 text-slate-400 font-mono text-lg">
          <Loader2 className="animate-spin w-5 h-5" />
          {status}
        </div>
      </div>
    </div>
  );
}