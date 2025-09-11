import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Types for our database
export interface Member {
  id: string
  name: string
  phone?: string
  created_at: string
  mess_id: string
}

export interface Deposit {
  id: string
  member_id: string
  month: string
  amount: number
  created_at: string
  members?: Member
}

export interface Bazar {
  id: string
  member_id: string
  date: string
  amount: number
  description?: string
  created_at: string
  members?: Member
}

export interface Meal {
  id:string
  member_id: string
  date: string
  lunch: number
  dinner: number
  created_at: string
  members?: Member
}

export { type Mess, type MessMember } from './mess'

/**
 * Sets up the initial database schema for members, deposits, bazar, and meals.
 * IMPORTANT: This function depends on the 'messes' table. You must run `setupMessTables` from `src/lib/mess.ts` *before* running this function.
 *
 * Note: This setup uses permissive RLS policies for demonstration purposes.
 * For a production environment, you should implement stricter policies
 * that scope data access to the user's mess.
 */
export const setupDatabase = async () => {
  try {
    // Create members table
    const { error: membersError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists members (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          phone text,
          created_at timestamp default now(),
          mess_id uuid references messes(id) on delete cascade
        );
      `
    })

    if (membersError) {
      console.log('Members table might already exist:', membersError)
    }

    // Create deposits table
    const { error: depositsError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists deposits (
          id uuid primary key default gen_random_uuid(),
          member_id uuid references members(id) on delete cascade,
          month text not null,
          amount numeric not null,
          created_at timestamp default now()
        );
      `
    })

    if (depositsError) {
      console.log('Deposits table might already exist:', depositsError)
    }

    // Create bazar table
    const { error: bazarError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists bazar (
          id uuid primary key default gen_random_uuid(),
          member_id uuid references members(id) on delete cascade,
          date date not null,
          amount numeric not null,
          description text,
          created_at timestamp default now()
        );
      `
    })

    if (bazarError) {
      console.log('Bazar table might already exist:', bazarError)
    }

    // Create meals table
    const { error: mealsError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists meals (
          id uuid primary key default gen_random_uuid(),
          member_id uuid references members(id) on delete cascade,
          date date not null,
          lunch int default 0,
          dinner int default 0,
          created_at timestamp default now(),
          unique(member_id, date)
        );
      `
    })

    if (mealsError) {
      console.log('Meals table might already exist:', mealsError)
    }

    // Enable RLS
    await supabase.rpc('exec_sql', {
      sql: `
        alter table members enable row level security;
        alter table deposits enable row level security;
        alter table bazar enable row level security;
        alter table meals enable row level security;

        -- Create policies for authenticated users
        create policy if not exists "Allow all for authenticated users" on members for all using (auth.role() = 'authenticated');
        create policy if not exists "Allow all for authenticated users" on deposits for all using (auth.role() = 'authenticated');
        create policy if not exists "Allow all for authenticated users" on bazar for all using (auth.role() = 'authenticated');
        create policy if not exists "Allow all for authenticated users" on meals for all using (auth.role() = 'authenticated');
      `
    })

    console.log('Database setup completed successfully!')
    return true
  } catch (error) {
    console.error('Error setting up database:', error)
    return false
  }
}