'use client'

import React, { useRef } from 'react'
import { 
  Printer, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  FileText,
  Truck,
  MapPin,
  Calendar,
  Share2,
  PhoneCall
} from 'lucide-react'

export interface MandiReceiptData {
  passNumber?: string
  dateStr?: string
  timeStr?: string
  farmerName: string
  farmerKID?: string
  farmerMobile: string
  farmerLocation: string
  bankAccountMasked?: string
  bankIfsc?: string
  mandiName: string
  mandiYardCode?: string
  mandiLocation: string
  mandiHighway: string
  transitDistance: string
  transitHours?: string
  cropName: string
  cropLocalName?: string
  cropVariety?: string
  quantityQuintals: number
  bagsCount?: number
  qualityGrade?: string
  moistureContent?: string
  modalRatePerQtl: number
  grossProduceValue: number
  freightCost: number
  tollCost?: number
  netPayable: number
  localBenchmarkMandi?: string
  localBenchmarkRate?: number
  surplusVsLocal: number
  vehicleType: string
  fastagStatus?: string
  weighbridgeLane?: string
  agentName?: string
}

function numberToIndianWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const n = Math.floor(Math.abs(num))
  if (n === 0) return 'Zero'

  function convertSection(v: number): string {
    let str = ''
    if (v >= 100) {
      str += a[Math.floor(v / 100)] + ' Hundred '
      v %= 100
    }
    if (v >= 20) {
      str += b[Math.floor(v / 10)] + (v % 10 !== 0 ? ' ' + a[v % 10] : '')
    } else if (v > 0) {
      str += a[v]
    }
    return str.trim()
  }

  let crore = Math.floor(n / 10000000)
  let lakh = Math.floor((n % 10000000) / 100000)
  let thousand = Math.floor((n % 100000) / 1000)
  let remainder = n % 1000

  let res = ''
  if (crore > 0) res += convertSection(crore) + ' Crore '
  if (lakh > 0) res += convertSection(lakh) + ' Lakh '
  if (thousand > 0) res += convertSection(thousand) + ' Thousand '
  if (remainder > 0) res += convertSection(remainder)

  return res.trim() + ' Rupees Only'
}

/**
 * Photorealistic APMC Loading Pass & Transit Bilty Receipt
 * Modeled after official Indian Krishi Upaj Mandi Samiti (APMC) Gate Passes
 */
