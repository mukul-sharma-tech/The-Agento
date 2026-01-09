// "use client";
// import React, { useState } from 'react';
// import Transition from '@/components/transition';
// import { Download, RefreshCcw, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

// export default function Home() {
//   const [step, setStep] = useState('input'); 
//   const [statusText, setStatusText] = useState("Initializing...");
  
//   const [formData, setFormData] = useState({
//     product: '', 
//     region: '', 
//     price: '', 
//     age: 'All', 
//     description: ''
//   });

//   const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
//     setFormData({...formData, [e.target.name]: e.target.value});
  
//   const isFormValid = 
//     formData.product.trim().length > 0 && 
//     formData.region.trim().length > 0 && 
//     formData.price.toString().trim().length > 0 && 
//     formData.description.trim().length > 0;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isFormValid) {
//         alert("Please fill in all required fields.");
//         return;
//     }

//     setStep('processing');

//     const sequence = [
//       { text: "Agent 1: Scouting Competitors...", delay: 2000 },
//       { text: "Agent 2: Analyzing Global Trends...", delay: 2500 },
//       { text: "Agent 3: Checking Manufacturing Feasibility...", delay: 2000 },
//       { text: "Master Agent: Synthesizing Final Report...", delay: 1500 }
//     ];

//     let totalDelay = 0;
//     sequence.forEach(({ text, delay }) => {
//       setTimeout(() => setStatusText(text), totalDelay);
//       totalDelay += delay;
//     });

//     setTimeout(() => {
//       setStep('result');
//     }, totalDelay);
//   };

//   // --- MOCK REPORT ---
//   const reportHtml = `
//     <div class="space-y-8 max-w-5xl mx-auto">
//       <div class="p-8 bg-blue-50 border-l-8 border-blue-600 rounded-r-lg shadow-sm">
//         <h3 class="text-3xl font-bold text-blue-900 mb-4">Executive Summary</h3>
//         <p class="text-blue-800 text-lg leading-relaxed">
//           The market opportunity for <strong>${formData.product}</strong> in <strong>${formData.region}</strong> is favorable. 
//           Targeting a price of <strong>$${formData.price}</strong> positions you well against competitors.
//         </p>
//       </div>

//       <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
//         <div class="p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
//            <h4 class="font-bold text-slate-500 uppercase tracking-widest text-sm mb-4">🚀 Best Time to Market</h4>
//            <p class="text-2xl font-semibold text-slate-800">Late Q3 2024</p>
//            <p class="text-slate-500 mt-2">Aligned with pre-holiday seasonal demand spikes.</p>
//         </div>
//         <div class="p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
//            <h4 class="font-bold text-slate-500 uppercase tracking-widest text-sm mb-4">🏭 Safe Manufacturing Batch</h4>
//            <p class="text-2xl font-semibold text-slate-800">500 - 1,200 Units</p>
//            <p class="text-green-600 mt-2 font-medium">Low Risk Assessment</p>
//         </div>
//       </div>

//       <div class="p-8 border rounded-2xl bg-white shadow-lg">
//         <h3 class="text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Competitor Landscape</h3>
//         <ul class="space-y-4 text-slate-600 text-lg">
//           <li class="flex items-start gap-3"><span class="text-red-500 mt-1.5">●</span> <strong>Competitor A:</strong> Higher price, lower quality.</li>
//           <li class="flex items-start gap-3"><span class="text-red-500 mt-1.5">●</span> <strong>Competitor B:</strong> Good distribution, bad reviews.</li>
//         </ul>
//       </div>

//       <div class="p-8 border rounded-2xl bg-white shadow-lg">
//          <h3 class="text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Strategic Recommendations</h3>
//          <p class="text-slate-700 text-lg leading-relaxed">
//             Focus marketing on the <strong>${formData.age}</strong> age group using social proof. Secure raw materials from Tier-2 suppliers to maintain margins.
//          </p>
//       </div>
//     </div>
//   `;

//   if (step === 'processing') return <Transition status={statusText} />;

//   if (step === 'result') return (
//     <div className="min-h-screen w-screen bg-slate-50 flex flex-col">
//       <div className="bg-slate-900 text-white px-8 py-5 shadow-xl flex justify-between items-center sticky top-0 z-40">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Intelligence Report</h1>
//           <p className="text-slate-400 text-sm mt-0.5">{formData.product} • {formData.region}</p>
//         </div>
        
