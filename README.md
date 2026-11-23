# ReturnPulse — Smart Return Deadline & Processed Confirmation Manager

> **INSY 3331: Artificial Intelligence for Business &bull; Group 8 Project**  
> *University of Texas at Arlington (UTA)*

---

## 📌 Executive Summary & Business Problem

In modern retail and e-commerce, consumers purchase goods with diverse return policies (e.g., Apple's strict 14 days, Best Buy's 15 days, Amazon's 30 days, Target/Walmart's 90 days). According to National Retail Federation (NRF) studies, consumers forfeit billions of dollars each year because:
1. **Missed Deadlines**: Busy schedules cause consumers to forget the return window until it's too late.
2. **Tedious Manual Input**: Traditional reminder apps require users to manually type item names, order numbers, prices, and calculate dates by hand, discouraging adoption.
3. **Missing Proof of Return**: Items are dropped off at UPS, FedEx, or store counters, but the customer loses the drop-off slip or forgets to verify whether the store actually processed the credit.
4. **No Easy Sharing**: People frequently buy gifts or household items for roommates, family members, or partners and need an effortless way to share return reminders and deadlines.

**ReturnPulse** solves these challenges with automated intake, native sharing, and full return lifecycle tracking:
1. **AI Smart Order Parser (Zero Manual Typing)**: Extracts store, item, price, purchase date, order number, and calculates return deadlines automatically from pasted confirmation emails or receipt photos.
2. **Optional Cloud AI API (Gemini 1.5 Flash)**: Allows users to optionally connect their own API key for cloud multimodal invoice parsing, with zero setup or hardcoding required.
3. **Native Web Share**: Effortlessly share order return details via device share sheets (WhatsApp, Messages, Slack, Email, or clipboard).
4. **Proactive Deadline Monitoring**: Real-time urgency countdowns, animated alerts, browser notifications, and calendar alarms.
5. **Confirmed Processed Returns & Refunds**: Records drop-off locations, carrier tracking, RMA numbers, refund methods, and generates printable proof receipts.

---

## 🚀 Key Features

### 1. 🤖 AI Smart Intake & Receipt Parser (Zero Manual Typing)
* **Automated Parameter Extraction**: Users simply paste their order confirmation email (Amazon, Apple, Target, Best Buy, etc.) or upload a receipt photo.
* **Dual Engine Architecture**:
  * **Mode A: Client-Side NLP Engine (Default, 100% Free & Offline)**: Instant regex & NLP tokenization that extracts parameters with zero cost and zero server dependencies.
  * **Mode B: Google Gemini 1.5 Flash (Cloud API)**: Optional cloud multimodal parsing for unstructured, complex, or messy invoice snippets.
* **Optional API Key Input in UI**:
  * Users can optionally paste their Google Gemini API Key in the Settings modal (<kbd>⚙️</kbd>).
  * Keys are stored strictly in the user's browser `localStorage` and are **never** committed to GitHub or sent to any external server.
* **1-Click Test Samples**: Includes built-in one-click real-world order email templates (Amazon Echo Show, Apple AirPods Pro, Target Blender, Best Buy iPad) for instant demonstration.

### 2. 📲 Native Web Share Functionality
* **No Desktop Software Needed**: Web applications support native sharing directly through the standard **Web Share API (`navigator.share()`)**.
* **One-Click Sharing**: Click the share icon (<i data-lucide="share-2"></i>) on any item card:
  * On mobile (iOS / Android) and modern desktop browsers (macOS Safari, Windows Edge/Chrome), it opens the native operating system share sheet (WhatsApp, iMessage, Gmail, Slack, etc.).
  * On desktop browsers without share sheets, it opens an interactive modal with one-click **Copy to Clipboard** and **Send via Email (`mailto:`)** links pre-filled with the item's return deadline and tracking details.

