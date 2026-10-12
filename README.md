# 👔 ThreadLine POS - Modern Clothing Store Point-of-Sale & Inventory Management System

A sleek, robust, and offline-first Point of Sale (POS) and Inventory Management desktop application tailored for boutique and retail apparel stores. Built with **Electron**, **React**, **TypeScript**, **Tailwind CSS v4**, and **Prisma ORM (SQLite)**.

---

## 📸 Overview

ThreadLine POS bridges the gap between fast counter operations and comprehensive store management. It features dedicated workflows for **Cashiers** and **Store Admins/Managers**:

- **Cashier / POS Terminal**: Optimized for rapid customer billing, cart management, instant inventory deduction, and thermal receipt printing.
- **Admin & Management Hub**: Centralized dashboard for daily sales metrics, stock adjustments (Add/Edit/Delete), and staff account management.

---

## ✨ Features

### 🛒 Cashier / Point-of-Sale (POS)
* **Visual Product Catalog**: Browse items by category (T-Shirts, Jeans, Frocks, etc.) with real-time stock indicators.
* **Interactive Cart System**:
  * Increment, decrement, and remove line items seamlessly.
  * Real-time calculation of subtotal, discounts, and total.
* **Instant Checkout & Atomic Transactions**:
  * Places orders while automatically decrementing the respective variant stock in SQLite via Prisma transactions.
* **Printable Thermal Receipts**:
  * Real-world standard 80mm thermal receipt layout modal.
  * Native print support (`window.print()`) styled with print-specific CSS media rules.

### 📊 Admin & Inventory Management
* **Real-time Sales Analytics**:
  * Instant view of Today's Total Revenue ($/Rs.) and Total Completed Orders.
* **Comprehensive Inventory CRUD**:
  * Add new products with automated default variants and stock allocation.
  * Edit product titles, categories, and pricing.
  * Safe cascading deletion of products and linked variants.
* **Employee / Staff Roster**:
  * Register new cashier and administrator profiles.
  * Role-based access tracking (`ADMIN` / `CASHIER`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Desktop Framework** | [Electron.js](https://www.electronjs.org/) (via `electron-vite`) |
| **Frontend UI** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Database ORM** | [Prisma ORM v6](https://www.prisma.io/) |
| **Database Engine** | [SQLite](https://sqlite.org/) (Embedded, offline-ready) |
| **Architecture** | Secure Electron IPC (Main Process ↔ Renderer Process) |

---

## 📂 Project Structure

```text
clothing-pos/
├── prisma/
│   ├── schema.prisma       # Database schema (User, Product, ProductVariant, Order, OrderItem)
│   └── dev.db              # Local SQLite database
├── src/
│   ├── main/
│   │   └── index.ts        # Electron Main process, Prisma client, and IPC handlers
│   ├── preload/
│   │   └── index.ts        # IPC Bridge exposing electron API safely to renderer
│   └── renderer/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Login.tsx            # Role selection portal
│       │   │   ├── pos/
│       │   │   │   └── POSDashboard.tsx # Cashier terminal, cart & printable receipt
│       │   │   └── admin/
│       │   │       ├── AdminDashboard.tsx # Metrics & navigation hub
│       │   │       ├── Inventory.tsx      # Stock Add/Edit/Delete management
│       │   │       └── Employees.tsx      # Employee account management
│       │   ├── App.tsx                  # React Router configuration
│       │   └── main.tsx                 # React entry point
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sachintha2001/clothing-pos.git
   cd clothing-pos
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the SQLite Database:**
   ```bash
   npx prisma db push
   ```

4. **Launch Development Server:**
   ```bash
   npm run dev
   ```

---

## 📦 Packaging & Building

To generate native desktop executables for your operating system:

```bash
# Windows (.exe installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage / .deb)
npm run build:linux
```
