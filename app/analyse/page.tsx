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
  marketShare: string;
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
        name: 'ThermoWear Pro',
        price: `${currencySymbol}2,999`,
        rating: 4.2,
        features: ['USB-C Charging', '3 Heat Levels', 'Water Resistant'],
        marketShare: '32%'
      },
      {
        name: 'HeatTech Glow',
        price: `${currencySymbol}3,499`,
        rating: 4.5,
        features: ['Fast Heating', 'App Control', 'Battery Pack'],
        marketShare: '28%'
      },
      {
        name: 'WarmFlex Elite',
        price: `${currencySymbol}2,799`,
        rating: 4.0,
        features: ['Carbon Fiber Heating', 'Adjustable Zones', 'Quick Dry'],
        marketShare: '22%'
      },
      {
        name: 'CozyCharge Plus',
        price: `${currencySymbol}3,199`,
        rating: 4.3,
        features: ['Wireless Charging', 'Smart Temperature', 'Moisture Wicking'],
        marketShare: '18%'
      }
    ];
  } else if (productType.toLowerCase().includes('sweater') || productType.toLowerCase().includes('jacket')) {
    return [
      {
        name: 'NorthFace ThermoBall',
        price: `${currencySymbol}2,299`,
        rating: 4.6,
        features: ['Down Alternative', 'Lightweight', 'Packable'],
        marketShare: '35%'
      },
      {
        name: 'Patagonia Nano Puff',
        price: `${currencySymbol}3,899`,
        rating: 4.8,
        features: ['Recycled Materials', 'Wind Resistant', 'Eco-Friendly'],
        marketShare: '25%'
      },
      {
        name: 'Columbia HeatZone',
        price: `${currencySymbol}1,999`,
        rating: 4.1,
        features: ['Omni-Heat Tech', 'Breathable', 'Value Pack'],
        marketShare: '20%'
      },
      {
        name: 'Uniqlo Ultra Warm',
        price: `${currencySymbol}1,499`,
        rating: 4.3,
        features: ['Affordable', 'Basic Design', 'Warmth-to-Weight'],
        marketShare: '20%'
      }
    ];
  } else {
    return [
      {
        name: 'PremiumTech X1',
        price: `${currencySymbol}2,500`,
        rating: 4.4,
        features: ['Advanced Features', 'Durable Build', 'Warranty'],
        marketShare: '30%'
      },
      {
        name: 'BudgetChoice Lite',
        price: `${currencySymbol}1,200`,
        rating: 3.8,
        features: ['Cost Effective', 'Basic Functionality', 'Reliable'],
        marketShare: '25%'
      },
      {
        name: 'InnovatePro Max',
        price: `${currencySymbol}3,800`,
        rating: 4.7,
        features: ['Cutting Edge', 'Premium Materials', 'Smart Integration'],
        marketShare: '25%'
      },
      {
        name: 'ValuePlus Standard',
        price: `${currencySymbol}1,800`,
        rating: 4.0,
        features: ['Balanced Features', 'Good Quality', 'Popular Choice'],
        marketShare: '20%'
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

  // Handle input change with proper event typing - THIS WAS THE ERROR
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

  // Function to generate and download PDF
  const downloadPDF = () => {
    try {
      // Check if jsPDF is available
      if (typeof window !== 'undefined') {
        // Dynamically import jsPDF
        import('jspdf').then((jsPDFModule) => {
          const { jsPDF } = jsPDFModule;
          
          // Create new PDF document
          const doc = new jsPDF();
          
          // Set document properties
          doc.setProperties({
            title: `Synapsee Report - ${formData.product}`,
            subject: 'Market Intelligence Analysis',
            author: 'Synapsee AI',
            keywords: 'market, analysis, intelligence, report',
            creator: 'Synapsee AI Engine'
          });
          
          // Add logo/header
          doc.setFontSize(20);
          doc.setTextColor(0, 0, 128);
          doc.text('Synapsee AI Intelligence Report', 20, 20);
          
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text(`Product: ${formData.product} | Region: ${formData.region} | Currency: ${selectedCurrency.code}`, 20, 30);
          doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 38);
          
          // Add separator
          doc.setDrawColor(0, 0, 128);
          doc.line(20, 42, 190, 42);
          
          // Add content
          let yPosition = 50;
          doc.setFontSize(16);
          doc.setTextColor(0, 0, 0);
          doc.text('Executive Summary & Feasibility', 20, yPosition);
          
          doc.setFontSize(11);
          yPosition += 10;
          const summaryLines = doc.splitTextToSize(
            `Market analysis for ${formData.product} in ${formData.region} indicates a competitive landscape. ` +
            `Your proposed price of ${selectedCurrency.symbol}${formData.price} positions the product in the ${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment. ` +
            `Key competitors have been identified with market shares ranging from 18% to 35%.`,
            170
          );
          doc.text(summaryLines, 20, yPosition);
          
          yPosition += (summaryLines.length * 7) + 15;
          
          // Add competitors section
          doc.setFontSize(16);
          doc.text('Competitor Analysis', 20, yPosition);
          
          yPosition += 10;
          competitors.forEach((competitor, index) => {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 128);
            doc.text(`${index + 1}. ${competitor.name}`, 25, yPosition);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Price: ${competitor.price} | Rating: ${competitor.rating}/5 | Market Share: ${competitor.marketShare}`, 25, yPosition + 7);
            
            doc.text(`Features: ${competitor.features.join(', ')}`, 25, yPosition + 14);
            
            yPosition += 25;
          });
          
          // Add footer
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 20, 285);
            doc.text('© 2026 Synapsee AI Inc. - Confidential Report', 20, 290);
          }
          
          // Save the PDF
          doc.save(`synapsee-report-${formData.product.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
        }).catch((error) => {
          console.error('Error loading jsPDF:', error);
          // Fallback to simple text download if jsPDF fails
          downloadTextReport();
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple text download
      downloadTextReport();
    }
  };

  // Fallback function to download text report if PDF fails
  const downloadTextReport = () => {
    const reportText = `
Synapsee AI Market Analysis Report
===============================
Product: ${formData.product}
Region: ${formData.region}
Currency: ${selectedCurrency.code}
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
=================
Market analysis for ${formData.product} in ${formData.region} indicates a competitive landscape.
Your proposed price of ${selectedCurrency.symbol}${formData.price} positions the product appropriately.

COMPETITOR ANALYSIS
===================
${competitors.map((c, i) => `
${i + 1}. ${c.name}
     Price: ${c.price}
     Rating: ${c.rating}/5
     Market Share: ${c.marketShare}
     Features: ${c.features.join(', ')}
`).join('')}

© 2026 Synapsee AI Inc. - Confidential Report
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
          <li>Market prices range between ${selectedCurrency.symbol}1,200 to ${selectedCurrency.symbol}3,900. Your product at ${selectedCurrency.symbol}${formData.price} is positioned in the ${parseInt(formData.price) > 3000 ? 'premium' : 'mid-range'} segment.</li>
          <li>Feasibility analysis shows ${formData.product} has strong market potential with identified consumer interest in ${formData.region}.</li>
          <li>Recommended entry strategy: Launch with limited inventory in Q4 2024, expand based on initial sales data.</li>
        </ul>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🚀 Best Time to Market</h4>
           <ul class="space-y-3 text-slate-700 text-sm md:text-base list-disc pl-5">
             <li><strong>Primary Window:</strong> October to December based on peak Google Trends interest.</li>
             <li><strong>Pre-marketing:</strong> Begin awareness campaigns from August to capture rising demand.</li>
             <li><strong>Avoid:</strong> Heavy marketing from March to June due to consistently low interest levels.</li>
           </ul>
        </div>
        
        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-xs md:text-sm mb-4">🏭 Manufacturing & Materials</h4>
           
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
                    ${competitor.rating}★ Rating
                  </div>
                  <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ${competitor.marketShare} Market Share
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
              <p class="text-amber-700 text-sm mt-1">Your product at ${selectedCurrency.symbol}${formData.price} competes directly with ${competitors[0].name} (${competitors[0].price}) and ${competitors[1].name} (${competitors[1].price}). Differentiate through unique features in your description.</p>
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
      <div className="min-h-screen w-screen bg-slate-50 flex flex-col">
        {/* Responsive Header: Flex Col on Mobile, Row on Desktop */}
        <div className="bg-slate-900 text-white px-4 md:px-8 py-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-40 gap-4 md:gap-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Intelligence Report</h1>
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
    <div className="flex h-screen w-screen bg-white overflow-hidden">
        
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
                    placeholder="e.g. Heated Jacket" 
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
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Max Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-medium text-lg">{selectedCurrency.symbol}</span>
                    <input 
                      name="price" 
                      type="number" 
                      value={formData.price}
                      onChange={handleInput} 
                      className="w-full p-4 pl-10 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300" 
                      placeholder="3499" 
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Currency</label>
                  <div className="relative">
                    <select 
                      name="currency" 
                      value={formData.currency}
                      onChange={handleInput} 
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-5 pointer-events-none text-slate-400">▼</div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-1">
                    Selected: {selectedCurrency.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Currency Preview</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{selectedCurrency.symbol}</span>
                      <div>
                        <p className="font-medium">{selectedCurrency.name}</p>
                        <p className="text-sm text-slate-500">{selectedCurrency.code} • {selectedCurrency.country}</p>
                      </div>
                    </div>
                  </div>
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
