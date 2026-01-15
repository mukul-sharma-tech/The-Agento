// "use client";
// import React, { useState, FormEvent, ChangeEvent } from 'react';
// import Transition from '@/components/transition';
// import { Download, RefreshCcw, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

// // Define types for form data
// type FormData = {
//   product: string;
//   region: string;
//   price: string;
//   age: string;
//   description: string;
// };

// // Define type for status sequence items
// type StatusSequence = {
//   text: string;
//   delay: number;
// };

// // Define step types
// type Step = 'input' | 'processing' | 'result';

// export default function Home() {
//   const [step, setStep] = useState<Step>('input'); 
//   const [statusText, setStatusText] = useState<string>("Initializing...");
   
//   const [formData, setFormData] = useState<FormData>({
//     product: '', 
//     region: '', 
//     price: '', 
//     age: 'All', 
//     description: ''
//   });

//   // Handle input change with proper event typing
//   const handleInput = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     setFormData({
//       ...formData, 
//       [e.target.name]: e.target.value
//     });
//   };
   
//   const isFormValid = 
//     formData.product.trim().length > 0 && 
//     formData.region.trim().length > 0 && 
//     formData.price.toString().trim().length > 0 && 
//     formData.description.trim().length > 0;

//   const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!isFormValid) {
//         alert("Please fill in all required fields.");
//         return;
//     }

//     setStep('processing');

//     const sequence: StatusSequence[] = [
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
//     <div class="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      
//       <div class="p-6 md:p-8 bg-blue-50 border-l-8 border-blue-600 rounded-r-lg shadow-sm">
//         <h3 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">Executive Summary & Feasibility</h3>
//         <ul class="space-y-3 text-blue-800 text-base md:text-lg leading-relaxed list-disc pl-5">
//           <li>Market prices of regular sweaters range between ₹432 to ₹690 indicating Electric Sweater at ₹3499 is positioned as a premium product.</li>
//           <li>Feasible only if marketed with clear value proposition such as personal heating, energy efficiency, and winter travel utility.</li>
//         </ul>
//       </div>

//       <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
//         <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
//            <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🚀 Best Time to Market</h4>
//            <ul class="space-y-3 text-slate-700 text-sm md:text-base list-disc pl-5">
//              <li><strong>Primary Window:</strong> October to December based on peak Google Trends interest.</li>
//              <li><strong>Pre-marketing:</strong> Begin awareness campaigns from August to capture rising demand.</li>
//              <li><strong>Avoid:</strong> Heavy marketing from March to June due to consistently low interest levels.</li>
//            </ul>
//         </div>
        
//         <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
//            <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🏭 Manufacturing & Materials</h4>
           
//            <p class="font-semibold text-slate-800 mb-2">Safe Batch Size:</p>
//            <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5 mb-4">
//              <li>Initial limited batch production recommended due to premium pricing and niche demand.</li>
//              <li>Scale manufacturing closer to winter season after early validation.</li>
//            </ul>

//            <p class="font-semibold text-slate-800 mb-2">Sourcing Strategy:</p>
//            <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5">
//              <li>Procure batteries and heating elements March–June (lowest demand).</li>
//              <li>Cardigans/Apparel: Source year-round with bulk discounts in off-season.</li>
//              <li>Batteries: Early bulk purchasing advised due to long-term inflation.</li>
//            </ul>
//         </div>
//       </div>

//       <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
//         <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Competitor Landscape</h3>
//         <div class="flex items-center gap-3 text-slate-600 text-base md:text-lg">
//           <span class="text-red-500 text-xl">●</span> 
//           <strong>Direct Competitors:</strong> NA (No direct competitors identified for this specific niche).
//         </div>
//       </div>

//       <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
//          <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Strategic Recommendations</h3>
         
//          <div class="mb-6">
//            <h4 class="font-bold text-slate-700 text-lg mb-3">Key Factors to Include</h4>
//            <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
//              <li>Battery safety and insulation compliance.</li>
//              <li>Comfort and weight optimization due to embedded heating elements.</li>
//              <li>Clear differentiation from regular sweaters through heating performance and battery life.</li>
//            </ul>
//          </div>

//          <div>
//            <h4 class="font-bold text-slate-700 text-lg mb-3">Target Region Expansion</h4>
//            <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
//              <li>Northern India regions with colder winters (Delhi, Haryana, Rajasthan).</li>
//              <li>Hilly and cold-prone regions within India where winter apparel demand is higher.</li>
//            </ul>
//          </div>
//       </div>
//     </div>
//   `;

//   // Loading/Processing state
//   if (step === 'processing') {
//     return <Transition status={statusText} />;
//   }

//   // Result state
//   if (step === 'result') {
//     return (
//       <div className="min-h-screen w-screen bg-slate-50 flex flex-col">
//         {/* Responsive Header: Flex Col on Mobile, Row on Desktop */}
//         <div className="bg-slate-900 text-white px-4 md:px-8 py-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-40 gap-4 md:gap-0">
//           <div>
//             <h1 className="text-xl md:text-2xl font-bold tracking-tight">Intelligence Report</h1>
//             <p className="text-slate-400 text-xs md:text-sm mt-0.5">{formData.product} • {formData.region}</p>
//           </div>
          
//           <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
//              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase text-[10px] md:text-xs font-bold tracking-wider">
//                 <CheckCircle size={14} className="md:w-4 md:h-4" /> Verified
//              </div>
             
//              <button 
//                type="button"
//                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25 text-sm md:text-base"
//                onClick={() => {
//                  // Mock PDF download functionality
//                  const link = document.createElement('a');
//                  link.href = '#';
//                  link.download = `synapsee-report-${formData.product}-${Date.now()}.pdf`;
//                  link.click();
//                }}
//              >
//                <Download size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Download</span> PDF
//              </button>

//              <button 
//                type="button"
//                onClick={() => setStep('input')}
//                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold transition-colors text-sm md:text-base ml-auto md:ml-0"
//              >
//                <RefreshCcw size={16} className="md:w-[18px] md:h-[18px]" /> New
//              </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 md:p-8">
//           <div 
//             className="prose max-w-none text-slate-800"
//             dangerouslySetInnerHTML={{ __html: reportHtml }} 
//           />
//         </div>
//       </div>
//     );
//   }

//   // Input form state (default)
//   return (
//     <div className="flex h-screen w-screen bg-white overflow-hidden">
        
//         {/* Left Side: Hidden on Mobile/Tablet (lg:flex) */}
//         <div className="hidden lg:flex w-1/3 relative flex-col justify-between p-12 text-white">
          
//           <div 
//             className="absolute inset-0 bg-cover bg-center z-0" 
//             style={{ backgroundImage: "url('/logo.png')" }}
//             role="img"
//             aria-label="Synapsee AI background"
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

//         {/* Right Side: Adjusted padding for mobile */}
//         <div className="w-full lg:w-2/3 h-full overflow-y-auto bg-slate-50 flex items-center justify-center p-6 md:p-16">
//           <div className="w-full max-w-2xl">
            
//             {/* Mobile Header (Only visible on small screens to replace the hidden left sidebar) */}
//             <div className="lg:hidden mb-8 border-b pb-6 border-slate-200">
//                 <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Synapsee-AI</h1>
//                 <p className="text-slate-500 text-sm mt-1">Agentic Market Intelligence & Feasibility Engine</p>
//             </div>

//             <div className="mb-8 md:mb-10">
//                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">New Analysis</h2>
//                <p className="text-slate-500 text-base md:text-lg">Enter product details to launch the agent swarm.</p>
//             </div>
           
//             <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name <span className="text-red-500">*</span></label>
//                   <input 
//                     name="product" 
//                     value={formData.product}
//                     onChange={handleInput} 
//                     className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                     placeholder="e.g. Ergonomic Chair" 
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Region <span className="text-red-500">*</span></label>
//                   <input 
//                     name="region" 
//                     value={formData.region}
//                     onChange={handleInput} 
//                     className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                     placeholder="e.g. Toronto, Canada" 
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Max Price (₹) <span className="text-red-500">*</span></label>
//                   <div className="relative">
//                     <span className="absolute left-4 top-4 text-slate-400">₹</span>
//                     <input 
//                       name="price" 
//                       type="number" 
//                       value={formData.price}
//                       onChange={handleInput} 
//                       className="w-full p-4 pl-8 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                       placeholder="150" 
//                       min="0"
//                       step="0.01"
//                       required
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Age</label>
//                   <div className="relative">
//                     <select 
//                       name="age" 
//                       value={formData.age}
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
//                   value={formData.description}
//                   onChange={handleInput} 
//                   className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300 resize-none" 
//                   placeholder="Describe unique selling points, materials, and key features..."
//                   required
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


// "use client";
// import React, { useState, FormEvent, ChangeEvent } from 'react';
// import Transition from '@/components/transition';
// import { Download, RefreshCcw, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

// // Define types for form data
// type FormData = {
//   product: string;
//   region: string;
//   price: string;
//   age: string;
//   description: string;
//   currency: string;
// };

// // Define type for currency
// type Currency = {
//   code: string;
//   symbol: string;
//   name: string;
//   country: string;
// };

// // Define type for status sequence items
// type StatusSequence = {
//   text: string;
//   delay: number;
// };

// // Define step types
// type Step = 'input' | 'processing' | 'result';

// // Define competitor type
// type Competitor = {
//   name: string;
//   price: string;
//   rating: number;
//   features: string[];
//   marketShare: string;
// };

// // Popular world currencies
// const currencies: Currency[] = [
//   { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
//   { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
//   { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
//   { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
//   { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
//   { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
//   { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
//   { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
//   { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
//   { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
//   { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'UAE' },
//   { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia' }
// ];