### 3. Smart Return Deadline Reminders & Urgency Engine
* **Real-time Deadline Calculations**: Automatically calculates days remaining.
* **Color-Coded Urgency Badges**:
  * 🔥 **Urgent (&le; 3 days / 48 hours)**: Animated pulse alerts to prioritize immediate action.
  * 🟡 **Approaching (4–7 days)**: Warning indicator to decide whether to keep or return.
  * 🟢 **Safe (> 7 days)**: Healthy return window.
  * ❌ **Expired**: Visual archive of missed windows.
* **Browser Push Notifications**: Integrated Web Notifications API to alert users when deadlines are within 48 hours.
* **1-Click Calendar Export**: Generates `.ics` calendar files with automated 2-day and 1-day reminder alarms for Apple Calendar, Google Calendar, and Microsoft Outlook.

### 4. Return Confirmation & Refund Tracker (End-to-End Lifecycle)
* **Lifecycle Stages**:
  * `Active Purchase`: Tracking return window.
  * `Dropped Off / Processing`: Package dropped at UPS Store, Locker, or Counter; awaiting warehouse processing.
  * `Confirmed & Refunded`: Return verified, RMA code logged, refund amount credited.
  * `Decided to Keep`: User chose to retain item.
* **Drop-off & Tracking Records**: Logs carrier (UPS, FedEx, USPS, Store Counter), drop-off dates, and tracking numbers.
* **Receipt & Slip Photo Proof**: Attach photos of drop-off receipts for dispute prevention.
* **Printable Proof of Return Receipt**: Generates a standardized Return Proof Slip formatted for dispute prevention or record keeping.

### 5. AI Return Policy Advisor & Message Generator (INSY 3331)
* **Retailer Policy Knowledge Base**: Instant lookup of return policies and timing recommendations for Amazon, Apple, Target, Best Buy, Walmart, Costco, Nike, and Zara.
* **Transit Buffer Advisor**: Warns users when mail-in returns require shipping transit buffers to prevent warehouse rejections.
* **AI Return Reason & Note Generator**: Automatically creates professional, customer-service-ready return justification messages (for defective items, sizing issues, or late deliveries) ready to paste into support tickets or chats.

### 6. Financial KPI & Recovery Dashboard
* **Money at Risk**: Calculates total dollars sitting in active return windows.
* **Recovered Refunds**: Tracks cumulative money recovered through processed returns.
* **Multi-Filter & Search**: Filter by retailer, status, or search by item title, order ID, or RMA code.
* **Dual View**: Switch seamlessly between Card Grid View and Compact Table View.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: HTML5, Semantic Elements, Tailwind CSS (via CDN)
* **Icons & UI**: Lucide Icons, Google Inter Typography
* **Logic & State**: Modern Vanilla JavaScript (ES6+), LocalStorage Persistence
* **APIs**:
  * **Web Share API**: Native OS share sheet integration
  * **Web Notifications API**: Push deadline alerts
  * **Google Gemini 1.5 Flash API**: Optional cloud LLM invoice parsing
  * **iCalendar Protocol**: `.ics` calendar generator
  * **HTML5 File Reader API**: Local receipt and drop-off slip image previews
* **Responsive & Accessible**: Mobile, tablet, and desktop responsive with Dark / Light mode toggle

---

## 💻 How to Run the App

### Option 1: Open Directly in Any Web Browser
Simply double-click [`index.html`](./index.html) or right-click and choose **Open with &gt; Google Chrome / Edge / Firefox**. No installation or build step required!

### Option 2: Run with a Local Server (Recommended)
You can start a lightweight local development server using any of the following:

**Using Python:**
```bash
python -m http.server 3000
```
Then open `http://localhost:3000` in your browser.

**Using Node / npx:**
```bash
npx serve .
```

---

## 👥 INSY 3331 Group 8
* Project: Return Deadline & Processed Return Confirmation Manager
* Department: Information Systems & Operations Management (INSY)
* University of Texas at Arlington
