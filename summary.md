# Mandi Sabha (VyaaparMitra) — System Summary

**Mandi Sabha** is an AI-powered agricultural intelligence and multi-agent logistics platform designed to empower farmers across India. It eliminates predatory middleman commissions, maximizes crop profits, and provides real-time APMC mandi price arbitrage paired with precise transport cost calculations.

---

## 1. Core Architecture & Feature Modules

### 🏛️ Autonomous Multi-Agent Sabha Engine (`/sabha`)
- **Market Arbitrage Agent:** Tracks real-time electronic auction bids across connected APMC mandis to locate the highest net prices.
- **Logistics & Freight Agent:** Dynamically calculates diesel expenditures, highway tolls (e.g., NH48 corridor), transit duration, and vehicle load matching (Pickup, Light Truck, Heavy 10-Tonne).
- **Perishability & Spoilage Agent:** Evaluates temperature, travel duration, and shelf-life risks to determine optimal harvest and dispatch timing.
- **Agent Deliberation Chat:** A live simulated discussion where specialized AI agents debate logistical and market trade-offs before delivering a final unified recommendation pass.

### 🗺️ Live Route & Radar Map (`LiveRouteMap`)
- Geographic route visualization from farm origins to competing mandis.
- Real-time transit telemetry, highway toll markers, and intuitive floating zoom/pan controls (`+` / `−`).

### 📊 Financial Growth & Analytics (`/dashboard`)
- **Extra Realized Profit Visualization:** Interactive bar chart with timeframe filters (**3M**, **6M**, and **1Y** / 12-month historical comparison) contrasting net realized earnings against local baseline rates.
- **Mandi Winners Radar:** Tracks top-performing destinations, frequency percentages, and average profit margins.
- **Live Agmarknet Sync:** Continuous feed monitoring market arrival volumes and price surges.

### 🌐 Trilingual Localization Engine (i18n)
- 100% parity across **English**, **Hindi (हिंदी)**, and **Gujarati (ગુજરાતી)** across 12 full namespaces.
- Dynamic Indian currency formatting (`₹ INR`) and localized date displays.

### 🔐 Authentication & Farmer Profile Pass (`/login`, `/signup`, `/settings`)
- **Authentication:** 6-digit mobile OTP authentication and Google OAuth 2.0.
- **Verified Farmer Pass:** One-time initial registration collecting Name, Village, State, Phone, and Primary Crops. Once completed, the modal is permanently suppressed on future logins.
- **Settings & Preferences:** Customizable transport freight rates per km, crop portfolio settings, and theme customization (System, Light, Dark).

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router & Turbopack), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS design system, Glassmorphism, CSS Variables |
| **Motion & Icons** | Framer Motion (micro-animations & live news tickers), Lucide React |
| **State & Context** | React Context (`AuthProvider`, `LocaleProvider`), Secure HTTP-only cookies |
| **Validation & Safety** | Zod schemas, strict TypeScript type checking, automated i18n parity validation |

---

## 3. Project Structure

```
VyaaparMitra/
├── frontend/
│   ├── app/
│   │   ├── api/auth/          # Auth routes (OTP request/verify, Google OAuth, session, profile)
│   │   ├── dashboard/         # Analytics dashboard with 3M/6M/1Y financial growth chart
│   │   ├── explore/           # Mandi price explorer & commodity comparison
│   │   ├── history/           # Completed and past Sabha deliberation records
│   │   ├── login/ & signup/   # Auth pages with consent terms & OTP flow
│   │   ├── privacy/ & terms/  # Policy pages with direct home navigation
│   │   ├── sabha/             # Multi-agent Sabha creation and live deliberation
│   │   └── settings/          # Farmer profile, mobile phone, language & theme preferences
│   ├── components/            # UI components (AppShell, LiveRouteMap, VoiceAssistant, etc.)
│   ├── locales/               # en/, hi/, and gu/ translation namespaces
│   └── lib/                   # API clients, TypeScript definitions, and helper utilities
└── summary.md                 # System overview document
```