// // Mock competitor data
// const getCompetitors = (productType: string, currencySymbol: string): Competitor[] => {
//   if (productType.toLowerCase().includes('electric') || productType.toLowerCase().includes('heated')) {
//     return [
//       {
//         name: 'ThermoWear Pro',
//         price: `${currencySymbol}2,999`,
//         rating: 4.2,
//         features: ['USB-C Charging', '3 Heat Levels', 'Water Resistant'],
//         marketShare: '32%'
//       },
//       {
//         name: 'HeatTech Glow',
//         price: `${currencySymbol}3,499`,
//         rating: 4.5,
//         features: ['Fast Heating', 'App Control', 'Battery Pack'],
//         marketShare: '28%'
//       },
//       {
//         name: 'WarmFlex Elite',
//         price: `${currencySymbol}2,799`,
//         rating: 4.0,
//         features: ['Carbon Fiber Heating', 'Adjustable Zones', 'Quick Dry'],
//         marketShare: '22%'
//       },
//       {
//         name: 'CozyCharge Plus',
//         price: `${currencySymbol}3,199`,
//         rating: 4.3,
//         features: ['Wireless Charging', 'Smart Temperature', 'Moisture Wicking'],
//         marketShare: '18%'
//       }
//     ];
//   } else if (productType.toLowerCase().includes('sweater') || productType.toLowerCase().includes('jacket')) {
//     return [
//       {
//         name: 'NorthFace ThermoBall',
//         price: `${currencySymbol}2,299`,
//         rating: 4.6,
//         features: ['Down Alternative', 'Lightweight', 'Packable'],
//         marketShare: '35%'
//       },
//       {
//         name: 'Patagonia Nano Puff',
//         price: `${currencySymbol}3,899`,
//         rating: 4.8,
//         features: ['Recycled Materials', 'Wind Resistant', 'Eco-Friendly'],
//         marketShare: '25%'
//       },
//       {
//         name: 'Columbia HeatZone',
//         price: `${currencySymbol}1,999`,
//         rating: 4.1,
//         features: ['Omni-Heat Tech', 'Breathable', 'Value Pack'],
//         marketShare: '20%'
//       },
//       {
//         name: 'Uniqlo Ultra Warm',
//         price: `${currencySymbol}1,499`,
//         rating: 4.3,
//         features: ['Affordable', 'Basic Design', 'Warmth-to-Weight'],
//         marketShare: '20%'
//       }
//     ];
//   } else {
//     return [
//       {
//         name: 'PremiumTech X1',
//         price: `${currencySymbol}2,500`,
//         rating: 4.4,
//         features: ['Advanced Features', 'Durable Build', 'Warranty'],
//         marketShare: '30%'
//       },
//       {
//         name: 'BudgetChoice Lite',
//         price: `${currencySymbol}1,200`,
//         rating: 3.8,
//         features: ['Cost Effective', 'Basic Functionality', 'Reliable'],
//         marketShare: '25%'
//       },
//       {
//         name: 'InnovatePro Max',
//         price: `${currencySymbol}3,800`,
//         rating: 4.7,
//         features: ['Cutting Edge', 'Premium Materials', 'Smart Integration'],
//         marketShare: '25%'
//       },
//       {
//         name: 'ValuePlus Standard',
//         price: `${currencySymbol}1,800`,
//         rating: 4.0,
//         features: ['Balanced Features', 'Good Quality', 'Popular Choice'],
//         marketShare: '20%'
//       }
//     ];
//   }
// };

// export default function Home() {
//   const [step, setStep] = useState<Step>('input'); 
//   const [statusText, setStatusText] = useState<string>("Initializing...");
   
//   const [formData, setFormData] = useState<FormData>({
//     product: '', 
//     region: '', 
//     price: '', 
//     age: 'All', 
//     description: '',
//     currency: 'INR' // Default currency
//   });

//   // Get selected currency object
//   const selectedCurrency = currencies.find(c => c.code === formData.currency) || currencies[0];
  
//   // Get competitors based on product type
//   const competitors = getCompetitors(formData.product, selectedCurrency.symbol);

//   // Handle input change with proper event typing
//   const handleInput = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     setFormData({
//       ...formData, 
//       [e.target.name]: e.target.value
//     });
//   };
   
//   const isFormValid = 
//     formData.product.trim().length > 0 && 
//     formData.region.trim().length > 0 && 
//     formData.price.toString().trim().length > 0 && 
//     formData.description.trim().length > 0;

//   // Function to generate and download PDF
//   const downloadPDF = async () => {
//     try {
//       // Dynamically import jsPDF
//       const { jsPDF } = await import('jspdf');
      
//       // Create new PDF document with A4 size
//       const doc = new jsPDF('p', 'mm', 'a4');
      
//       // Set document properties
//       doc.setProperties({
//         title: `Synapsee Report - ${formData.product}`,
//         subject: 'Market Intelligence Analysis',
//         author: 'Synapsee AI',
//         keywords: 'market, analysis, intelligence, report',
//         creator: 'Synapsee AI Engine'
//       });
      
//       // Add logo/header section
//       doc.setFillColor(30, 41, 59); // slate-900 color
//       doc.rect(0, 0, 210, 40, 'F');
      
//       doc.setFontSize(24);
//       doc.setTextColor(255, 255, 255);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Synapsee AI', 20, 25);
      
//       doc.setFontSize(12);
//       doc.setTextColor(148, 163, 184); // slate-400
//       doc.setFont('helvetica', 'normal');
//       doc.text('Intelligence Report', 20, 32);
      
//       // Report info section
//       doc.setFontSize(14);
//       doc.setTextColor(0, 0, 0);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Product Analysis Report', 20, 55);
      
//       doc.setFontSize(10);
//       doc.setTextColor(100, 116, 139); // slate-500
//       doc.setFont('helvetica', 'normal');
//       doc.text(`Product: ${formData.product}`, 20, 65);
//       doc.text(`Region: ${formData.region}`, 20, 71);
//       doc.text(`Currency: ${selectedCurrency.code} (${selectedCurrency.symbol})`, 20, 77);
//       doc.text(`Target Age: ${formData.age}`, 20, 83);
//       doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 89);
      
//       // Add separator line
//       doc.setDrawColor(59, 130, 246); // blue-500
//       doc.setLineWidth(0.5);
//       doc.line(20, 95, 190, 95);
      
//       // Executive Summary
//       let yPosition = 105;
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175); // blue-900
//       doc.setFont('helvetica', 'bold');
//       doc.text('Executive Summary & Feasibility', 20, yPosition);
      
//       doc.setFontSize(11);
//       doc.setTextColor(0, 0, 0);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 10;
      
//       const summaryPoints = [
//         `• Market prices range between ${selectedCurrency.symbol}1,200 to ${selectedCurrency.symbol}3,900.`,
//         `• Your product at ${selectedCurrency.symbol}${formData.price} is positioned in the ${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment.`,
//         `• Feasibility analysis shows strong market potential in ${formData.region}.`,
//         `• Recommended entry strategy: Launch with limited inventory in Q4 2024.`
//       ];
      
//       summaryPoints.forEach(point => {
//         if (yPosition > 270) {
//           doc.addPage();
//           yPosition = 20;
//         }
//         doc.text(point, 25, yPosition);
//         yPosition += 7;
//       });
      
//       yPosition += 5;
      
//       // Best Time to Market
//       if (yPosition > 220) {
//         doc.addPage();
//         yPosition = 20;
//       }
      
//       doc.setFontSize(14);
//       doc.setTextColor(30, 64, 175);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Best Time to Market', 20, yPosition);
      
//       doc.setFontSize(11);
//       doc.setTextColor(0, 0, 0);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 8;
      
//       const timingPoints = [
//         `• Primary Window: October to December`,
//         `• Pre-marketing: Begin awareness campaigns from August`,
//         `• Avoid: Heavy marketing from March to June`
//       ];
      
//       timingPoints.forEach(point => {
//         doc.text(point, 25, yPosition);
//         yPosition += 7;
//       });
      
//       yPosition += 10;
      
//       // Manufacturing & Materials
//       if (yPosition > 220) {
//         doc.addPage();
//         yPosition = 20;
//       }
      
//       doc.setFontSize(14);
//       doc.setTextColor(30, 64, 175);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Manufacturing & Materials', 20, yPosition);
      
//       doc.setFontSize(11);
//       doc.setTextColor(0, 0, 0);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 8;
      
//       const manufacturingPoints = [
//         `• Safe Batch Size: Initial limited batch production recommended`,
//         `• Scale manufacturing closer to winter season`,
//         `• Sourcing Strategy: Procure components March–June (lowest demand)`,
//         `• Batteries: Early bulk purchasing advised`
//       ];
      
//       manufacturingPoints.forEach(point => {
//         doc.text(point, 25, yPosition);
//         yPosition += 7;
//       });
      
//       yPosition += 10;
      
//       // Competitor Analysis
//       if (yPosition > 220) {
//         doc.addPage();
//         yPosition = 20;
//       }
      
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Competitor Landscape', 20, yPosition);
      
//       doc.setFontSize(11);
//       doc.setTextColor(0, 0, 0);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 10;
      
//       competitors.forEach((competitor, index) => {
//         if (yPosition > 250) {
//           doc.addPage();
//           yPosition = 20;
//         }
        
//         doc.setFontSize(12);
//         doc.setTextColor(30, 41, 59); // slate-900
//         doc.setFont('helvetica', 'bold');
//         doc.text(`${index + 1}. ${competitor.name}`, 25, yPosition);
        
