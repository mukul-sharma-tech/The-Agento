"use client";
import React, { useState, FormEvent, ChangeEvent } from 'react';
import Transition from '@/components/transition';
import { Download, RefreshCcw, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

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

// Define analysis data type
type AnalysisData = {
  [key: string]: string[];
};

// Popular world currencies
const currencies: Currency[] = [
  { code: 'INR', symbol: 'Rs', name: 'Indian Rupee', country: 'India' },
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

// Real competitor data for Indian market
const getCompetitors = (productType: string, currencySymbol: string): Competitor[] => {
  if (productType.toLowerCase().includes('electric') || productType.toLowerCase().includes('heated') ||
      productType.toLowerCase().includes('sweater') || productType.toLowerCase().includes('jacket')) {
    return [
      {
        name: 'Ubersweet',
        price: `${currencySymbol}4,799`,
        rating: 4.3,
        features: ['USB-Heated Pullover', 'Multiple Sizes'],
        marketShare: '' // Removed market share
      },
      {
        name: 'Tapish®',
        price: `${currencySymbol}3,499`,
        rating: 4.1,
        features: ['USB-Powered Heating', 'Multiple Heat Levels', 'Men/Women Variants'],
        marketShare: ''
      },
      {
        name: 'Kacheeg®/Worldcare',
        price: `${currencySymbol}3,400`,
        rating: 4.0,
        features: ['Unisex Heated Jackets', 'USB Electric', 'Vest Options Available'],
        marketShare: ''
      },
      {
        name: 'Venture Heat',
        price: `${currencySymbol}5,999`,
        rating: 4.4,
        features: ['Battery Pack Included', 'Unisex Hoodie'],
        marketShare: ''
      },
      {
        name: 'Atomlife Healthcare',
        price: `${currencySymbol}6,999`,
        rating: 4.2,
        features: ['2024 Outdoor Model', 'Electric USB Heated', 'Hoodie Design'],
        marketShare: ''
      }
    ];
  } else {
    return [
      {
        name: 'PremiumTech X1',
        price: `${currencySymbol}2,500`,
        rating: 4.4,
        features: ['Advanced Features', 'Durable Build', 'Warranty'],
        marketShare: ''
      },
      {
        name: 'BudgetChoice Lite',
        price: `${currencySymbol}1,200`,
        rating: 3.8,
        features: ['Cost Effective', 'Basic Functionality', 'Reliable'],
        marketShare: ''
      },
      {
        name: 'InnovatePro Max',
        price: `${currencySymbol}3,800`,
        rating: 4.7,
        features: ['Cutting Edge', 'Premium Materials', 'Smart Integration'],
        marketShare: ''
      },
      {
        name: 'ValuePlus Standard',
        price: `${currencySymbol}1,800`,
        rating: 4.0,
        features: ['Balanced Features', 'Good Quality', 'Popular Choice'],
        marketShare: ''
      }
    ];
  }
};

export default function Home() {
  const [step, setStep] = useState<Step>('input');
  const [statusText, setStatusText] = useState<string>("Initializing...");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

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
  const addLogoToPDF = async (doc: jsPDF, x: number, y: number, width: number, height: number): Promise<void> => {
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
  const downloadPDF = async () => {
    if (!analysisData) {
      alert('Analysis data not loaded. Please try again.');
      return;
    }

    const dataToUse = analysisData;
    const productData = formData;
    const demoCompetitors = competitors;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      let yPosition = margin;

      // Header
      try {
        await addLogoToPDF(pdf, margin, yPosition - 5, 25, 15);
      } catch (error) {
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Synapsee AI', margin, yPosition + 5);
      }
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Synapsee AI Market Analysis Report', pageWidth - margin, yPosition + 5, { align: 'right' });

      yPosition += 25;

      // Product details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Product Details', margin, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const details = [
        `Product: ${productData.product}`,
        `Region: ${productData.region}`,
        `Target Price: ${selectedCurrency.symbol}${productData.price} (${selectedCurrency.code})`,
        `Target Age: ${productData.age}`,
        `Report Date: ${new Date().toLocaleDateString()}`
      ];

      details.forEach((detail) => {
        pdf.text(detail, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Sections
      const sections = [
        { title: 'Executive Summary & Feasibility', data: dataToUse!["Feasibility (as per unit price)"] },
        { title: 'When to Market Product', data: dataToUse!["When to market product"] },
        { title: 'Raw Material Procurement', data: dataToUse!["Raw material, when to buy"] },
        { title: 'Safe Manufacturing Amount', data: dataToUse!["Safe manufacturing amount (as per region, such that it will be sold)"] },
        { title: 'Key Success Factors', data: dataToUse!["Key factors to include"] },
        { title: 'Target Market Expansion', data: dataToUse!["Other nearby possible target regions (as per current location - nearby)"] }
      ];

      sections.forEach(section => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(37, 99, 235);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.title, margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');

        if (section.title === 'When to Market Product') {
          // Show bullets for first 3 items
          const bulletItems = section.data?.slice(0, 3) || [];
          bulletItems.forEach(item => {
            const lines = pdf.splitTextToSize(`• ${item}`, pageWidth - 2 * margin);
            lines.forEach((line: string) => {
              if (yPosition > pageHeight - 10) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(line, margin, yPosition);
              yPosition += 5;
            });
            yPosition += 2;
          });
          yPosition += 5;

          // Marketing Timeline
          pdf.setFont('helvetica', 'bold');
          pdf.text('Marketing Timeline:', margin, yPosition);
          yPosition += 8;

          pdf.setFont('helvetica', 'normal');
          const timeline = [
            'Q1 (Jan-Mar): Market research and planning',
            'Q2 (Apr-Jun): Product development and prototyping',
            'Q3 (Jul-Sep): Beta testing and feedback collection',
            'Q4 (Oct-Dec): Full launch with marketing campaigns'
          ];
          timeline.forEach(item => {
            pdf.text(item, margin + 10, yPosition);
            yPosition += 6;
          });
        } else {
          section.data?.forEach(item => {
            const lines = pdf.splitTextToSize(`• ${item}`, pageWidth - 2 * margin);
            lines.forEach((line: string) => {
              if (yPosition > pageHeight - 10) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(line, margin, yPosition);
              yPosition += 5;
            });
            yPosition += 2;
          });
        }
        yPosition += 5;
      });

      // Competitors section
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(37, 99, 235);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Competitor Landscape', margin, yPosition);
      yPosition += 10;

      // Table setup
      const tableStartY = yPosition;
      const rowHeight = 12;
      const colWidths = [55, 35, 25, 45]; // Name, Price, Rating, Features
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);

      // Table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      let xPos = margin;
      pdf.text('Competitor Name', xPos, yPosition + 3);
      xPos += colWidths[0];
      pdf.text('Price', xPos, yPosition + 3);
      xPos += colWidths[1];
      pdf.text('Rating', xPos, yPosition + 3);
      xPos += colWidths[2];
      pdf.text('Features', xPos, yPosition + 3);

      yPosition += rowHeight;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      demoCompetitors.forEach((competitor, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin + 20; // Leave space for header
          // Redraw header if new page
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          xPos = margin;
          pdf.text('Competitor Name', xPos, yPosition + 3);
          xPos += colWidths[0];
          pdf.text('Price', xPos, yPosition + 3);
          xPos += colWidths[1];
          pdf.text('Rating', xPos, yPosition + 3);
          xPos += colWidths[2];
          pdf.text('Features', xPos, yPosition + 3);
          pdf.line(margin, yPosition + 6, margin + tableWidth, yPosition + 6);
          yPosition += rowHeight;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
        }

        xPos = margin;
        pdf.text(`${index + 1}. ${competitor.name}`, xPos, yPosition + 3);
        xPos += colWidths[0];
        pdf.text(competitor.price, xPos, yPosition + 3);
        xPos += colWidths[1];
        pdf.text(`${competitor.rating}/5`, xPos, yPosition + 3);
        xPos += colWidths[2];
        const featuresText = competitor.features.join(', ');
        const wrappedFeatures = pdf.splitTextToSize(featuresText, colWidths[3] - 5);
        const linesToShow = wrappedFeatures.slice(0, 2); // Limit to 2 lines
        linesToShow.forEach((line: string, idx: number) => {
          pdf.text(line, xPos, yPosition + 3 + idx * 4);
        });

        yPosition += rowHeight;
      });

      yPosition += 5;

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text('© 2026 Synapsee AI Inc. | Confidential Market Analysis Report', pageWidth / 2, pageHeight - 10, { align: 'center' });

      const safeName = productData.product.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      pdf.save(`synapsee-report-${safeName}.pdf`);

    } catch (error) {
      console.error('PDF Error:', error);
      alert('PDF generation failed. Downloading text report instead.');
      downloadTextReport();
    }
  };
  // Fallback function to download text report if PDF fails
  const downloadTextReport = () => {
    if (!analysisData) {
      alert('Analysis data not loaded. Please try again.');
      return;
    }

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
• Market prices of regular sweaters: Rs 432 - Rs 690
• Electric Sweater at ${selectedCurrency.symbol}${formData.price}: Premium positioning
• Feasibility: Requires clear value proposition (heating, efficiency, travel utility)

2. WHEN TO MARKET PRODUCT
-------------------------
${analysisData["When to market product"]?.join('\n') || ''}

3. RAW MATERIAL, WHEN TO BUY
-----------------------------
${analysisData["Raw material, when to buy"]?.join('\n') || ''}

4. SAFE MANUFACTURING AMOUNT (AS PER REGION, SUCH THAT IT WILL BE SOLD)
-------------------------------------------------------------------------
${analysisData["Safe manufacturing amount (as per region, such that it will be sold)"]?.join('\n') || ''}

5. POSSIBLE COMPETITORS
-----------------------
NA
${competitors.map((c, i) => `
${i + 1}. ${c.name}
     Price: ${c.price}
     Rating: ${c.rating}/5 ${'★'.repeat(Math.floor(c.rating))}${'☆'.repeat(5 - Math.floor(c.rating))}
     Features: ${c.features.join(', ')}
`).join('')}

Competitive Insight:
Your product at ${selectedCurrency.symbol}${formData.price} competes directly with ${competitors[0].name} (${competitors[0].price}) and ${competitors[1].name} (${competitors[1].price}).

5. STRATEGIC RECOMMENDATIONS
----------------------------
${analysisData["Key factors to include"]?.map(f => `✅ ${f}`).join('\n') || ''}
📍 ${analysisData["Other nearby possible target regions (as per current location - nearby)"]?.map(r => `📍 ${r}`).join('\n') || ''}
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

    // Fetch analysis data
    try {
      const response = await fetch('/api/analyse');
      if (!response.ok) throw new Error('Failed to fetch analysis data');
      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      alert('Failed to load analysis data. Please try again.');
      setStep('input');
      return;
    }

    setTimeout(() => {
      setStep('result');
    }, totalDelay);
  };

  // --- DYNAMIC REPORT ---
  const reportHtml = analysisData ? `
    <div class="space-y-6 md:space-y-8 max-w-5xl mx-auto">

      <div class="p-6 md:p-8 bg-blue-50 border-l-8 border-blue-600 rounded-r-lg shadow-sm">
        <h3 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">Executive Summary & Feasibility</h3>
        <ul class="space-y-3 text-blue-800 text-base md:text-lg leading-relaxed list-disc pl-5">
          ${analysisData["Feasibility (as per unit price)"]?.map(item => `<li>${item}</li>`).join('') || ''}
        </ul>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-lg md:text-xl mb-4">Best Time to Market</h4>
           <ul class="space-y-3 text-slate-700 text-sm md:text-base list-disc pl-5">
             ${analysisData["When to market product"]?.slice(0, 3).map(item => `<li>${item}</li>`).join('') || ''}
           </ul>
           <h5 class="font-semibold text-slate-700 text-base md:text-lg mt-4 mb-2">Marketing Timeline:</h5>
           <ul class="space-y-2 text-slate-600 text-sm md:text-base list-none pl-5">
             <li><strong>Q1 (Jan-Mar):</strong> Market research and planning</li>
             <li><strong>Q2 (Apr-Jun):</strong> Product development and prototyping</li>
             <li><strong>Q3 (Jul-Sep):</strong> Beta testing and feedback collection</li>
             <li><strong>Q4 (Oct-Dec):</strong> Full launch with marketing campaigns</li>
           </ul>
        </div>

        <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
           <h4 class="font-bold text-slate-500 uppercase tracking-widest text-lg md:text-xl mb-4">Manufacturing & Materials</h4>

           <p class="font-semibold text-slate-800 mb-2">Safe Manufacturing Amount:</p>
           <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5 mb-4">
             ${analysisData["Safe manufacturing amount (as per region, such that it will be sold)"]?.map(item => `<li>${item}</li>`).join('') || ''}
           </ul>

           <p class="font-semibold text-slate-800 mb-2">Raw Material Procurement:</p>
           <ul class="space-y-2 text-slate-600 text-sm md:text-base list-disc pl-5">
             ${analysisData["Raw material, when to buy"]?.map(item => `<li>${item}</li>`).join('') || ''}
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
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Key Success Factors</h3>
        <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
          ${analysisData["Key factors to include"]?.map(item => `<li>${item}</li>`).join('') || ''}
        </ul>
      </div>

      <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Target Market Expansion</h3>
        <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
          ${analysisData["Other nearby possible target regions (as per current location - nearby)"]?.map(item => `<li>${item}</li>`).join('') || ''}
        </ul>
      </div>

     <div class="p-6 md:p-8 border rounded-2xl bg-white shadow-lg">
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-6">Strategic Recommendations</h3>

         <div class="mb-6">
           <h4 class="font-bold text-slate-700 text-lg mb-3">Key Factors to Include</h4>
           <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
             ${analysisData["Key factors to include"]?.map(item => `<li>${item}</li>`).join('') || ''}
           </ul>
         </div>

         <div>
           <h4 class="font-bold text-slate-700 text-lg mb-3">Target Region Expansion</h4>
           <ul class="space-y-2 text-slate-600 text-base md:text-lg list-disc pl-5">
             ${analysisData["Other nearby possible target regions (as per current location - nearby)"]?.map(item => `<li>${item}</li>`).join('') || ''}
           </ul>
         </div>
      </div>
    </div>
  ` : '';

  // Loading/Processing state
  if (step === 'processing') {
    return <Transition status={statusText} />;
  }

  // Result state
  if (step === 'result') {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col">
        <div className="bg-slate-900 text-white px-4 md:px-6 py-4 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-40 gap-4 md:gap-0">
           <div>
             <h1 className="text-lg md:text-xl font-bold tracking-tight">Market Analysis Report</h1>
             <p className="text-slate-400 text-xs mt-0.5">{formData.product} • {formData.region} • {selectedCurrency.code}</p>
           </div>
          
          <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase text-[10px] md:text-xs font-bold tracking-wider">
                <CheckCircle size={14} className="md:w-4 md:h-4" /> Verified
             </div>
             
             <button
               type="button"
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25 text-sm md:text-base"
               onClick={() => downloadPDF()}
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
             id="report-content"
             className="max-w-none text-slate-800"
             dangerouslySetInnerHTML={{ __html: reportHtml }}
           />
         </div>
      </div>
    );
  }

  // Input form state (default)
  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden">
        
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
        <div className="w-full lg:w-2/3 h-full overflow-y-auto bg-slate-50 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-lg">
            
            {/* Mobile Header (Only visible on small screens to replace the hidden left sidebar) */}
            <div className="lg:hidden mb-6 border-b pb-4 border-slate-200">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Synapsee-AI</h1>
                <p className="text-slate-500 text-sm mt-1">Agentic Market Intelligence & Feasibility Engine</p>
            </div>

            <div className="mb-6 md:mb-8">
               <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">New Analysis</h2>
               <p className="text-slate-500 text-sm md:text-base">Enter product details to launch the agent swarm.</p>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name <span className="text-red-500">*</span></label>
                  <input
                    name="product"
                    value={formData.product}
                    onChange={handleInput}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300"
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
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300"
                    placeholder="e.g. Toronto, Canada"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Target Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-medium text-base">{selectedCurrency.symbol}</span>
                    <input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInput}
                      className="w-full p-3 pl-8 bg-white border border-slate-200 rounded-xl text-slate-900 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300"
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
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-4 pointer-events-none text-slate-400">▼</div>
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
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="All">All Demographics</option>
                    <option value="18-25">Gen Z (18-25)</option>
                    <option value="26-40">Millennials (26-40)</option>
                    <option value="40+">Gen X & Boomers (40+)</option>
                  </select>
                  <div className="absolute right-3 top-4 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Product Description <span className="text-red-500">*</span></label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInput}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-300 resize-none"
                  placeholder="Describe unique selling points, materials, and key features..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform duration-200
                  ${isFormValid
                    ? 'bg-blue-600 text-white shadow-xl hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                  }`}
              >
                {isFormValid ? (
                    <>Start Analysis <ArrowRight size={20} /></>
                ) : (
                    <>Fill all fields to start <AlertCircle size={18} /></>
                )}
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}