//         <div className="flex items-center gap-4">
//            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full uppercase text-xs font-bold tracking-wider">
//               <CheckCircle size={16} /> Verified
//            </div>
           
//            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25">
//              <Download size={18} /> Download PDF
//            </button>

//            <button 
//              onClick={() => setStep('input')}
//              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-lg font-semibold transition-colors"
//            >
//              <RefreshCcw size={18} /> New
//            </button>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto p-8">
//         <div 
//            className="prose max-w-none text-slate-800"
//            dangerouslySetInnerHTML={{ __html: reportHtml }} 
//         />
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex h-screen w-screen bg-white overflow-hidden">
        
//         <div className="hidden lg:flex w-1/3 relative flex-col justify-between p-12 text-white">
          
//           <div 
//              className="absolute inset-0 bg-cover bg-center z-0" 
//              style={{ backgroundImage: "url('/logo.png')" }}
//           ></div>
          
//           <div className="absolute inset-0 bg-slate-900/80 z-0"></div>

//           <div className="relative z-10">
//             <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Synapsee-AI</h1>
//             <p className="text-blue-200 text-xl font-light">Agentic Market Intelligence & Feasibility Engine</p>
//           </div>
          
//           <div className="relative z-10 space-y-6">
//             <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
//               <CheckCircle className="text-green-400 w-8 h-8"/> 
//               <div>
//                 <h3 className="font-bold text-lg">Competitor Recon</h3>
//                 <p className="text-blue-100 text-sm">Deep scan of local market players</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
//               <CheckCircle className="text-green-400 w-8 h-8"/> 
//               <div>
//                 <h3 className="font-bold text-lg">Trend Analysis</h3>
//                 <p className="text-blue-100 text-sm">Real-time demand forecasting</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
//               <CheckCircle className="text-green-400 w-8 h-8"/> 
//               <div>
//                 <h3 className="font-bold text-lg">Risk Calculation</h3>
//                 <p className="text-blue-100 text-sm">Safe manufacturing batch sizes</p>
//               </div>
//             </div>
//           </div>
          
//           <div className="relative z-10 text-sm text-slate-400">
//             © 2026 Synapsee AI Inc.
//           </div>
//         </div>

//         <div className="w-full lg:w-2/3 h-full overflow-y-auto bg-slate-50 flex items-center justify-center p-8 md:p-16">
//           <div className="w-full max-w-2xl">
//             <div className="mb-10">
//                <h2 className="text-4xl font-bold text-slate-900 mb-3">New Analysis</h2>
//                <p className="text-slate-500 text-lg">Enter product details to launch the agent swarm.</p>
//             </div>
          
//             <form onSubmit={handleSubmit} className="space-y-8">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name <span className="text-red-500">*</span></label>
//                   <input 
//                     name="product" 
//                     onChange={handleInput} 
//                     className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                     placeholder="e.g. Ergonomic Chair" 
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Region <span className="text-red-500">*</span></label>
//                   <input 
//                     name="region" 
//                     onChange={handleInput} 
//                     className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                     placeholder="e.g. Toronto, Canada" 
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Max Price ($) <span className="text-red-500">*</span></label>
//                   <div className="relative">
//                     <span className="absolute left-4 top-4 text-slate-400">$</span>
//                     <input 
//                       name="price" 
//                       type="number" 
//                       onChange={handleInput} 
//                       className="w-full p-4 pl-8 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                       placeholder="150" 
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Age</label>
//                   <div className="relative">
//                     <select 
//                       name="age" 
//                       onChange={handleInput} 
//                       className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
//                     >
//                       <option value="All">All Demographics</option>
//                       <option value="18-25">Gen Z (18-25)</option>
//                       <option value="26-40">Millennials (26-40)</option>
//                       <option value="40+">Gen X & Boomers (40+)</option>
//                     </select>
//                     <div className="absolute right-4 top-5 pointer-events-none text-slate-400">▼</div>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Description <span className="text-red-500">*</span></label>
//                 <textarea 
//                   name="description" 
//                   rows={4}
//                   onChange={handleInput} 
//                   className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300 resize-none" 
//                   placeholder="Describe unique selling points, materials, and key features..."
//                 ></textarea>
//               </div>