//         doc.setFontSize(10);
//         doc.setTextColor(0, 0, 0);
//         doc.setFont('helvetica', 'normal');
//         doc.text(`Price: ${competitor.price} | Rating: ${competitor.rating}/5 | Market Share: ${competitor.marketShare}`, 25, yPosition + 6);
        
//         doc.text(`Features: ${competitor.features.join(', ')}`, 25, yPosition + 12);
        
//         yPosition += 25;
//       });
      
//       yPosition += 5;
      
//       // Competitive Insight
//       if (yPosition > 250) {
//         doc.addPage();
//         yPosition = 20;
//       }
      
//       doc.setFontSize(12);
//       doc.setTextColor(146, 64, 14); // amber-800
//       doc.setFont('helvetica', 'bold');
//       doc.text('Competitive Insight:', 20, yPosition);
      
//       doc.setFontSize(10);
//       doc.setTextColor(146, 64, 14);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 7;
//       const insightText = `Your product at ${selectedCurrency.symbol}${formData.price} competes directly with ${competitors[0].name} (${competitors[0].price}) and ${competitors[1].name} (${competitors[1].price}). Differentiate through unique features.`;
//       const splitInsight = doc.splitTextToSize(insightText, 170);
//       doc.text(splitInsight, 20, yPosition);
//       yPosition += splitInsight.length * 6 + 10;
      
//       // Strategic Recommendations
//       if (yPosition > 220) {
//         doc.addPage();
//         yPosition = 20;
//       }
      
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Strategic Recommendations', 20, yPosition);
      
//       doc.setFontSize(11);
//       doc.setTextColor(0, 0, 0);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 10;
      
//       const recommendations = [
//         `• Battery safety and insulation compliance`,
//         `• Comfort and weight optimization`,
//         `• Clear differentiation from regular products`,
//         `• Target Northern India regions with colder winters`,
//         `• Expand to hilly and cold-prone regions`
//       ];
      
//       recommendations.forEach(rec => {
//         if (yPosition > 270) {
//           doc.addPage();
//           yPosition = 20;
//         }
//         doc.text(rec, 25, yPosition);
//         yPosition += 7;
//       });
      
//       // Add footer on all pages
//       const pageCount = doc.getNumberOfPages();
//       for (let i = 1; i <= pageCount; i++) {
//         doc.setPage(i);
//         doc.setFontSize(8);
//         doc.setTextColor(100, 116, 139);
//         doc.setFont('helvetica', 'normal');
//         doc.text(`Page ${i} of ${pageCount}`, 20, 285);
//         doc.text('© 2026 Synapsee AI Inc. - Confidential Report', 105, 285, { align: 'center' });
//         doc.text(`Report ID: ${Date.now()}`, 180, 285, { align: 'right' });
//       }
      
//       // Save the PDF
//       const safeProductName = formData.product.replace(/[^a-z0-9]/gi, '-').toLowerCase();
//       doc.save(`synapsee-report-${safeProductName}-${Date.now()}.pdf`);
      
//     } catch (error) {
//       console.error('Error generating PDF:', error);
//       alert('Error generating PDF. Please try again or use the text report.');
//       downloadTextReport();
//     }
//   };

//   // Fallback function to download text report if PDF fails
//   const downloadTextReport = () => {
//     const reportText = `
// Synapsee AI Market Analysis Report
// ===================================
// Product: ${formData.product}
// Region: ${formData.region}
// Currency: ${selectedCurrency.code} (${selectedCurrency.symbol})
// Price: ${selectedCurrency.symbol}${formData.price}
// Target Age: ${formData.age}
// Generated: ${new Date().toLocaleString()}

// EXECUTIVE SUMMARY & FEASIBILITY
// ================================
// • Market prices range between ${selectedCurrency.symbol}1,200 to ${selectedCurrency.symbol}3,900.
// • Your product at ${selectedCurrency.symbol}${formData.price} is positioned in the ${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment.
// • Feasibility analysis shows strong market potential in ${formData.region}.
// • Recommended entry strategy: Launch with limited inventory in Q4 2024.

// BEST TIME TO MARKET
// ===================
// • Primary Window: October to December
// • Pre-marketing: Begin awareness campaigns from August
// • Avoid: Heavy marketing from March to June

// MANUFACTURING & MATERIALS
// =========================
// • Safe Batch Size: Initial limited batch production recommended
// • Scale manufacturing closer to winter season
// • Sourcing Strategy: Procure components March–June (lowest demand)
// • Batteries: Early bulk purchasing advised

// COMPETITOR LANDSCAPE
// ====================
// ${competitors.map((c, i) => `
// ${i + 1}. ${c.name}
//      Price: ${c.price}
//      Rating: ${c.rating}/5
//      Market Share: ${c.marketShare}
//      Features: ${c.features.join(', ')}
// `).join('')}

// COMPETITIVE INSIGHT
// ===================
// Your product at ${selectedCurrency.symbol}${formData.price} competes directly with ${competitors[0].name} (${competitors[0].price}) and ${competitors[1].name} (${competitors[1].price}). Differentiate through unique features.

// STRATEGIC RECOMMENDATIONS
// =========================
// • Battery safety and insulation compliance
// • Comfort and weight optimization
// • Clear differentiation from regular products
// • Target Northern India regions with colder winters
// • Expand to hilly and cold-prone regions

// © 2026 Synapsee AI Inc. - Confidential Report
//     `;
    
//     const blob = new Blob([reportText], { type: 'text/plain' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `synapsee-report-${formData.product.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(url);
//   };

//   const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!isFormValid) {
//         alert("Please fill in all required fields.");
//         return;
//     }

//     setStep('processing');

//     const sequence: StatusSequence[] = [
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
//     <div class="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      
//       <div class="p-6 md:p-8 bg-blue-50 border-l-8 border-blue-600 rounded-r-lg shadow-sm">
//         <h3 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">Executive Summary & Feasibility</h3>
//         <ul class="space-y-3 text-blue-800 text-base md:text-lg leading-relaxed list-disc pl-5">
//           <li>Market prices range between ${selectedCurrency.symbol}1,200 to ${selectedCurrency.symbol}3,900. Your product at ${selectedCurrency.symbol}${formData.price} is positioned in the ${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment.</li>
//           <li>Feasibility analysis shows ${formData.product} has strong market potential with identified consumer interest in ${formData.region}.</li>
//           <li>Recommended entry strategy: Launch with limited inventory in Q4 2024, expand based on initial sales data.</li>
//         </ul>
//       </div>

//       <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
//         <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
//            <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🚀 Best Time to Market</h4>
//            <ul class="space-y-3 text-slate-700 text-sm md:text-base list-disc pl-5">
//              <li><strong>Primary Window:</strong> October to December based on peak Google Trends interest.</li>
//              <li><strong>Pre-marketing:</strong> Begin awareness campaigns from August to capture rising demand.</li>
//              <li><strong>Avoid:</strong> Heavy marketing from March to June due to consistently low interest levels.</li>
//            </ul>
//         </div>
        
//         <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
//            <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🏭 Manufacturing & Materials</h4>
           
//            <p class="font-semibold text-slate-800 mb-2">Safe Batch Size:</p>
//            <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5 mb-4">
//              <li>Initial limited batch production recommended due to premium pricing and niche demand.</li>
//              <li>Scale manufacturing closer to winter season after early validation.</li>
//            </ul>

//            <p class="font-semibold text-slate-800 mb-2">Sourcing Strategy:</p>
//            <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5">
//              <li>Procure batteries and heating elements March–June (lowest demand).</li>
//              <li>Cardigans/Apparel: Source year-round with bulk discounts in off-season.</li>
//              <li>Batteries: Early bulk purchasing advised due to long-term inflation.</li>
//            </ul>
//         </div>
//       </div>

//       <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
//         <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Competitor Landscape</h3>
//         <div class="space-y-6">
//           ${competitors.map(competitor => `
//             <div class="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
//               <div class="flex justify-between items-start flex-wrap gap-2">
//                 <div>
//                   <h4 class="font-bold text-slate-800 text-lg">${competitor.name}</h4>
//                   <p class="text-slate-600">Price: <span class="font-semibold">${competitor.price}</span></p>
//                 </div>
//                 <div class="flex items-center gap-3">
//                   <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
//                     ${competitor.rating}★ Rating
//                   </div>
//                   <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
//                     ${competitor.marketShare} Market Share
//                   </div>
//                 </div>
//               </div>
//               <div class="mt-3">
//                 <p class="text-slate-700 font-medium mb-1">Key Features:</p>
//                 <div class="flex flex-wrap gap-2">
//                   ${competitor.features.map(feature => `
//                     <span class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs">
//                       ${feature}
//                     </span>
//                   `).join('')}
//                 </div>
//               </div>
//             </div>
//           `).join('')}
//         </div>
//         <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
//           <div class="flex items-start gap-3">
//             <span class="text-amber-500 text-xl">⚠</span>
//             <div>
//               <p class="font-semibold text-amber-800">Competitive Insight:</p>
//               <p class="text-amber-700 text-sm mt-1">Your product at ${selectedCurrency.symbol}${formData.price} competes directly with ${competitors[0].name} (${competitors[0].price}) and ${competitors[1].name} (${competitors[1].price}). Differentiate through unique features in your description.</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
//          <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Strategic Recommendations</h3>
         
//          <div class="mb-6">
//            <h4 class="font-bold text-slate-700 text-lg mb-3">Key Factors to Include</h4>
//            <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
//              <li>Battery safety and insulation compliance.</li>
//              <li>Comfort and weight optimization due to embedded heating elements.</li>
//              <li>Clear differentiation from regular sweaters through heating performance and battery life.</li>
//            </ul>
//          </div>

