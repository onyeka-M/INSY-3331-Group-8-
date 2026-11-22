# ReturnPulse — Smart Return Deadline & Processed Confirmation Manager

> **INSY 3331: Artificial Intelligence for Business &bull; Group 8 Project**  
> *University of Texas at Arlington (UTA)*

---

## 📌 Executive Summary & Business Problem

In modern retail and e-commerce, consumers purchase goods with diverse return policies (e.g., Apple's strict 14 days, Best Buy's 15 days, Amazon's 30 days, Target/Walmart's 90 days). According to National Retail Federation (NRF) studies, consumers forfeit billions of dollars each year because:
1. **Missed Deadlines**: Busy schedules cause consumers to forget the return window until it's too late.
2. **Missing Proof of Return**: Items are dropped off at UPS, FedEx, or store counters, but the customer loses the drop-off slip or forgets to track whether the store actually processed the credit.
3. **No Centralized Refund Visibility**: Tracking return statuses across multiple stores and cards is fragmented and tedious.

**ReturnPulse** solves both sides of this problem:
1. **Proactively monitors return deadlines** with real-time urgency countdowns, browser alerts, and calendar alarms.
2. **Confirms processed returns and refunds** by recording RMA numbers, drop-off carriers, tracking slips, and generating printable proof receipts to guarantee money is returned to the buyer.

---

## 🚀 Key Features

### 1. Smart Return Deadline Reminders & Urgency Engine
* **Real-time Deadline Calculations**: Automatically calculates exact cutoff dates based on retailer policies (e.g., 14, 30, 60, 90 days) or custom dates.
* **Color-Coded Urgency Badges**:
  * 🔥 **Urgent (&le; 3 days / 48 hours)**: Animated pulse alerts to prioritize immediate action.
  * 🟡 **Approaching (4–7 days)**: Warning indicator to decide whether to keep or return.
  * 🟢 **Safe (> 7 days)**: Healthy return window.
  * ❌ **Expired**: Visual archive of missed windows.
* **Browser Push Notifications**: Built-in Web Notifications API to alert users when deadlines are within 48 hours.
* **1-Click Calendar Export**: Generates `.ics` calendar files with automated 2-day and 1-day reminder alarms for Apple Calendar, Google Calendar, and Microsoft Outlook.

### 2. Return Confirmation & Refund Tracker (End-to-End Lifecycle)
* **Lifecycle Stages**:
  * `Active Purchase`: Tracking return window.
  * `Dropped Off / Processing`: Package dropped at UPS Store, Locker, or Counter; awaiting warehouse processing.
  * `Confirmed & Refunded`: Return verified, RMA code logged, refund amount credited.
  * `Decided to Keep`: User chose to retain item.
* **Drop-off & Tracking Records**: Logs carrier (UPS, FedEx, USPS, Store Counter), drop-off dates, and tracking numbers.
* **Printable Proof of Return Receipt**: Generates a standardized Return Proof Slip formatted for dispute prevention or record keeping.

### 3. AI Return Policy Advisor & Message Generator (INSY 3331)
* **Retailer Policy Knowledge Base**: Instant lookup of return policies and timing recommendations for Amazon, Apple, Target, Best Buy, Walmart, Costco, Nike, and Zara.
* **Transit Buffer Advisor**: Warns users when mail-in returns require shipping transit buffers to prevent warehouse rejections.
* **AI Return Reason & Note Generator**: Automatically creates professional, customer-service-ready return justification messages (for defective items, sizing issues, or late deliveries) ready to paste into support tickets or chats.

### 4. Financial KPI & Recovery Dashboard
* **Money at Risk**: Calculates total dollars sitting in active return windows.
* **Recovered Refunds**: Tracks cumulative money recovered through processed returns.
* **Multi-Filter & Search**: Filter by retailer, status, or search by item title, order ID, or RMA code.
* **Dual View**: Switch seamlessly between Card Grid View and Compact Table View.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: HTML5, Semantic Elements, Tailwind CSS (via CDN)
* **Icons & UI**: Lucide Icons, Google Inter Typography
* **Logic & State**: Modern Vanilla JavaScript (ES6+), LocalStorage Persistence
* **APIs**: Web Notifications API, Blob & URL Calendar Generator (`.ics`)
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
