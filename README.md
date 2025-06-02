# LedgerLite - Cloud-based Accounting SaaS for SMEs

LedgerLite is a modern, offline-first accounting solution designed specifically for Nigerian Small and Medium Enterprises (SMEs). Built with Next.js 15, it provides essential bookkeeping features with a focus on simplicity and reliability.

## Features

### 🔐 Authentication
- Phone number-based authentication with SMS OTP
- No passwords required - secure and simple
- 30-day device memory with manual logout option

### 🏢 Company Management
- Quick setup wizard for business details
- Multi-currency support (₦ Nigerian Naira default)
- Customizable financial year settings
- Pre-loaded chart of accounts tailored for Nigerian businesses

### 📊 Double-Entry Bookkeeping
- Full double-entry ledger system
- Journal entries with debit/credit validation
- Real-time running balances
- Offline-first architecture with automatic sync

### 💰 Invoicing
- Professional invoice generation
- PDF export and print capabilities
- Integrated Paystack payment links
- Automatic payment status tracking via webhooks
- Customer management

### 📸 Expense Tracking
- Quick expense capture with photo receipts
- VAT handling (inclusive/exclusive)
- Multiple payment source tracking
- Vendor management

### 📈 Reports & Analytics
- Interactive dashboard with key metrics
- Profit & Loss statements
- Trial Balance
- General Ledger
- CSV export for all reports

### 👥 User Management
- Owner role with full access
- Staff role with limited permissions
- Granular permission controls

### 🔧 Additional Features
- Daily automated backups
- Bulk data export (CSV/PDF)
- Offline mode with IndexedDB
- Mobile-responsive design

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Offline Storage**: Dexie.js (IndexedDB)
- **Authentication**: Custom phone-based auth with OTP
- **Payment**: Paystack integration
- **PDF Generation**: jsPDF
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Deployment**: Vercel/Railway

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Paystack account (for payment processing)
- SMS gateway account (Twilio, Termii, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ledgerlite.git
cd ledgerlite
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ledgerlite

# Supabase (optional - for auth)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# SMS Provider
SMS_API_KEY=your-sms-api-key
SMS_API_URL=your-sms-api-url
SMS_SENDER_ID=LedgerLite

# Paystack
PAYSTACK_SECRET_KEY=your-paystack-secret-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your-paystack-public-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-key
```

4. Set up the database:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses a comprehensive schema designed for double-entry accounting:

- **Users**: Phone-based authentication and role management
- **Companies**: Multi-tenant support with company profiles
- **Accounts**: Chart of accounts with hierarchical structure
- **Journal Entries**: Core double-entry transactions
- **Invoices**: Customer invoicing with payment tracking
- **Expenses**: Expense tracking with VAT handling
- **Offline Sync**: Queue for offline-first functionality

## API Routes

- `/api/auth/send-otp` - Send OTP to phone number
- `/api/auth/verify-otp` - Verify OTP and login
- `/api/auth/logout` - Logout user
- `/api/sync` - Sync offline data
- `/api/webhooks/paystack` - Paystack payment webhooks
- `/api/reports/*` - Various report endpoints

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Setup (Railway/Supabase)

1. Create a PostgreSQL database
2. Run migrations:
```bash
npm run db:migrate
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@ledgerlite.com or join our Slack community.

## Roadmap

- [ ] Multi-branch support
- [ ] Advanced inventory management
- [ ] Payroll module
- [ ] Tax filing integration
- [ ] Mobile apps (iOS/Android)
- [ ] API for third-party integrations
- [ ] Advanced analytics and forecasting