//          <div>
//            <h4 class="font-bold text-slate-700 text-lg mb-3">Target Region Expansion</h4>
//            <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
//              <li>Northern India regions with colder winters (Delhi, Haryana, Rajasthan).</li>
//              <li>Hilly and cold-prone regions within India where winter apparel demand is higher.</li>
//            </ul>
//          </div>
//       </div>
//     </div>
//   `;

//   // Loading/Processing state
//   if (step === 'processing') {
//     return <Transition status={statusText} />;
//   }

//   // Result state
//   if (step === 'result') {
//     return (
//       <div className="min-h-screen w-screen bg-slate-50 flex flex-col">
//         {/* Responsive Header: Flex Col on Mobile, Row on Desktop */}
//         <div className="bg-slate-900 text-white px-4 md:px-8 py-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-40 gap-4 md:gap-0">
//           <div>
//             <h1 className="text-xl md:text-2xl font-bold tracking-tight">Intelligence Report</h1>
//             <p className="text-slate-400 text-xs md:text-sm mt-0.5">{formData.product} • {formData.region} • {selectedCurrency.code}</p>
//           </div>
          
//           <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
//              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase text-[10px] md:text-xs font-bold tracking-wider">
//                 <CheckCircle size={14} className="md:w-4 md:h-4" /> Verified
//              </div>
             
//              <button 
//                type="button"
//                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25 text-sm md:text-base"
//                onClick={downloadPDF}
//              >
//                <Download size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Download</span> PDF
//              </button>

//              <button 
//                type="button"
//                onClick={() => setStep('input')}
//                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold transition-colors text-sm md:text-base ml-auto md:ml-0"
//              >
//                <RefreshCcw size={16} className="md:w-[18px] md:h-[18px]" /> New
//              </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 md:p-8">
//           <div 
//             className="prose max-w-none text-slate-800"
//             dangerouslySetInnerHTML={{ __html: reportHtml }} 
//           />
//         </div>
//       </div>
//     );
//   }

//   // Input form state (default)
//   return (
//     <div className="flex h-screen w-screen bg-white overflow-hidden">
        
//         {/* Left Side: Hidden on Mobile/Tablet (lg:flex) */}
//         <div className="hidden lg:flex w-1/3 relative flex-col justify-between p-12 text-white">
          
//           <div 
//             className="absolute inset-0 bg-cover bg-center z-0" 
//             style={{ backgroundImage: "url('/logo.png')" }}
//             role="img"
//             aria-label="Synapsee AI background"
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

//         {/* Right Side: Adjusted padding for mobile */}
//         <div className="w-full lg:w-2/3 h-full overflow-y-auto bg-slate-50 flex items-center justify-center p-6 md:p-16">
//           <div className="w-full max-w-2xl">
            
//             {/* Mobile Header (Only visible on small screens to replace the hidden left sidebar) */}
//             <div className="lg:hidden mb-8 border-b pb-6 border-slate-200">
//                 <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Synapsee-AI</h1>
//                 <p className="text-slate-500 text-sm mt-1">Agentic Market Intelligence & Feasibility Engine</p>
//             </div>

//             <div className="mb-8 md:mb-10">
//                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">New Analysis</h2>
//                <p className="text-slate-500 text-base md:text-lg">Enter product details to launch the agent swarm.</p>
//             </div>
           
//             <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name <span className="text-red-500">*</span></label>
//                   <input 
//                     name="product" 
//                     value={formData.product}
//                     onChange={handleInput} 
//                     className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                     placeholder="e.g. Heated Jacket" 
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Region <span className="text-red-500">*</span></label>
//                   <input 
//                     name="region" 
//                     value={formData.region}
//                     onChange={handleInput} 
//                     className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                     placeholder="e.g. Toronto, Canada" 
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Max Price <span className="text-red-500">*</span></label>
//                   <div className="relative">
//                     <span className="absolute left-4 top-4 text-slate-400 font-medium text-lg">{selectedCurrency.symbol}</span>
//                     <input 
//                       name="price" 
//                       type="number" 
//                       value={formData.price}
//                       onChange={handleInput} 
//                       className="w-full p-4 pl-10 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
//                       placeholder="3499" 
//                       min="0"
//                       step="0.01"
//                       required
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Currency <span className="text-red-500">*</span></label>
//                   <div className="relative">
//                     <select 
//                       name="currency" 
//                       value={formData.currency}
//                       onChange={handleInput} 
//                       className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
//                     >
//                       {currencies.map((currency) => (
//                         <option key={currency.code} value={currency.code}>
//                           {currency.symbol} {currency.code} - {currency.name}
//                         </option>
//                       ))}
//                     </select>
//                     <div className="absolute right-4 top-5 pointer-events-none text-slate-400">▼</div>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Age</label>
//                 <div className="relative">
//                   <select 
//                     name="age" 
//                     value={formData.age}
//                     onChange={handleInput} 
//                     className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
//                   >
//                     <option value="All">All Demographics</option>
//                     <option value="18-25">Gen Z (18-25)</option>
//                     <option value="26-40">Millennials (26-40)</option>
//                     <option value="40+">Gen X & Boomers (40+)</option>
//                   </select>
//                   <div className="absolute right-4 top-5 pointer-events-none text-slate-400">▼</div>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Description <span className="text-red-500">*</span></label>
//                 <textarea 
//                   name="description" 
//                   rows={4}
//                   value={formData.description}
//                   onChange={handleInput} 
//                   className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300 resize-none" 
//                   placeholder="Describe unique selling points, materials, and key features..."
//                   required
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
import React, { useState, FormEvent, ChangeEvent } from 'react';
import Transition from '@/components/transition';
import { Download, RefreshCcw, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

// Define types for form data
type FormData = {
  product: string;
  region: string;
  price: string;
  age: string;
  description: string;
  currency: string;
};

// Define type for currency
type Currency = {
  code: string;
  symbol: string;
  name: string;
  country: string;
};

// Define type for status sequence items
type StatusSequence = {
  text: string;
  delay: number;
};

// Define step types
type Step = 'input' | 'processing' | 'result';

// Define competitor type
type Competitor = {
  name: string;
  price: string;
  rating: number;
  features: string[];
  reviews_found: string; 
};

// Popular world currencies
const currencies: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'UAE' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia' }
];

// Mock competitor data
const getCompetitors = (productType: string, currencySymbol: string): Competitor[] => {
  if (productType.toLowerCase().includes('electric') || productType.toLowerCase().includes('heated')) {
    return [
      {
        name: 'MYHEAT',
        price: `${currencySymbol}2,999`,
        rating: 3.9,
        features: ['USB-C Charging', '5000mAh battery', 'Water Resistant'],
        reviews_found: 8,
      },
      {
        name: 'brrf',
        price: `${currencySymbol} 2,366`,
        rating: 3.6,
        features: ['Fast Heating', 'App Control', '10000 mAh Battery Pack'],
        reviews_found: 2 
      },
      {
        name: 'KACHEEG',
        price: `${currencySymbol}5,496`,
        rating: 2.1,
        features: ['Carbon Fiber Heating', 'Adjustable Zones', 'Quick Dry'],
        reviews_found: 5, 
      },
      {
        name: 'Tapish',
        price: `${currencySymbol}3,324`,
        rating: 4.6,
        features: ['Wireless Charging', 'Smart Temperature', 'Moisture Wicking'],
        reviews_found: 8, 
      }
    ];
  } else if (productType.toLowerCase().includes('sweater') || productType.toLowerCase().includes('jacket')) {
    return [
      {
        name: 'MYHEAT',
        price: `${currencySymbol}2,999`,
        rating: 3.9,
        features: ['USB-C Charging', '5000mAh battery', 'Water Resistant'],
        reviews_found: 8,
      },
      {
        name: 'brrf',
        price: `${currencySymbol} 2,366`,
        rating: 3.6,
        features: ['Fast Heating', 'App Control', '10000 mAh Battery Pack'],
        reviews_found: 2 
      },
      {
        name: 'KACHEEG',
        price: `${currencySymbol}5,496`,
        rating: 2.1,
        features: ['Carbon Fiber Heating', 'Adjustable Zones', 'Quick Dry'],
        reviews_found: 5, 
      },
      {
        name: 'Tapish',
        price: `${currencySymbol}3,324`,
        rating: 4.6,
        features: ['Wireless Charging', 'Smart Temperature', 'Moisture Wicking'],
        reviews_found: 8, 
      }
    ];
  } else {
    return [
      {
        name: 'MYHEAT',
        price: `${currencySymbol}2,999`,
        rating: 3.9,
        features: ['USB-C Charging', '5000mAh battery', 'Water Resistant'],
        reviews_found: 8,
      },
      {
        name: 'brrf',
        price: `${currencySymbol} 2,366`,
        rating: 3.6,
        features: ['Fast Heating', 'App Control', '10000 mAh Battery Pack'],
        reviews_found: 2 
      },
      {
        name: 'KACHEEG',
        price: `${currencySymbol}5,496`,
        rating: 2.1,
        features: ['Carbon Fiber Heating', 'Adjustable Zones', 'Quick Dry'],
        reviews_found: 5, 
      },
      {
        name: 'Tapish',
        price: `${currencySymbol}3,324`,
        rating: 4.6,
        features: ['Wireless Charging', 'Smart Temperature', 'Moisture Wicking'],
        reviews_found: 8, 
      }
    ];
  }
};

