# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Bangladeshi Bachelors Mess Management App

A complete mess management system built with React + Vite and Supabase backend for Bangladeshi bachelor mess management.

## Features

✨ **Authentication**
- Google Login
- Email OTP Login
- Secure session handling

🏠 **Mess Management**
- Member management (Add/Edit/Delete)
- Monthly deposits tracking
- Daily bazar (market) expense tracking
- Meal tracking (Lunch & Dinner)
- Bangladeshi mess calculation system

📊 **Reports & Analytics**
- Monthly balance calculation
- PDF export functionality
- Excel export
- Real-time dashboard

🎨 **UI/UX**
- Modern professional design
- Animated particle background
- Dark/Light theme toggle
- Bengali/English language toggle
- Smooth Framer Motion animations
- Responsive design with Tailwind CSS

## Setup Instructions

### 1. Clone Repository (if from GitHub)
```bash
git clone https://github.com/yourusername/bangladeshi-mess-app.git
cd bangladeshi-mess-app
```

### 2. Install Dependencies

```
npm install

```

### 2. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in your project details

2. **Get Your Credentials**
   - Go to Settings → API
   - Copy your Project URL
   - Copy your anon/public key

3. **Update Environment Variables**
   - Rename `.env.example` to `.env`
   - Update the values:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   ```

4. **Database Setup**
   - The app will automatically create tables when you first log in
   - Or manually run the SQL in Supabase SQL Editor:

   ```
   -- Create members table
   create table if not exists members (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     phone text,
     created_at timestamp default now()
   );

   -- Create deposits table
   create table if not exists deposits (
     id uuid primary key default gen_random_uuid(),
     member_id uuid references members(id) on delete cascade,
     month text not null,
     amount numeric not null,
     created_at timestamp default now()
   );

   -- Create bazar table
   create table if not exists bazar (
     id uuid primary key default gen_random_uuid(),
     member_id uuid references members(id) on delete cascade,
     date date not null,
     amount numeric not null,
     description text,
     created_at timestamp default now()
   );

   -- Create meals table
   create table if not exists meals (
     id uuid primary key default gen_random_uuid(),
     member_id uuid references members(id) on delete cascade,
     date date not null,
     lunch int default 0,
     dinner int default 0,
     created_at timestamp default now(),
     unique(member_id, date)
   );

   -- Enable RLS
   alter table members enable row level security;
   alter table deposits enable row level security;
   alter table bazar enable row level security;
   alter table meals enable row level security;

   -- Create policies for authenticated users
   create policy "Allow all for authenticated users" on members for all using (auth.role() = 'authenticated');
   create policy "Allow all for authenticated users" on deposits for all using (auth.role() = 'authenticated');
   create policy "Allow all for authenticated users" on bazar for all using (auth.role() = 'authenticated');
   create policy "Allow all for authenticated users" on meals for all using (auth.role() = 'authenticated');

   ```

5. **Enable Authentication Providers** (Optional)
   - Go to Authentication → Settings → Auth Providers
   - Enable Google OAuth if you want Google login
   - Add your domain to allowed origins

### 3. Run the Application

```
npm run dev

```

The app will be available at `http://localhost:5173`

## How to Use

### 1. Authentication
- Use Google login or email OTP to sign in
- The app requires authentication to access any features

### 2. Add Members
- Go to Members page
- Click "Add Member" to add mess members
- Enter name and phone number

### 3. Monthly Deposits
- Go to Deposits page
- Add monthly deposits for each member
- Specify the month and amount

### 4. Daily Bazar
- Go to Bazar page
- Add daily market expenses
- Each member can add their bazar entries for their assigned days

### 5. Meal Tracking
- Go to Meals page
- Track lunch and dinner for each member daily
- Only 2 meals per day (Bangladeshi mess style)

### 6. Monthly Reports
- Go to Reports page
- Generate monthly balance sheet
- See who needs to pay extra and who gets refund
- Export to PDF or Excel

## Bangladeshi Mess Calculation System

The app uses the traditional Bangladeshi bachelor mess calculation:

1. **Monthly Deposits**: Each member deposits a fixed amount at month start
2. **Daily Bazar**: Members take turns (3-4 days each) to buy groceries
3. **Meal Tracking**: Only lunch and dinner counted (2 meals/day)
4. **Month-end Calculation**:
   - Total Expenses = Sum of all bazar expenses
   - Total Meals = Sum of all lunch + dinner
   - Meal Rate = Total Expenses ÷ Total Meals
   - Each Member's Cost = Meal Rate × Their Total Meals
   - Balance = (Deposit + Bazar Paid) - Meal Cost
   - Positive balance = Refund, Negative = Pay extra

## Technologies Used

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animation**: Framer Motion + Particle.js
- **Forms**: React Hook Form + Zod validation
- **Export**: jsPDF + xlsx
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout with navigation
│   └── ParticleBackground.tsx
├── contexts/           # React contexts
│   ├── ThemeContext.tsx
│   └── LanguageContext.tsx
├── lib/               # Utilities and configurations
│   ├── supabase.ts    # Supabase client and types
│   └── utils.ts       # Helper functions
├── pages/             # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Members.tsx
│   ├── Deposits.tsx
│   ├── Bazar.tsx
│   ├── Meals.tsx
│   └── Reports.tsx
└── App.tsx            # Main app component
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or need help with setup, please create an issue in the repository.

---
**Made with ❤️ for Bangladeshi Bachelor Mess Management**
