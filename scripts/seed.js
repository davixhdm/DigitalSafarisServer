import "./dnsSet.js";
import "dotenv/config";
import readline from "readline";

import { connectDB, disconnectDB } from "../config/db.js";
import AdminRole from "../models/admin/AdminRole.js";
import PaymentMethod from "../models/admin/PaymentMethod.js";
import SystemSetting from "../models/admin/SystemSetting.js";
import Legal from "../models/admin/Legal.js";
import Branding from "../models/admin/Branding.js";

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (question) =>
  new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));

const clear = () => process.stdout.write("\x1b[2J\x1b[0f");
const line = (str = "") => console.log(str);

const heading = (title) => {
  line();
  line(`${C.bold}${C.cyan}${title}${C.reset}`);
  line(`${C.dim}${"─".repeat(title.length)}${C.reset}`);
  line();
};

const ok = (msg) => line(`${C.green}✔${C.reset} ${msg}`);
const warn = (msg) => line(`${C.yellow}⚠${C.reset} ${msg}`);
const err = (msg) => line(`${C.red}✖${C.reset} ${msg}`);

const seedRoles = async () => {
  const roles = [
    {
      name: "Super Admin",
      description: "Full access to everything",
      permissions: ["*"],
      isSystem: true,
    },
    {
      name: "Support",
      description: "Customer and partner support",
      permissions: [
        "customers.read",
        "customers.write",
        "partners.read",
        "disputes.read",
        "disputes.write",
        "contacts.read",
        "contacts.write",
      ],
      isSystem: true,
    },
    {
      name: "Finance",
      description: "Payments, payouts, reports",
      permissions: [
        "payments.read",
        "payments.write",
        "payouts.read",
        "payouts.write",
        "wallets.read",
        "reports.read",
      ],
      isSystem: true,
    },
    {
      name: "Operations",
      description: "Bookings, orders, trips, broadcasts",
      permissions: [
        "operations.read",
        "operations.write",
        "broadcasts.read",
        "broadcasts.write",
      ],
      isSystem: true,
    },
  ];

  let count = 0;
  for (const role of roles) {
    await AdminRole.updateOne(
      { name: role.name },
      { $setOnInsert: role },
      { upsert: true }
    );
    count++;
  }
  ok(`Admin roles: ${count} upserted`);
};

const seedPaymentMethods = async () => {
  const methods = [
    {
      name: "mpesa",
      label: "M-Pesa",
      enabled: false,
      usedFor: { accommodation: true, food: true, transport: true, dineIn: true },
      config: {},
    },
    {
      name: "stripe",
      label: "Card (Stripe)",
      enabled: false,
      usedFor: { accommodation: true, food: false, transport: false, dineIn: false },
      config: {},
    },
    {
      name: "wallet",
      label: "DS Wallet",
      enabled: true,
      usedFor: { accommodation: true, food: true, transport: true, dineIn: true },
      config: {},
    },
  ];

  let count = 0;
  for (const m of methods) {
    await PaymentMethod.updateOne(
      { name: m.name },
      { $setOnInsert: m },
      { upsert: true }
    );
    count++;
  }
  ok(`Payment methods: ${count} upserted`);
};

const seedSettings = async () => {
  const settings = [
    { key: "general", value: {
      appName: "Digital Safaris",
      apiUrl: "http://localhost:5000",
      clientUrl: "http://localhost:3000",
      adminUrl: "http://localhost:3001",
      partnerUrl: "http://localhost:3002",
      websiteUrl: "http://localhost:3003",
      timezone: "Africa/Nairobi",
      currency: "KES",
      language: "en",
      supportEmail: "support@digitalsafaris.com",
      supportPhone: "+254 700 000 000",
      logoUrl: null,
    }, group: "general" },

    { key: "commission", value: {
      food: 10,
      transport: 10,
      accommodation: 10,
    }, group: "commission" },

    { key: "payout", value: {
      minAmount: 500,
      schedule: "weekly",
      day: "friday",
      time: "17:00",
    }, group: "payout" },

    { key: "broadcast", value: {
      radiusKm: 5,
      expirySeconds: 60,
    }, group: "broadcast" },

    { key: "payment", value: {
      mpesa: { enabled: false },
      stripe: { enabled: false },
      wallet: { enabled: true },
    }, group: "payment" },

    { key: "backup", value: {
      enabled: true,
      frequency: "daily",
      time: "02:00",
      retentionDays: 30,
      notifyEmail: true,
    }, group: "backup" },

    { key: "branding", value: {
      logo: null,
      logoUrl: null,
      favicon: null,
      emailHeaderLogo: null,
      primaryColor: "#1A1F2E",
      secondaryColor: "#C9A063",
      fontFamily: "Montserrat",
      metaTitle: "Digital Safaris",
      metaDescription: "Your concierge, reimagined.",
    }, group: "branding" },
  ];

  let count = 0;
  for (const s of settings) {
    await SystemSetting.updateOne(
      { key: s.key },
      { $setOnInsert: s },
      { upsert: true }
    );
    count++;
  }
  ok(`System settings: ${count} upserted`);
};