export default function Home() {
  const [step, setStep] = useState<Step>('input'); 
  const [statusText, setStatusText] = useState<string>("Initializing...");
   
  const [formData, setFormData] = useState<FormData>({
    product: '', 
    region: '', 
    price: '', 
    age: 'All', 
    description: '',
    currency: 'INR' // Default currency
  });

  // Get selected currency object
  const selectedCurrency = currencies.find(c => c.code === formData.currency) || currencies[0];
  
  // Get competitors based on product type
  const competitors = getCompetitors(formData.product, selectedCurrency.symbol);

  // Handle input change with proper event typing
  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData, 
      [e.target.name]: e.target.value
    });
  };
   
  const isFormValid = 
    formData.product.trim().length > 0 && 
    formData.region.trim().length > 0 && 
    formData.price.toString().trim().length > 0 && 
    formData.description.trim().length > 0;

  // Function to load and add logo image to PDF
  const addLogoToPDF = async (doc: any, x: number, y: number, width: number, height: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = 'logo.png';
        
        img.onload = () => {
          try {
            // Add image to PDF
            doc.addImage(img, 'PNG', x, y, width, height);
            resolve();
          } catch (error) {
            console.error('Error adding image to PDF:', error);
            // Fallback: Add text logo
            doc.setFontSize(12);
            doc.setTextColor(96, 165, 250);
            doc.setFont('helvetica', 'bold');
            doc.text('Synapsee AI', x, y + height/2);
            resolve();
          }
        };
        
        img.onerror = () => {
          // Fallback if image fails to load
          doc.setFontSize(12);
          doc.setTextColor(96, 165, 250);
          doc.setFont('helvetica', 'bold');
          doc.text('Synapsee AI', x, y + height/2);
          resolve();
        };
        
        // Set timeout in case image takes too long
        setTimeout(() => {
          if (!img.complete) {
            doc.setFontSize(12);
            doc.setTextColor(96, 165, 250);
            doc.setFont('helvetica', 'bold');
            doc.text('Synapsee AI', x, y + height/2);
            resolve();
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error in addLogoToPDF:', error);
        // Fallback
        doc.setFontSize(12);
        doc.setTextColor(96, 165, 250);
        doc.setFont('helvetica', 'bold');
        doc.text('Synapsee AI', x, y + height/2);
        resolve();
      }
    });
  };

  // Function to generate and download PDF
//   const downloadPDF = async () => {
//     try {
//       // Dynamically import jsPDF
//       const { jsPDF } = await import('jspdf');
      
//       // Create new PDF document with A4 size
//       const doc = new jsPDF('p', 'mm', 'a4');
      
//       // Set document properties
//       doc.setProperties({
//         title: `Synapsee Report - ${formData.product}`,
//         subject: 'Market Intelligence Analysis',
//         author: 'Synapsee AI',
//         keywords: 'market, analysis, intelligence, report',
//         creator: 'Synapsee AI Engine'
//       });
      
//       // ===== PAGE 1: HEADER AND EXECUTIVE SUMMARY =====
      
//       // Add professional header with logo
//       doc.setFillColor(30, 41, 59); // slate-900 color
//       doc.rect(0, 0, 210, 50, 'F');
      
//       // Add logo on top right
//       await addLogoToPDF(doc, 150, 10, 50, 30);
      
//       // Add report title on left
//       doc.setFontSize(24);
//       doc.setTextColor(255, 255, 255);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Intelligence Report', 20, 30);
      
//       doc.setFontSize(12);
//       doc.setTextColor(148, 163, 184); // slate-400
//       doc.setFont('helvetica', 'normal');
//       doc.text('Agentic Market Intelligence & Feasibility Engine', 20, 37);
      
//       // Report info section
//       doc.setFillColor(241, 245, 249); // slate-50
//       doc.roundedRect(20, 60, 170, 35, 5, 5, 'F');
      
//       doc.setDrawColor(59, 130, 246); // blue-500
//       doc.setLineWidth(1);
//       doc.line(20, 60, 190, 60);
      
//       doc.setFontSize(14);
//       doc.setTextColor(30, 41, 59); // slate-900
//       doc.setFont('helvetica', 'bold');
//       doc.text('Product Analysis Summary', 25, 70);
      
//       doc.setFontSize(10);
//       doc.setTextColor(71, 85, 105); // slate-600
//       doc.setFont('helvetica', 'normal');
      
//       // Create two columns for details
//       const detailsLeft = [
//         `Product: ${formData.product}`,
//         `Region: ${formData.region}`,
//         `Currency: ${selectedCurrency.code}`
//       ];
      
//       const detailsRight = [
//         `Target Price: ${selectedCurrency.symbol}${formData.price}`,
//         `Target Age: ${formData.age}`,
//         `Report Date: ${new Date().toLocaleDateString()}`
//       ];
      
//       let yPos = 78;
//       detailsLeft.forEach((detail, index) => {
//         doc.text(detail, 25, yPos);
//         if (detailsRight[index]) {
//           doc.text(detailsRight[index], 110, yPos);
//         }
//         yPos += 6;
//       });
      
//       // Add section separator
//       doc.setDrawColor(59, 130, 246);
//       doc.setLineWidth(0.5);
//       doc.line(20, 100, 190, 100);
      
//       // 1. EXECUTIVE SUMMARY
//       let yPosition = 110;
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175); // blue-900
//       doc.setFont('helvetica', 'bold');
//       doc.text('1. Executive Summary & Feasibility', 20, yPosition);
      
//       // Add icon before title
//       doc.setFontSize(12);
//       doc.text('📊', 10, yPosition);
      
//       doc.setFontSize(10);
//       doc.setTextColor(30, 41, 59); // slate-900
//       doc.setFont('helvetica', 'normal');
//       yPosition += 8;
      
//       const summaryLines = doc.splitTextToSize(
//         `Market analysis for "${formData.product}" in ${formData.region} indicates strong potential. ` +
//         `Your proposed price of ${selectedCurrency.symbol}${formData.price} positions the product in the ` +
//         `${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment, competing with established brands. ` +
//         `Feasibility assessment shows favorable conditions for market entry with proper strategy.`,
//         170
//       );
      
//       doc.text(summaryLines, 25, yPosition);
//       yPosition += summaryLines.length * 5 + 10;
      
//       // Key findings box
//       doc.setFillColor(239, 246, 255); // blue-50
//       doc.roundedRect(20, yPosition, 170, 25, 3, 3, 'F');
      
//       doc.setFontSize(9);
//       doc.setTextColor(30, 64, 175); // blue-900
//       doc.setFont('helvetica', 'bold');
//       doc.text('Key Findings:', 25, yPosition + 7);
      
//       doc.setFontSize(9);
//       doc.setTextColor(30, 41, 59);
//       doc.setFont('helvetica', 'normal');
//       const findings = [
//         `• Market prices: ${selectedCurrency.symbol}1,200 - ${selectedCurrency.symbol}3,900`,
//         `• Your position: ${selectedCurrency.symbol}${formData.price} (${parseInt(formData.price) > 3000 ? 'Premium' : 'Mid-range'})`,
//         `• Recommended: Limited launch in Q4 2024`
//       ];
      
//       findings.forEach((finding, index) => {
//         doc.text(finding, 25, yPosition + 7 + (index + 1) * 5);
//       });
      
//       yPosition += 35;
      
//       // 2. MARKET TIMING
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175);
//       doc.setFont('helvetica', 'bold');
//       doc.text('2. Best Time to Market', 20, yPosition);
//       doc.text('⏰', 10, yPosition);
      
//       // Timeline visualization
//       doc.setFillColor(255, 255, 255);
//       doc.roundedRect(20, yPosition + 5, 170, 30, 3, 3, 'F');
//       doc.setDrawColor(226, 232, 240);
//       doc.setLineWidth(0.5);
//       doc.rect(20, yPosition + 5, 170, 30);
      
//       doc.setFontSize(9);
//       doc.setTextColor(100, 116, 139);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Marketing Timeline', 25, yPosition + 15);
      
//       // Draw timeline
//       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//       const monthWidth = 170 / 12;
      
//       for (let i = 0; i < 12; i++) {
//         const x = 20 + i * monthWidth;
//         doc.setFontSize(7);
//         doc.setTextColor(100, 116, 139);
//         doc.text(months[i], x + monthWidth/2 - 5, yPosition + 25, { align: 'center' });
        
//         // Highlight optimal months
//         if ([7, 8, 9, 10, 11].includes(i)) { // Aug to Dec
//           doc.setFillColor(34, 197, 94); // green for good months
//           doc.rect(x + 2, yPosition + 27, monthWidth - 4, 3, 'F');
//         }
        
//         if ([2, 3, 4, 5].includes(i)) { // Mar to Jun
//           doc.setFillColor(239, 68, 68); // red for avoid months
//           doc.rect(x + 2, yPosition + 27, monthWidth - 4, 3, 'F');
//         }
//       }
      
//       // Add legend
//       doc.setFillColor(34, 197, 94);
//       doc.rect(25, yPosition + 33, 5, 3, 'F');
//       doc.setFontSize(7);
//       doc.setTextColor(30, 41, 59);
//       doc.text('Optimal', 32, yPosition + 35);
      
//       doc.setFillColor(239, 68, 68);
//       doc.rect(60, yPosition + 33, 5, 3, 'F');
//       doc.text('Avoid', 67, yPosition + 35);
      
//       // Add footer for page 1
//       doc.setFillColor(30, 41, 59);
//       doc.rect(0, 280, 210, 20, 'F');
      
//       doc.setFontSize(9);
//       doc.setTextColor(148, 163, 184);
//       doc.setFont('helvetica', 'normal');
//       doc.text('Page 1 of 3', 20, 290);
//       doc.text('© 2026 Synapsee AI Inc. • Confidential Report', 105, 290, { align: 'center' });
      