//               <button 
//                 type="submit" 
//                 disabled={!isFormValid}
//                 className={`w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform duration-200
//                   ${isFormValid 
//                     ? 'bg-blue-600 text-white shadow-xl hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 cursor-pointer' 
//                     : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
//                   }`}
//               >
//                 {isFormValid ? (
//                     <>Start Analysis <ArrowRight size={24} /></>
//                 ) : (
//                     <>Fill all fields to start <AlertCircle size={20} /></>
//                 )}
//               </button>
//             </form>
//           </div>
//         </div>
//     </div>
//   );
// }

"use client";
import React, { useState } from 'react';
import Transition from '@/components/transition';
import { Download, RefreshCcw, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function Home() {
  const [step, setStep] = useState('input'); 
  const [statusText, setStatusText] = useState("Initializing...");
   
  const [formData, setFormData] = useState({
    product: '', 
    region: '', 
    price: '', 
    age: 'All', 
    description: ''
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
    setFormData({...formData, [e.target.name]: e.target.value});
   
  const isFormValid = 
    formData.product.trim().length > 0 && 
    formData.region.trim().length > 0 && 
    formData.price.toString().trim().length > 0 && 
    formData.description.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
        alert("Please fill in all required fields.");
        return;
    }

    setStep('processing');

    const sequence = [
      { text: "Agent 1: Scouting Competitors...", delay: 2000 },
      { text: "Agent 2: Analyzing Global Trends...", delay: 2500 },
      { text: "Agent 3: Checking Manufacturing Feasibility...", delay: 2000 },
      { text: "Master Agent: Synthesizing Final Report...", delay: 1500 }
    ];

    let totalDelay = 0;
    sequence.forEach(({ text, delay }) => {
      setTimeout(() => setStatusText(text), totalDelay);
      totalDelay += delay;
    });

    setTimeout(() => {
      setStep('result');
    }, totalDelay);
  };

  // --- MOCK REPORT ---
  const reportHtml = `
    <div class="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <div class="p-6 md:p-8 bg-blue-50 border-l-8 border-blue-600 rounded-r-lg shadow-sm">
        <h3 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">Executive Summary</h3>
        <p class="text-blue-800 text-base md:text-lg leading-relaxed">
          The market opportunity for <strong>${formData.product}</strong> in <strong>${formData.region}</strong> is favorable. 
          Targeting a price of <strong>$${formData.price}</strong> positions you well against competitors.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🚀 Best Time to Market</h4>
           <p class="text-xl md:text-2xl font-semibold text-slate-800">Late Q3 2024</p>
           <p class="text-slate-500 mt-2 text-sm md:text-base">Aligned with pre-holiday seasonal demand spikes.</p>
        </div>
        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🏭 Safe Manufacturing Batch</h4>
           <p class="text-xl md:text-2xl font-semibold text-slate-800">500 - 1,200 Units</p>
           <p class="text-green-600 mt-2 font-medium text-sm md:text-base">Low Risk Assessment</p>
        </div>
      </div>

      <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Competitor Landscape</h3>
        <ul class="space-y-4 text-slate-600 text-base md:text-lg">
          <li class="flex items-start gap-3"><span class="text-red-500 mt-1.5">●</span> <strong>Competitor A:</strong> Higher price, lower quality.</li>
          <li class="flex items-start gap-3"><span class="text-red-500 mt-1.5">●</span> <strong>Competitor B:</strong> Good distribution, bad reviews.</li>
        </ul>
      </div>

      <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
         <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Strategic Recommendations</h3>
         <p class="text-slate-700 text-base md:text-lg leading-relaxed">
           Focus marketing on the <strong>${formData.age}</strong> age group using social proof. Secure raw materials from Tier-2 suppliers to maintain margins.
         </p>
      </div>
    </div>
  `;

  if (step === 'processing') return <Transition status={statusText} />;

  if (step === 'result') return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col">
      {/* Responsive Header: Flex Col on Mobile, Row on Desktop */}
      <div className="bg-slate-900 text-white px-4 md:px-8 py-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-40 gap-4 md:gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Intelligence Report</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">{formData.product} • {formData.region}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase text-[10px] md:text-xs font-bold tracking-wider">
              <CheckCircle size={14} className="md:w-4 md:h-4" /> Verified
           </div>
           
           <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25 text-sm md:text-base">
             <Download size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Download</span> PDF
           </button>

           <button 
             onClick={() => setStep('input')}
             className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold transition-colors text-sm md:text-base ml-auto md:ml-0"
           >
             <RefreshCcw size={16} className="md:w-[18px] md:h-[18px]" /> New
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div 
           className="prose max-w-none text-slate-800"
           dangerouslySetInnerHTML={{ __html: reportHtml }} 
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">
        
        {/* Left Side: Hidden on Mobile/Tablet (lg:flex) */}
        <div className="hidden lg:flex w-1/3 relative flex-col justify-between p-12 text-white">
          
          <div 
              className="absolute inset-0 bg-cover bg-center z-0" 
              style={{ backgroundImage: "url('/logo.png')" }}
          ></div>
          
          <div className="absolute inset-0 bg-slate-900/80 z-0"></div>

          <div className="relative z-10">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Synapsee-AI</h1>
            <p className="text-blue-200 text-xl font-light">Agentic Market Intelligence & Feasibility Engine</p>
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
              <CheckCircle className="text-green-400 w-8 h-8"/> 
              <div>
                <h3 className="font-bold text-lg">Competitor Recon</h3>
                <p className="text-blue-100 text-sm">Deep scan of local market players</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
              <CheckCircle className="text-green-400 w-8 h-8"/> 
              <div>
                <h3 className="font-bold text-lg">Trend Analysis</h3>
                <p className="text-blue-100 text-sm">Real-time demand forecasting</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
              <CheckCircle className="text-green-400 w-8 h-8"/> 
              <div>
                <h3 className="font-bold text-lg">Risk Calculation</h3>
                <p className="text-blue-100 text-sm">Safe manufacturing batch sizes</p>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 text-sm text-slate-400">
            © 2026 Synapsee AI Inc.
          </div>
        </div>

        {/* Right Side: Adjusted padding for mobile */}
        <div className="w-full lg:w-2/3 h-full overflow-y-auto bg-slate-50 flex items-center justify-center p-6 md:p-16">
          <div className="w-full max-w-2xl">
            
            {/* Mobile Header (Only visible on small screens to replace the hidden left sidebar) */}
            <div className="lg:hidden mb-8 border-b pb-6 border-slate-200">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Synapsee-AI</h1>
                <p className="text-slate-500 text-sm mt-1">Agentic Market Intelligence & Feasibility Engine</p>
            </div>

            <div className="mb-8 md:mb-10">
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">New Analysis</h2>
               <p className="text-slate-500 text-base md:text-lg">Enter product details to launch the agent swarm.</p>
            </div>
           
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name <span className="text-red-500">*</span></label>
                  <input 
                    name="product" 
                    onChange={handleInput} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
                    placeholder="e.g. Ergonomic Chair" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Region <span className="text-red-500">*</span></label>
                  <input 
                    name="region" 
                    onChange={handleInput} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
                    placeholder="e.g. Toronto, Canada" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Max Price ($) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400">$</span>
                    <input 
                      name="price" 
                      type="number" 
                      onChange={handleInput} 
                      className="w-full p-4 pl-8 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
                      placeholder="150" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Age</label>
                  <div className="relative">
                    <select 
                      name="age" 
                      onChange={handleInput} 
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="All">All Demographics</option>
                      <option value="18-25">Gen Z (18-25)</option>
                      <option value="26-40">Millennials (26-40)</option>
                      <option value="40+">Gen X & Boomers (40+)</option>
                    </select>
                    <div className="absolute right-4 top-5 pointer-events-none text-slate-400">▼</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Description <span className="text-red-500">*</span></label>
                <textarea 
                  name="description" 
                  rows={4}
                  onChange={handleInput} 
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300 resize-none" 
                  placeholder="Describe unique selling points, materials, and key features..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={!isFormValid}
                className={`w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform duration-200
                  ${isFormValid 
                    ? 'bg-blue-600 text-white shadow-xl hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                  }`}
              >
                {isFormValid ? (
                    <>Start Analysis <ArrowRight size={24} /></>
                ) : (
                    <>Fill all fields to start <AlertCircle size={20} /></>
                )}
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}