export function MandiReceiptDocument({ data }: { data: MandiReceiptData }) {
  const passNo = data.passNumber || `APMC/GJ/2026/${Math.floor(10000 + Math.random() * 90000)}`
  const now = new Date()
  const dateStr = data.dateStr || now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = data.timeStr || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  const bags = data.bagsCount || Math.round(data.quantityQuintals * 2) // standard 50kg bags
  const netInWords = numberToIndianWords(data.netPayable)

  return (
    <div 
      id="apmc-official-receipt"
      className="receipt-paper w-full max-w-[820px] mx-auto bg-[#FFFDF9] text-[#1A1A1A] p-6 sm:p-8 rounded-lg shadow-xl border-2 border-stone-800 font-sans print:shadow-none print:border-stone-900 print:m-0 print:p-6 print:w-full print:max-w-none text-[12px] leading-relaxed relative overflow-hidden"
      style={{
        boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* ── Background Watermark Crest ──────────────────────────────────── */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] print:opacity-[0.04]"
        aria-hidden="true"
      >
        <svg width="460" height="460" viewBox="0 0 200 200" fill="currentColor">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6,4" />
          <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M100 35 L104 55 L124 55 L108 67 L114 87 L100 75 L86 87 L92 67 L76 55 L96 55 Z" />
          <text x="100" y="115" textAnchor="middle" fontSize="11" fontWeight="bold" letterSpacing="2">KRISHI UPAJ MANDI</text>
          <text x="100" y="130" textAnchor="middle" fontSize="8" letterSpacing="1">GOVERNMENT OF INDIA e-NAM</text>
        </svg>
      </div>

      {/* ── Double Security Border Frame ─────────────────────────────────── */}
      <div className="border border-stone-700/80 p-4 sm:p-5 relative">
        {/* Corner Ornaments */}
        <div className="absolute top-1 left-1 size-2 border-t-2 border-l-2 border-stone-800" />
        <div className="absolute top-1 right-1 size-2 border-t-2 border-r-2 border-stone-800" />
        <div className="absolute bottom-1 left-1 size-2 border-b-2 border-l-2 border-stone-800" />
        <div className="absolute bottom-1 right-1 size-2 border-b-2 border-r-2 border-stone-800" />

        {/* ── 1. Official Header ────────────────────────────────────────── */}
        <header className="border-b-2 border-stone-900 pb-3 mb-3 text-center">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-left font-mono text-[9.5px] text-stone-600">
              <span className="block font-bold">FORM V [RULE 24(2)]</span>
              <span>STATE APMC ACT, 1963</span>
            </div>

            {/* Official Ashoka / Mandi Crest */}
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full border-2 border-stone-900 grid place-items-center font-serif font-black text-sm bg-stone-100 text-stone-900 shrink-0">
                कृषि
              </div>
            </div>

            <div className="text-right font-mono text-[9.5px] text-stone-600">
              <span className="block font-bold text-emerald-800 print:text-stone-900">e-NAM INTEGRATED</span>
              <span>UNIFIED PASS</span>
            </div>
          </div>

          <h1 className="font-serif text-lg sm:text-2xl font-black uppercase tracking-tight text-stone-950 leading-none">
            कृषि उपज मंडी समिति (APMC)
          </h1>
          <h2 className="font-sans text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-800 mt-0.5">
            Agricultural Produce Market Committee · Dispatch & Loading Gate Pass
          </h2>
          <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-0.5 font-medium">
            ખેતીવાડી ઉત્પન્ન બજાર સમિતિ — લાદાન પહોંચ एवं किसान विपणन पावती
          </p>

          {/* Telemetry Strip */}
          <div className="mt-3 pt-2 border-t border-stone-300 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-mono text-stone-800 bg-stone-100/80 p-2 rounded">
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Gate Pass No:</span>
              <strong className="text-stone-950 font-bold">{passNo}</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Issue Date & Time:</span>
              <span>{dateStr} {timeStr}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Validity Period:</span>
              <strong className="text-emerald-700 print:text-stone-900">24 Hrs (Priority Entry)</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">e-Way Bill / Token:</span>
              <span className="font-bold">EWB-GJ-84920</span>
            </div>
          </div>
        </header>

        {/* ── 2. Farmer & Destination Mandi 2-Column Grid ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-[11px]">
          {/* Left: Consignor / Farmer Box */}
          <div className="border border-stone-400/80 rounded p-2.5 bg-stone-50/50">
            <div className="flex items-center justify-between pb-1 border-b border-stone-300 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-stone-700">
                1. Consignor / Farmer (ખેડૂત વિગત)
              </span>
              <span className="font-mono text-[9px] px-1 py-0.2 bg-stone-200 text-stone-700 rounded font-bold">
                KID: {data.farmerKID || 'GJ-84920'}
              </span>
            </div>
            <div className="space-y-0.5 text-stone-900">
              <p className="flex justify-between">
                <span className="text-stone-600 font-medium">Farmer Name:</span>
                <strong className="font-bold text-[12px]">{data.farmerName}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-stone-600">Mobile / OTP:</span>
                <span className="font-mono">{data.farmerMobile}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-stone-600">Origin Farm Hub:</span>
                <span className="font-medium text-right">{data.farmerLocation}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-stone-600">DBT Bank A/C:</span>
                <span className="font-mono text-[10px]">{data.bankAccountMasked || 'SBI A/C ······4921'} ({data.bankIfsc || 'SBIN0001824'})</span>
              </p>
            </div>
          </div>

          {/* Right: Destination APMC Mandi Box */}
          <div className="border border-stone-400/80 rounded p-2.5 bg-stone-50/50">
            <div className="flex items-center justify-between pb-1 border-b border-stone-300 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-stone-700">
                2. Consignee / Target Yard (ગંતવ્ય મંડી)
              </span>
              <span className="font-mono text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 print:bg-stone-200 print:text-stone-900 rounded font-bold">
                {data.mandiYardCode || 'GJ-APMC-042'}
              </span>
            </div>
            <div className="space-y-0.5 text-stone-900">
              <p className="flex justify-between">
                <span className="text-stone-600 font-medium">APMC Yard Name:</span>
                <strong className="font-bold text-[12px] text-emerald-900 print:text-stone-950">{data.mandiName}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-stone-600">Designated Terminal:</span>
                <span className="font-medium">Yard #1 · Shed C (Grain Terminal)</span>
              </p>
              <p className="flex justify-between">
                <span className="text-stone-600">Designated Corridor:</span>
                <span className="font-medium text-right">{data.mandiHighway}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-stone-600">Transit Distance:</span>
                <span className="font-mono font-bold">{data.transitDistance} (~{data.transitHours || '45 mins'})</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 3. Commodity & Consignment Specifications ───────────────────── */}
        <div className="border border-stone-700 rounded mb-3 overflow-hidden">
          <div className="bg-stone-900 text-white px-3 py-1 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-between">
            <span>3. Consignment & Quality Assay Telemetry (જણસ અને ગુણવત્તા વિગત)</span>
            <span className="font-mono text-[9.5px] font-normal text-stone-300">e-NAM Assayed FAQ Standard</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-stone-300 text-[10.5px] bg-white">
            <div className="p-2">
              <span className="text-stone-500 block text-[9px] uppercase">Commodity:</span>
              <strong className="text-stone-950 text-xs block font-bold">{data.cropName}</strong>
              <span className="text-[9.5px] text-stone-600">{data.cropLocalName || 'Sharbati / Lokwan'}</span>
            </div>

            <div className="p-2">
              <span className="text-stone-500 block text-[9px] uppercase">Net Quantity:</span>
              <strong className="text-stone-950 text-xs block font-bold">{data.quantityQuintals} Quintals</strong>
              <span className="text-[9.5px] font-mono text-stone-600">{data.quantityQuintals * 100} kg</span>
            </div>

            <div className="p-2">
              <span className="text-stone-500 block text-[9px] uppercase">Packaging:</span>
              <strong className="text-stone-950 block font-bold">{bags} Standard Bags</strong>
              <span className="text-[9.5px] text-stone-600">@ 50 kg / bag</span>
            </div>

            <div className="p-2">
              <span className="text-stone-500 block text-[9px] uppercase">Assayed Grade:</span>
              <strong className="text-emerald-700 print:text-stone-900 block font-bold">{data.qualityGrade || 'Grade A (FAQ)'}</strong>
              <span className="text-[9.5px] text-stone-600">Export Standard</span>
            </div>

            <div className="p-2">
              <span className="text-stone-500 block text-[9px] uppercase">Moisture Content:</span>
              <strong className="text-stone-950 block font-bold">{data.moistureContent || '10.8%'}</strong>
              <span className="text-[9.5px] text-emerald-700 print:text-stone-600 font-medium">Optimal (&lt; 12%)</span>
            </div>

            <div className="p-2 bg-stone-50">
              <span className="text-stone-500 block text-[9px] uppercase">Quoted Modal Rate:</span>
              <strong className="text-stone-950 text-xs block font-bold font-mono">₹{data.modalRatePerQtl.toLocaleString('en-IN')}/q</strong>
              <span className="text-[9.5px] text-emerald-800 print:text-stone-700 font-bold">Highest Quoted</span>
            </div>
          </div>
        </div>

        {/* ── 4. Itemized Accounting & Freight Bilty Table ──────────────────── */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold uppercase tracking-wider text-[10.5px] text-stone-800">
              4. Official Accounting & Net Realization Bilty (નાણાકીય હિસાબ પાવતી)
            </span>
            <span className="text-[10px] font-mono text-stone-500">Amounts in Indian Rupees (INR ₹)</span>
          </div>

          <table className="w-full border-collapse border border-stone-800 text-[11px]">
            <thead>
              <tr className="bg-stone-200/90 text-stone-900 font-bold border-b border-stone-800 text-[10px] uppercase">
                <th className="border border-stone-400 p-1.5 text-center w-10">Sr.</th>
                <th className="border border-stone-400 p-1.5 text-left">Particulars / વિગત</th>
                <th className="border border-stone-400 p-1.5 text-center w-28">Basis / Qty</th>
                <th className="border border-stone-400 p-1.5 text-right w-28">Rate (₹)</th>
                <th className="border border-stone-400 p-1.5 text-right w-32">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              <tr>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-stone-600">01</td>
                <td className="border border-stone-300 p-1.5">
                  <strong className="font-bold text-stone-900">Gross Produce Realization</strong>
                  <span className="block text-[10px] text-stone-500">
                    {data.cropName} modal valuation at {data.mandiName} electronic auction
                  </span>
                </td>
                <td className="border border-stone-300 p-1.5 text-center font-mono">{data.quantityQuintals} Quintals</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono">₹{data.modalRatePerQtl.toLocaleString('en-IN')}.00</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono font-bold text-stone-950">
                  ₹{data.grossProduceValue.toLocaleString('en-IN')}.00
                </td>
              </tr>

              <tr>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-stone-600">02</td>
                <td className="border border-stone-300 p-1.5">
                  <span className="font-medium text-stone-900">Freight & Transit Allowance (વાહન ભાડું)</span>
                  <span className="block text-[10px] text-stone-500">
                    Direct road transit via {data.mandiHighway} ({data.transitDistance})
                  </span>
                </td>
                <td className="border border-stone-300 p-1.5 text-center font-mono">{data.transitDistance}</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono">Std LCV Slab</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono font-bold text-stone-700">
                  - ₹{data.freightCost.toLocaleString('en-IN')}.00
                </td>
              </tr>

              <tr>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-stone-600">03</td>
                <td className="border border-stone-300 p-1.5">
                  <span className="text-stone-800">Highway Toll & FASTag Clearance (GJ-03 Plaza)</span>
                </td>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-[10px]">Pre-Cleared</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono">FASTag Active</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono text-stone-600">₹0.00</td>
              </tr>

              <tr>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-stone-600">04</td>
                <td className="border border-stone-300 p-1.5">
                  <span className="text-stone-800">APMC Market Development Cess (Farmer Share)</span>
                </td>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-[10px]">0.00%</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono text-emerald-700 print:text-stone-700 font-bold">EXEMPTED</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono text-stone-600">₹0.00</td>
              </tr>

              <tr>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-stone-600">05</td>
                <td className="border border-stone-300 p-1.5">
                  <span className="text-stone-800">Electronic Weighbridge & Assaying User Fee</span>
                </td>
                <td className="border border-stone-300 p-1.5 text-center font-mono text-[10px]">Automated</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono text-emerald-700 print:text-stone-700 font-bold">FREE UNDER e-NAM</td>
                <td className="border border-stone-300 p-1.5 text-right font-mono text-stone-600">₹0.00</td>
              </tr>

              {/* Total Settlement Row */}
              <tr className="bg-stone-100 font-bold border-t-2 border-b-2 border-stone-900 text-stone-950">
                <td colSpan={2} className="border border-stone-400 p-2">
                  <span className="text-xs uppercase tracking-wider block">
                    TOTAL ESTIMATED IN-HAND REALIZATION (ચૂકવવાપાત્ર ચોખ્ખી રકમ)
                  </span>
                  <span className="text-[10px] font-mono text-stone-600 font-normal">
                    Credited to farmer DBT bank account within 2 hours of electronic auction
                  </span>
                </td>
                <td className="border border-stone-400 p-2 text-center font-mono text-xs">{data.quantityQuintals} Qtl</td>
                <td className="border border-stone-400 p-2 text-right font-mono text-xs">
                  Net ₹{(data.netPayable / data.quantityQuintals).toFixed(2)}/q
                </td>
                <td className="border border-stone-400 p-2 text-right font-mono text-sm sm:text-base font-black text-emerald-900 print:text-stone-950">
                  ₹{data.netPayable.toLocaleString('en-IN')}.00
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount In Words Strip */}
          <div className="p-2 border-x border-b border-stone-700 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px]">
            <div>
              <span className="font-bold text-stone-700">Amount in Words: </span>
              <span className="font-serif italic font-bold text-stone-900">{netInWords}</span>
            </div>
            {data.surplusVsLocal > 0 && (
              <div className="font-mono text-emerald-800 print:text-stone-900 font-bold text-right">
                Arbitrage Gain: +₹{data.surplusVsLocal.toLocaleString('en-IN')} vs {data.localBenchmarkMandi || 'Local Yard'}
              </div>
            )}
          </div>
        </div>

        {/* ── 5. Vehicle Gate Clearance & Transit Instructions ────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border border-stone-300 p-2 rounded bg-stone-50/80 mb-3 text-[10.5px]">
          <div>
            <span className="text-stone-500 block text-[9px] uppercase font-bold">Authorized Vehicle:</span>
            <strong className="text-stone-900 block font-bold capitalize">{data.vehicleType} (Light Commercial Vehicle)</strong>
            <span className="text-[9.5px] text-stone-600 font-mono">FASTag Tagged & Active</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[9px] uppercase font-bold">Weighbridge Gate Entry:</span>
            <strong className="text-stone-900 block font-bold">{data.weighbridgeLane || 'Gate #1 · Electronic Lane 2'}</strong>
            <span className="text-[9.5px] text-stone-600">Automated gross-tare sensor</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[9px] uppercase font-bold">Transit Status:</span>
            <strong className="text-emerald-700 print:text-stone-900 block font-bold">Cleared for Highway Transit</strong>
            <span className="text-[9.5px] text-stone-600">Zero weather or roadblock hazards</span>
          </div>
        </div>

        {/* ── 6. Official Stamp, QR Code, and Signatures ───────────────────── */}
        <div className="grid grid-cols-3 items-end pt-3 border-t-2 border-stone-900 gap-3 text-center">
          {/* Farmer Signature */}
          <div className="flex flex-col items-center">
            <div className="h-10 flex items-end justify-center font-serif italic text-stone-800 font-bold text-sm tracking-wide">
              {data.farmerName}
            </div>
            <div className="w-full border-t border-dashed border-stone-600 pt-1 text-[9.5px] uppercase font-bold text-stone-700">
              Farmer / Consignor Signature<br />
              <span className="font-normal text-[8.5px] text-stone-500">(ખેડૂત સહી)</span>
            </div>
          </div>

          {/* Official Round Rubber Stamp + QR Code */}
          <div className="flex flex-col items-center justify-center relative">
            {/* Authentic Circular APMC Rubber Stamp */}
            <div className="size-20 rounded-full border-2 border-red-700 print:border-stone-800 text-red-700 print:text-stone-800 flex flex-col items-center justify-center p-1 transform rotate-[-4deg] opacity-90 select-none pointer-events-none mb-1">
              <span className="text-[6.5px] font-black uppercase tracking-widest">★ APMC GONDAL YARD ★</span>
              <span className="text-[8px] font-black my-0.5 border-y border-red-700 print:border-stone-800 px-1 py-0.2">
                VERIFIED & CLEARED
              </span>
              <span className="text-[6px] font-bold">WEIGHBRIDGE GATE PASS</span>
            </div>
            <span className="text-[9px] font-mono text-stone-500 font-bold">Official Seal of Market Samiti</span>
          </div>

          {/* Authorized Secretary Signature */}
          <div className="flex flex-col items-center">
            <div className="h-10 flex items-end justify-center font-serif text-blue-900 print:text-stone-900 font-bold text-xs tracking-wider">
              [ Digitally Signed & Sealed ]
            </div>
            <div className="w-full border-t border-dashed border-stone-600 pt-1 text-[9.5px] uppercase font-bold text-stone-700">
              Mandi Secretary / e-NAM Officer<br />
              <span className="font-normal text-[8.5px] text-stone-500">(બજાર સચિવ સહી)</span>
            </div>
          </div>
        </div>

        {/* ── 7. Statutory Terms & Barcode ───────────────────────────────── */}
        <footer className="mt-3 pt-2 border-t border-stone-300 text-[8.5px] text-stone-500 leading-normal">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="flex-1">
              <strong>STATUTORY TERMS:</strong> 1. This pass entitles preferential weighing queue at designated APMC auction yard. 2. Produce is settled directly to registered bank account within 2 hours of auction clearance. 3. Zero illegal deductions or 'kata' charges permitted under APMC Act.
            </p>

            {/* Simulated 1D Barcode */}
            <div className="shrink-0 text-center">
              <div className="h-5 flex items-stretch gap-[1.5px] px-1 bg-white">
                <span className="w-[1.5px] bg-black" />
                <span className="w-[1px] bg-black" />
                <span className="w-[3px] bg-black" />
                <span className="w-[1px] bg-black" />
                <span className="w-[2px] bg-black" />
                <span className="w-[1.5px] bg-black" />
                <span className="w-[3px] bg-black" />
                <span className="w-[1px] bg-black" />
                <span className="w-[2px] bg-black" />
                <span className="w-[1px] bg-black" />
                <span className="w-[3px] bg-black" />
                <span className="w-[2px] bg-black" />
                <span className="w-[1px] bg-black" />
                <span className="w-[3px] bg-black" />
                <span className="w-[1.5px] bg-black" />
              </div>
              <span className="font-mono text-[7.5px] text-stone-600 font-bold">*{passNo.replace(/\//g, '')}*</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-stone-200 pt-1 font-mono text-[8px] text-stone-400">
            <span>Mandi Sabha AI Agri Network · Verified Telematics Dispatch</span>
            <span>Helpline Toll-Free: 1800-180-1551</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

/**
 * Interactive Modal Wrapper with Actions:
 * - Print Loading Pass (window.print())
 * - Download Receipt
 * - Close Modal
 */
export function MandiReceiptModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean
  onClose: () => void
  data: MandiReceiptData
}) {
  if (!isOpen) return null

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:max-h-none print:bg-transparent">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-stone-800 bg-stone-950 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <FileText className="size-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-100 flex items-center gap-2">
                Official APMC Loading Pass & Bilty
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready to Print
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Official dispatch receipt for {data.farmerName} → {data.mandiName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="button-primary !min-h-[38px] !px-4 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Print Official Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="size-8 grid place-items-center rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-900/60 flex items-center justify-center print:p-0 print:overflow-visible print:bg-transparent">
          <MandiReceiptDocument data={data} />
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0 print:hidden">
          <span className="font-mono text-[11px]">
            Formatted for standard single-page A4 / Letter print.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="button-secondary !min-h-[34px] !px-3 text-xs font-semibold cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>Print (Ctrl + P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="button-ghost !min-h-[34px] !px-3 text-xs font-semibold text-stone-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