//       // Add small logo in footer
//       await addLogoToPDF(doc, 85, 285, 40, 10);
      
//       // ===== PAGE 2: MANUFACTURING & COMPETITORS =====
//       doc.addPage();
      
//       // Header for page 2
//       doc.setFillColor(30, 41, 59);
//       doc.rect(0, 0, 210, 30, 'F');
//       await addLogoToPDF(doc, 150, 5, 50, 20);
      
//       doc.setFontSize(16);
//       doc.setTextColor(255, 255, 255);
//       doc.setFont('helvetica', 'bold');
//       doc.text('Market Intelligence Report', 20, 20);
      
//       // 3. MANUFACTURING & MATERIALS
//       yPosition = 40;
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175);
//       doc.setFont('helvetica', 'bold');
//       doc.text('3. Manufacturing & Materials', 20, yPosition);
//       doc.text('🏭', 10, yPosition);
      
//       doc.setFontSize(10);
//       doc.setTextColor(30, 41, 59);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 8;
      
//       const manufacturingPoints = [
//         'Safe Batch Size:',
//         '• Initial limited batch production recommended',
//         '• Scale manufacturing closer to winter season',
//         '',
//         'Sourcing Strategy:',
//         '• Procure batteries and heating elements March–June',
//         '• Cardigans/Apparel: Source year-round with bulk discounts',
//         '• Batteries: Early bulk purchasing advised'
//       ];
      
//       manufacturingPoints.forEach(point => {
//         if (point.includes(':')) {
//           doc.setFont('helvetica', 'bold');
//           doc.text(point, 25, yPosition);
//           doc.setFont('helvetica', 'normal');
//         } else if (point.startsWith('•')) {
//           doc.text(point, 28, yPosition);
//         } else {
//           yPosition -= 3;
//         }
//         yPosition += 5;
//       });
      
//       yPosition += 10;
      
//       // 4. COMPETITOR ANALYSIS
// // 4. COMPETITOR ANALYSIS
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175); // blue-900
//       doc.setFont('helvetica', 'bold');
//       doc.text('4. Competitor Landscape', 20, yPosition);
//       doc.text('⚔️', 10, yPosition);
      
//       doc.setFontSize(10);
//       doc.setTextColor(30, 41, 59); // slate-900
//       doc.setFont('helvetica', 'normal');
//       yPosition += 10;
      
//       // FIX: Use a standard 'for' loop instead of 'forEach' to allow await
//       for (let index = 0; index < competitors.length; index++) {
//         const competitor = competitors[index];
        
//         // Competitor card styling
//         if (index % 2 === 0) {
//           doc.setFillColor(248, 250, 252); // slate-50 for even rows
//         } else {
//           doc.setFillColor(255, 255, 255); // white for odd rows
//         }
        
//         // Draw card background
//         doc.roundedRect(20, yPosition - 5, 170, 35, 3, 3, 'F');
//         doc.setDrawColor(226, 232, 240);
//         doc.setLineWidth(0.2);
//         doc.rect(20, yPosition - 5, 170, 35);
        
//         // Competitor name
//         doc.setFontSize(11);
//         doc.setTextColor(30, 41, 59);
//         doc.setFont('helvetica', 'bold');
//         doc.text(`${index + 1}. ${competitor.name}`, 25, yPosition);
        
//         // Price
//         doc.setFontSize(10);
//         doc.setTextColor(59, 130, 246);
//         doc.text(competitor.price, 150, yPosition, { align: 'right' });
        
//         // Rating stars
//         doc.setFontSize(9);
//         doc.setTextColor(245, 158, 11);
//         let stars = '';
//         for (let i = 1; i <= 5; i++) {
//           stars += i <= competitor.rating ? '★' : '☆';
//         }
//         doc.text(stars, 25, yPosition + 6);
        
//         // Market share
//         doc.setFontSize(9);
//         doc.setTextColor(34, 197, 94);
//         doc.text(`Market Share: ${competitor.marketShare}`, 25, yPosition + 12);
        
//         // Features
//         doc.setFontSize(8);
//         doc.setTextColor(100, 116, 139);
//         const featuresText = `Features: ${competitor.features.join(', ')}`;
//         const splitFeatures = doc.splitTextToSize(featuresText, 140);
//         doc.text(splitFeatures, 25, yPosition + 18);
        
//         // Increment Y position for next card
//         yPosition += 40;
        
//         // Pagination Logic
//         if (yPosition > 250 && index < competitors.length - 1) {
//           // Footer for current page
//           doc.setFillColor(30, 41, 59);
//           doc.rect(0, 280, 210, 20, 'F');
//           doc.setFontSize(9);
//           doc.setTextColor(148, 163, 184);
//           doc.text('Page 2 of 3', 20, 290);
//           doc.text('© 2026 Synapsee AI Inc. • Confidential Report', 105, 290, { align: 'center' });
          
//           doc.addPage();
          
//           // Header for new page
//           doc.setFillColor(30, 41, 59);
//           doc.rect(0, 0, 210, 30, 'F');
          
//           // AWAIT WORKS HERE NOW
//           await addLogoToPDF(doc, 150, 5, 50, 20);
          
//           doc.setFontSize(16);
//           doc.setTextColor(255, 255, 255);
//           doc.setFont('helvetica', 'bold');
//           doc.text('Competitor Analysis (Continued)', 20, 20);
          
//           yPosition = 40;
//         }
//       }
      
//       yPosition += 10;
      
//       // Competitive Insight
//       doc.setFillColor(254, 252, 232); // amber-50
//       doc.roundedRect(20, yPosition, 170, 25, 3, 3, 'F');
//       doc.setDrawColor(253, 230, 138);
//       doc.setLineWidth(0.5);
//       doc.rect(20, yPosition, 170, 25);
//       // 4. COMPETITOR ANALYSIS
// // 4. COMPETITOR ANALYSIS
//       doc.setFontSize(16);
//       doc.setTextColor(30, 64, 175);
//       doc.setFont('helvetica', 'bold');
//       doc.text('4. Competitor Landscape', 20, yPosition);
//       doc.text('⚔️', 10, yPosition);
      
//       doc.setFontSize(10);
//       doc.setTextColor(30, 41, 59);
//       doc.setFont('helvetica', 'normal');
//       yPosition += 10;
      
//       // CHANGE: Use a standard for loop instead of forEach to support await
//       for (let index = 0; index < competitors.length; index++) {
//         const competitor = competitors[index];

//         // Competitor card
//         if (index % 2 === 0) {
//           doc.setFillColor(248, 250, 252); // slate-50 for even rows
//         } else {
//           doc.setFillColor(255, 255, 255); // white for odd rows
//         }
//         doc.roundedRect(20, yPosition - 5, 170, 35, 3, 3, 'F');
//         doc.setDrawColor(226, 232, 240);
//         doc.setLineWidth(0.2);
//         doc.rect(20, yPosition - 5, 170, 35);
        
//         // Competitor name and price
//         doc.setFontSize(11);
//         doc.setTextColor(30, 41, 59);
//         doc.setFont('helvetica', 'bold');
//         doc.text(`${index + 1}. ${competitor.name}`, 25, yPosition);
        
//         doc.setFontSize(10);
//         doc.setTextColor(59, 130, 246);
//         doc.text(competitor.price, 150, yPosition, { align: 'right' });
        
//         // Rating stars
//         doc.setFontSize(9);
//         doc.setTextColor(245, 158, 11);
//         let stars = '';
//         for (let i = 1; i <= 5; i++) {
//           stars += i <= competitor.rating ? '★' : '☆';
//         }
//         doc.text(stars, 25, yPosition + 6);
        
//         // Market share
//         doc.setFontSize(9);
//         doc.setTextColor(34, 197, 94);
//         doc.text(`Market Share: ${competitor.marketShare}`, 25, yPosition + 12);
        
//         // Features
//         doc.setFontSize(8);
//         doc.setTextColor(100, 116, 139);
//         const featuresText = `Features: ${competitor.features.join(', ')}`;
//         const splitFeatures = doc.splitTextToSize(featuresText, 140);
//         doc.text(splitFeatures, 25, yPosition + 18);
        
//         yPosition += 40;
        
//         // Add new page if running out of space
//         if (yPosition > 250 && index < competitors.length - 1) {
//           // Footer for page 2
//           doc.setFillColor(30, 41, 59);
//           doc.rect(0, 280, 210, 20, 'F');
//           doc.setFontSize(9);
//           doc.setTextColor(148, 163, 184);
//           doc.text('Page 2 of 3', 20, 290);
//           doc.text('© 2026 Synapsee AI Inc. • Confidential Report', 105, 290, { align: 'center' });
          
//           doc.addPage();
          
//           // Header for new page
//           doc.setFillColor(30, 41, 59);
//           doc.rect(0, 0, 210, 30, 'F');
          
//           // NOW THIS AWAIT WORKS CORRECTLY
//           await addLogoToPDF(doc, 150, 5, 50, 20);
          
//           doc.setFontSize(16);
//           doc.setTextColor(255, 255, 255);
//           doc.setFont('helvetica', 'bold');
//           doc.text('Competitor Analysis (Continued)', 20, 20);
          
//           yPosition = 40;
//         }
//       }
// yPosition += 10;
//       // Conclusion box
//       doc.setFillColor(240, 253, 244); // green-50
//       doc.roundedRect(20, yPosition, 170, 40, 3, 3, 'F');
//       doc.setDrawColor(134, 239, 172);
//       doc.setLineWidth(0.5);
//       doc.rect(20, yPosition, 170, 40);
      