const seedLegals = async () => {
  const terms = `# Digital Safaris — Terms of Service

By using Digital Safaris you agree to these terms.

## Account
You are responsible for your account and any activity under it.

## Bookings and Orders
Bookings and orders are subject to partner availability and confirmation.

## Payments
All payments are processed via M-Pesa, Stripe, or DS Wallet.

## Contact
support@digitalsafaris.com
`;

  const privacy = `# Digital Safaris — Privacy Policy

We collect the minimum data needed to operate the platform.

## What we collect
- Name, email, phone
- Booking and order data
- Payment references

## Sub-processors
- Safaricom Daraja (M-Pesa)
- Stripe (card payments)
- hdmBridge (email + SMS)
- Cloudinary (file storage)
- HDM AI (concierge)

## Contact
support@digitalsafaris.com
`;

  const cookies = `# Digital Safaris — Cookie Policy

We use cookies to keep you signed in and to remember your preferences.

## Contact
support@digitalsafaris.com
`;

  const docs = [
    { type: "terms", title: "Terms of Service", content: terms },
    { type: "privacy", title: "Privacy Policy", content: privacy },
    { type: "cookies", title: "Cookie Policy", content: cookies },
  ];

  let inserted = 0;
  for (const d of docs) {
    const existing = await Legal.findOne({ type: d.type }).lean();
    if (existing) continue;
    await Legal.create({
      type: d.type,
      title: d.title,
      content: d.content,
      version: "1.0",
      status: "active",
    });
    inserted++;
  }
  ok(`Legal docs: ${inserted} inserted`);
};

const seedBranding = async () => {
  const existing = await Branding.findOne().lean();
  if (existing) {
    warn("Branding already exists");
    return;
  }
  await Branding.create({
    primaryColor: "#1A1F2E",
    secondaryColor: "#C9A063",
    fontFamily: "Montserrat",
    metaTitle: "Digital Safaris",
    metaDescription: "Your concierge, reimagined.",
  });
  ok("Branding inserted");
};

const menu = async () => {
  clear();
  line();
  line(`${C.bold}${C.cyan}╭───────────────────────────────────────╮${C.reset}`);
  line(`${C.bold}${C.cyan}│   Digital Safaris — Seed CLI          │${C.reset}`);
  line(`${C.bold}${C.cyan}╰───────────────────────────────────────╯${C.reset}`);
  line();
  line(`  ${C.bold}1${C.reset}.  Seed all`);
  line(`  ${C.bold}2${C.reset}.  Seed admin roles`);
  line(`  ${C.bold}3${C.reset}.  Seed payment methods`);
  line(`  ${C.bold}4${C.reset}.  Seed system settings`);
  line(`  ${C.bold}5${C.reset}.  Seed legal docs`);
  line(`  ${C.bold}6${C.reset}.  Seed branding`);
  line();
  line(`  ${C.dim}0.  Exit${C.reset}`);
  line();

  return await ask(`${C.cyan}›${C.reset} Select option: `);
};

const main = async () => {
  clear();
  line(`${C.dim}Connecting to MongoDB...${C.reset}`);

  try {
    await connectDB();
    ok("Connected");
  } catch (e) {
    err(`Connection failed: ${e.message}`);
    process.exit(1);
  }

  while (true) {
    const choice = await menu();

    try {
      heading("Seeding");

      if (choice === "1") {
        await seedRoles();
        await seedPaymentMethods();
        await seedSettings();
        await seedLegals();
        await seedBranding();
        line();
        ok("All seeds complete");
      } else if (choice === "2") {
        await seedRoles();
      } else if (choice === "3") {
        await seedPaymentMethods();
      } else if (choice === "4") {
        await seedSettings();
      } else if (choice === "5") {
        await seedLegals();
      } else if (choice === "6") {
        await seedBranding();
      } else if (choice === "0") {
        break;
      } else {
        continue;
      }
    } catch (e) {
      err(e.message);
    }

    await ask(`${C.dim}Press Enter to continue...${C.reset}`);
  }

  rl.close();
  await disconnectDB();
  line();
  ok("Bye");
  process.exit(0);
};

main();