//       doc.setFontSize(11);
//       doc.setTextColor(22, 101, 52); // green-900
//       doc.setFont('helvetica', 'bold');
//       doc.text('Final Assessment', 25, yPosition + 10);
      
//       doc.setFontSize(9);
//       doc.setTextColor(22, 101, 52);
//       doc.setFont('helvetica', 'normal');
//       const conclusionText = `Based on comprehensive analysis, ${formData.product} shows strong market viability in ${formData.region}. ` +
//         `With strategic implementation of the above recommendations and careful monitoring of competitor moves, ` +
//         `successful market entry and growth can be achieved.`;
//       const splitConclusion = doc.splitTextToSize(conclusionText, 160);
//       doc.text(splitConclusion, 25, yPosition + 17);
      
//       // Footer for page 3
//       doc.setFillColor(30, 41, 59);
//       doc.rect(0, 280, 210, 20, 'F');
      
//       doc.setFontSize(9);
//       doc.setTextColor(148, 163, 184);
//       doc.setFont('helvetica', 'normal');
//       doc.text('Page 3 of 3', 20, 290);
//       doc.text('© 2026 Synapsee AI Inc. • Confidential Report', 105, 290, { align: 'center' });
      
//       const reportId = Date.now().toString().slice(-8);
//       doc.text(`Report ID: ${reportId}`, 190, 290, { align: 'right' });
      
//       // Save the PDF
//       const safeProductName = formData.product.replace(/[^a-z0-9]/gi, '-').toLowerCase();
//       doc.save(`synapsee-report-${safeProductName}-${Date.now()}.pdf`);
      
//     } catch (error) {
//       console.error('Error generating PDF:', error);
//       alert('Error generating PDF. Please try again or use the text report.');
//       downloadTextReport();
//     }
//   };

   // Function to generate and download PDF
  const downloadPDF = async () => {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Create new PDF document
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Define a safe currency code (e.g., "INR") instead of symbol
      const currencyCode = selectedCurrency.code; 

      // ===== PAGE 1: HEADER =====
      
      // Header Background
      doc.setFillColor(255, 255, 255); // slate-900
      doc.rect(0, 0, 210, 50, 'F');
      
      // Logo (Async wait)
      await addLogoToPDF(doc, 150, 10, 50, 30);
      
      // Title
      doc.setFontSize(24);
      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      doc.text('Market Analysis Report', 20, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.text('Agentic Market Intelligence & Feasibility Engine', 20, 37);
      
      // Product Summary Box
      doc.setFillColor(241, 245, 249); // slate-50
      doc.roundedRect(20, 60, 170, 35, 5, 5, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('Product Analysis Summary', 25, 70);
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      
      // Clean Text Details
      const detailsLeft = [
        `Product: ${formData.product}`,
        `Region: ${formData.region}`,
        `Currency: ${selectedCurrency.name}`
      ];
      
      const detailsRight = [
        `Target Price: ${currencyCode} ${formData.price}`,
        `Target Age: ${formData.age}`,
        `Date: ${new Date().toLocaleDateString()}`
      ];
      
      let yPos = 78;
      detailsLeft.forEach((detail, index) => {
        doc.text(detail, 25, yPos);
        if (detailsRight[index]) {
          doc.text(detailsRight[index], 110, yPos);
        }
        yPos += 6;
      });
      
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 100, 190, 100);
      
      // ===== 1. EXECUTIVE SUMMARY =====
      let yPosition = 110;
      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      // REMOVED EMOJI HERE
      doc.text('1. Executive Summary & Feasibility', 20, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;
      
      const summaryLines = doc.splitTextToSize(
        `Market analysis for "${formData.product}" in ${formData.region} indicates strong potential. ` +
        `Your proposed price of ${currencyCode} ${formData.price} positions the product in the ` +
        `${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment. ` +
        `Feasibility assessment shows favorable conditions.`,
        170
      );
      
      doc.text(summaryLines, 25, yPosition);
      yPosition += summaryLines.length * 5 + 10;
      
      // Key Findings (Blue Box)
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(20, yPosition, 170, 30, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Findings:', 25, yPosition + 8);
      
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      
      // CHANGED BULLETS (•) TO DASHES (-)
      const findings = [
        `- Market prices: ${currencyCode} 1,200 - ${currencyCode} 3,900`,
        `- Your position: ${currencyCode} ${formData.price} (${parseInt(formData.price) > 3000 ? 'Premium' : 'Mid-range'})`,
        `- Recommended: Limited launch in Q4 2026`
      ];
      
      findings.forEach((finding, index) => {
        doc.text(finding, 25, yPosition + 8 + (index + 1) * 5);
      });
      
      yPosition += 40;
      
      // ===== 2. MARKET TIMING =====
      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      // REMOVED EMOJI HERE
      doc.text('2. Best Time to Market', 20, yPosition);
      
      // Timeline Visual
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, yPosition + 5, 170, 30, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      // doc.rect(20, yPosition + 5, 170, 30);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Marketing Timeline', 25, yPosition + 15);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthWidth = 170 / 12;
      
      for (let i = 0; i < 12; i++) {
        const x = 20 + i * monthWidth;
        doc.setFontSize(7);
        doc.text(months[i], x + monthWidth/2 - 5, yPosition + 25);
        
        // Green bars (Good months)
        if ([7, 8, 9, 10, 11].includes(i)) { 
          doc.setFillColor(34, 197, 94); 
          doc.rect(x + 2, yPosition + 27, monthWidth - 4, 3, 'F');
        }
        // Red bars (Bad months)
        if ([2, 3, 4, 5].includes(i)) { 
          doc.setFillColor(239, 68, 68); 
          doc.rect(x + 2, yPosition + 27, monthWidth - 4, 3, 'F');
        }
      }

      // Legend
      doc.setFillColor(34, 197, 94);
      doc.rect(25, yPosition + 33, 5, 3, 'F');
      doc.text('Optimal', 32, yPosition + 35);
      
      doc.setFillColor(239, 68, 68);
      doc.rect(60, yPosition + 33, 5, 3, 'F');
      doc.text('Avoid', 67, yPosition + 35);
      
      // Footer Page 1
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 280, 210, 20, 'F');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Page 1 of 2', 20, 290);
      doc.text('Synapsee AI', 105, 290, { align: 'center' });
      
      // ===== PAGE 2 =====
      doc.addPage();
      
      // Header Page 2
      doc.setFillColor(255,255,255);
      doc.rect(0, 0, 210, 30, 'F');
      await addLogoToPDF(doc, 150, 5, 50, 20);
      
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'bold');
      doc.text('Market Intelligence Report', 20, 20);
      
      // 3. MANUFACTURING
      yPosition = 40;
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      // REMOVED EMOJI HERE
      doc.text('3. Manufacturing & Materials', 20, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;
      
      const manufacturingPoints = [
        'Safe Batch Size:',
        '- Initial limited batch production recommended',
        '- Scale manufacturing closer to winter season',
        '',
        'Sourcing Strategy:',
        '- Procure batteries March-June',
        '- Source year-round with bulk discounts',
        '- Early bulk purchasing advised'
      ];
      
      manufacturingPoints.forEach(point => {
        if (point.includes(':')) {
          doc.setFont('helvetica', 'bold');
          doc.text(point, 25, yPosition);
          doc.setFont('helvetica', 'normal');
        } else if (point.startsWith('-')) {
          doc.text(point, 28, yPosition);
        } else {
          yPosition -= 3;
        }
        yPosition += 5;
      });
      
      yPosition += 10;
      
      // 4. COMPETITORS
      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      // REMOVED EMOJI HERE
      doc.text('4. Competitor Landscape', 20, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;
      
      // Standard FOR loop for async safety
      for (let index = 0; index < competitors.length; index++) {
        const competitor = competitors[index];
        
        // Zebra striping
        if (index % 2 === 0) doc.setFillColor(248, 250, 252);
        else doc.setFillColor(255, 255, 255);
        
        doc.roundedRect(20, yPosition - 5, 170, 35, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(20, yPosition - 5, 170, 35);
        
        // Name
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${competitor.name}`, 25, yPosition);
        
        // Price (Clean numeric only)
        const priceNum = competitor.price.replace(/[^\d,.]/g, '');
        doc.setFontSize(10);
        doc.setTextColor(59, 130, 246);
        doc.text(`${currencyCode} ${priceNum}`, 150, yPosition, { align: 'right' });
        
        // Rating (Text instead of Stars)
        doc.setFontSize(9);
        doc.setTextColor(245, 158, 11);
        doc.text(`Rating: ${competitor.rating} / 5.0`, 25, yPosition + 6);
        
        // Market Share
        doc.setTextColor(34, 197, 94);
        doc.text(`Market Share: ${competitor.marketShare}`, 25, yPosition + 12);
        
        // Features
        doc.setTextColor(100, 116, 139);
        const featuresText = `Features: ${competitor.features.join(', ')}`;
        doc.text(doc.splitTextToSize(featuresText, 140), 25, yPosition + 18);
        
        yPosition += 40;
        
        // Page Break Logic
        if (yPosition > 250 && index < competitors.length - 1) {
          doc.setFillColor(30, 41, 59);
          doc.rect(0, 280, 210, 20, 'F'); // Footer
          doc.addPage();
          
          doc.setFillColor(30, 41, 59);
          doc.rect(0, 0, 210, 30, 'F'); // Header
          await addLogoToPDF(doc, 150, 5, 50, 20);
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.text('Competitor Analysis (Continued)', 20, 20);
          yPosition = 40;
        }
      }
      
      // Footer Page 2 (or 3)
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 280, 210, 20, 'F');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Page 2 of 2', 20, 290);
      doc.text('Synapsee AI', 105, 290, { align: 'center' });
      
      // Save
      const safeName = formData.product.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      doc.save(`report-${safeName}.pdf`);
      
    } catch (error) {
      console.error('PDF Error:', error);
      alert('PDF generation failed. Downloading text report instead.');
      downloadTextReport();
    }
  };
  // Fallback function to download text report if PDF fails
  const downloadTextReport = () => {
    const reportText = `
SYNAPSEE AI MARKET ANALYSIS REPORT
================================

PRODUCT ANALYSIS SUMMARY
------------------------
Product: ${formData.product}
Region: ${formData.region}
Target Price: ${selectedCurrency.symbol}${formData.price}
Currency: ${selectedCurrency.code} (${selectedCurrency.name})
Target Age: ${formData.age}
Report Date: ${new Date().toLocaleDateString()}

1. EXECUTIVE SUMMARY & FEASIBILITY
-----------------------------------
Market analysis for "${formData.product}" in ${formData.region} indicates strong potential.
Your proposed price of ${selectedCurrency.symbol}${formData.price} positions the product in the ${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment.

Key Findings:
• Market prices: ${selectedCurrency.symbol}1,200 - ${selectedCurrency.symbol}3,900
• Your position: ${selectedCurrency.symbol}${formData.price} (${parseInt(formData.price) > 3000 ? 'Premium' : 'Mid-range'})
• Recommended: Limited launch in Q4 2026

2. BEST TIME TO MARKET
----------------------
Optimal Period: October to December
Pre-marketing: Begin awareness campaigns from August
Avoid: Heavy marketing from March to June

3. MANUFACTURING & MATERIALS
----------------------------
Safe Batch Size:
• Initial limited batch production recommended
• Scale manufacturing closer to winter season

Sourcing Strategy:
• Procure batteries and heating elements March–June
• Cardigans/Apparel: Source year-round with bulk discounts
• Batteries: Early bulk purchasing advised

4. COMPETITOR LANDSCAPE
-----------------------
${competitors.map((c, i) => `
${i + 1}. ${c.name}
     Price: ${c.price}
     Rating: ${c.rating}/5 ${'★'.repeat(Math.floor(c.rating))}${'☆'.repeat(5 - Math.floor(c.rating))}
     Market Share: ${c.marketShare}
     Features: ${c.features.join(', ')}
`).join('')}

Competitive Insight:
Your product at ${selectedCurrency.symbol}${formData.price} competes directly with ${competitors[0].name} (${competitors[0].price}) and ${competitors[1].name} (${competitors[1].price}).

5. STRATEGIC RECOMMENDATIONS
----------------------------
✅ Battery safety and insulation compliance
✅ Comfort and weight optimization of heating elements
✅ Clear differentiation from regular products
📍 Target Northern India regions (Delhi, Haryana, Rajasthan)
📍 Expand to hilly and cold-prone regions
📈 Implement phased marketing approach
💰 Consider strategic pricing based on competitor analysis
🔄 Regular market monitoring for trend adjustments

FINAL ASSESSMENT
----------------
Based on comprehensive analysis, ${formData.product} shows strong market viability in ${formData.region}.
With strategic implementation of the above recommendations, successful market entry and growth can be achieved.

---
© 2026 Synapsee AI Inc.
Report Generated: ${new Date().toLocaleString()}
    `;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapsee-report-${formData.product.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) {
        alert("Please fill in all required fields.");
        return;
    }

    setStep('processing');

    const sequence: StatusSequence[] = [
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
        <h3 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">Executive Summary & Feasibility</h3>
        <ul class="space-y-3 text-blue-800 text-base md:text-lg leading-relaxed list-disc pl-5">
          <li>Market prices range between ${selectedCurrency.symbol}400 to ${selectedCurrency.symbol}2,100. Your product at ${selectedCurrency.symbol}${formData.price} is positioned in the ${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment.</li>
          <li>Feasibility analysis shows ${formData.product} has strong market potential with identified consumer interest in ${formData.region}.</li>
          <li>Recommended entry strategy: Launch with limited inventory in Q4 2026, expand based on initial sales data.</li>
        </ul>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-lg md:text-xl mb-4">Best Time to Market</h4>
           <ul class="space-y-3 text-slate-700 text-sm md:text-base list-disc pl-5">
             <li><strong>Primary Window:</strong> October to December based on peak trends interest.</li>
             <li><strong>Pre-marketing:</strong> Begin awareness campaigns from August to capture rising demand.</li>
             <li><strong>Avoid:</strong> Heavy marketing from March to June due to consistently low interest levels.</li>
           </ul>
        </div>
        
        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-lg md:text-xl mb-4">Manufacturing & Materials</h4>
           
           <p class="font-semibold text-slate-800 mb-2">Safe Batch Size:</p>
           <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5 mb-4">
             <li>Initial limited batch production recommended due to premium pricing and niche demand.</li>
             <li>Scale manufacturing closer to winter season after early validation.</li>
           </ul>

           <p class="font-semibold text-slate-800 mb-2">Sourcing Strategy:</p>
           <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5">
             <li>Procure batteries and heating elements March–June (lowest demand).</li>
             <li>Cardigans/Apparel: Source year-round with bulk discounts in off-season.</li>
             <li>Batteries: Early bulk purchasing advised due to long-term inflation.</li>
           </ul>
        </div>
      </div>

      <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Competitor Landscape</h3>
        <div class="space-y-6">
          ${competitors.map(competitor => `
            <div class="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div class="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h4 class="font-bold text-slate-800 text-lg">${competitor.name}</h4>
                  <p class="text-slate-600">Price: <span class="font-semibold">${competitor.price}</span></p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ${competitor.reviews}★ Rating
                  </div>
                  <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ${competitor.reviews_found} Reviews
                  </div>
                </div>
              </div>
              <div class="mt-3">
                <p class="text-slate-700 font-medium mb-1">Key Features:</p>
                <div class="flex flex-wrap gap-2">
                  ${competitor.features.map(feature => `
                    <span class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs">
                      ${feature}
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div class="flex items-start gap-3">
            <span class="text-amber-500 text-xl">⚠</span>
            <div>
              <p class="font-semibold text-amber-800">Competitive Insight:</p>
              <p class="text-amber-700 text-sm mt-1">Your product at ${selectedCurrency.symbol}${formData.price} competes majorly with ${competitors[0].name} (${competitors[0].price}) and ${competitors[1].name} (${competitors[1].price}). Differentiate through unique features in your description.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
         <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Strategic Recommendations</h3>
         
         <div class="mb-6">
           <h4 class="font-bold text-slate-700 text-lg mb-3">Key Factors to Include</h4>
           <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
             <li>Battery safety and insulation compliance.</li>
             <li>Comfort and weight optimization due to embedded heating elements.</li>
             <li>Clear differentiation from regular sweaters through heating performance and battery life.</li>
           </ul>
         </div>

         <div>
           <h4 class="font-bold text-slate-700 text-lg mb-3">Target Region Expansion</h4>
           <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
             <li>Northern India regions with colder winters (Delhi, Haryana, Rajasthan).</li>
             <li>Hilly and cold-prone regions within India where winter apparel demand is higher.</li>
           </ul>
         </div>
      </div>
    </div>
  `;

  // Loading/Processing state
  if (step === 'processing') {
    return <Transition status={statusText} />;
  }

  // Result state
  if (step === 'result') {
    return (
      <div className="min-h-[125vh] w-[125vw] bg-slate-50 flex flex-col"style={{ zoom: 0.8 }}>
        <div className="bg-slate-900 text-white px-4 md:px-8 py-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-40 gap-4 md:gap-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Market Analysis Report</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">{formData.product} • {formData.region} • {selectedCurrency.code}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase text-[10px] md:text-xs font-bold tracking-wider">
                <CheckCircle size={14} className="md:w-4 md:h-4" /> Verified
             </div>
             
             <button 
               type="button"
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25 text-sm md:text-base"
               onClick={downloadPDF}
             >
               <Download size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Download</span> PDF
             </button>

             <button 
               type="button"
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
  }

  // Input form state (default)
  return (
    <div className="flex h-[125vh] w-[125vw] bg-white overflow-hidden" style={{ zoom: 0.8 }}>
        
        {/* Left Side: Hidden on Mobile/Tablet (lg:flex) */}
        <div className="hidden lg:flex w-1/3 relative flex-col justify-between p-12 text-white">
          
          <div 
            className="absolute inset-0 bg-cover bg-center z-0" 
            style={{ backgroundImage: "url('/logo.png')" }}
            role="img"
            aria-label="Synapsee AI background"
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
                    value={formData.product}
                    onChange={handleInput} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
                    placeholder="e.g. Sunglasses" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Region <span className="text-red-500">*</span></label>
                  <input 
                    name="region" 
                    value={formData.region}
                    onChange={handleInput} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
                    placeholder="e.g. Toronto, Canada" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-medium text-lg">{selectedCurrency.symbol}</span>
                    <input 
                      name="price" 
                      type="number" 
                      value={formData.price}
                      onChange={handleInput} 
                      className="w-full p-4 pl-10 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
                      placeholder="500" 
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Currency <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      name="currency" 
                      value={formData.currency}
                      onChange={handleInput} 
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-5 pointer-events-none text-slate-400">▼</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Age</label>
                <div className="relative">
                  <select 
                    name="age" 
                    value={formData.age}
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

              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Description <span className="text-red-500">*</span></label>
                <textarea 
                  name="description" 
                  rows={4}
                  value={formData.description}
                  onChange={handleInput} 
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300 resize-none" 
                  placeholder="Describe unique selling points, materials, and key features..."
                  required
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
