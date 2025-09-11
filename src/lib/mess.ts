/**
 * @file This file contains all the functions for managing messes and mess members in the database.
 * It includes functions for setting up the necessary tables, creating and joining messes,
 * and fetching mess-related data.
 */
import { supabase } from './supabase'

// Types for our new tables
export interface Mess {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface MessMember {
  mess_id: string
  user_id: string
  role: 'manager' | 'member'
  created_at: string
}

/**
 * Sets up the necessary tables for mess management in the database.
 * This includes creating the 'messes' and 'mess_members' tables
 * and setting up Row Level Security (RLS) policies.
 */
export const setupMessTables = async () => {
  try {
    // Create the 'messes' table
    const { error: messesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS messes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    if (messesError) throw new Error(`Failed to create messes table: ${messesError.message}`)

    // Create the 'mess_members' table
    const { error: messMembersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS mess_members (
          mess_id UUID REFERENCES messes(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('manager', 'member')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (mess_id, user_id)
        );
      `
    })
    if (messMembersError) throw new Error(`Failed to create mess_members table: ${messMembersError.message}`)

    // Enable RLS on the new tables
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE messes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE mess_members ENABLE ROW LEVEL SECURITY;
      `
    })

    // RLS Policies for 'messes'
    // 1. Allow users to see messes they are members of.
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow members to read their mess"
        ON messes FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM mess_members
            WHERE mess_members.mess_id = messes.id
            AND mess_members.user_id = auth.uid()
          )
        );
      `
    })
    // 2. Allow any authenticated user to create a mess.
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to create a mess"
        ON messes FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
      `
    })

    // RLS Policies for 'mess_members'
    // 1. Allow users to see their own membership.
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow users to read their own membership"
        ON mess_members FOR SELECT
        USING (user_id = auth.uid());
      `
    })
    // 2. Allow managers to add new members to their mess.
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow managers to add members"
        ON mess_members FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM mess_members
            WHERE mess_members.mess_id = mess_id
            AND mess_members.user_id = auth.uid()
            AND mess_members.role = 'manager'
          )
        );
      `
    })
    // 3. Allow users to join a mess (self-insertion).
    await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Allow users to join a mess"
          ON mess_members FOR INSERT
          WITH CHECK (user_id = auth.uid());
        `
      })

    console.log('Mess tables and RLS policies set up successfully.')
    return true
  } catch (error) {
    console.error('Error setting up mess tables:', error)
    return false
  }
}

/**
 * Creates a new mess and assigns the creator as the manager.
 * @param userId - The ID of the user creating the mess.
 * @param messName - An optional name for the mess.
 * @returns The newly created mess object.
 */
export const createMess = async (userId: string, messName: string = 'My Mess') => {
  // Step 1: Create the mess
  const { data: mess, error: messError } = await supabase
    .from('messes')
    .insert({ name: messName, created_by: userId })
    .select()
    .single()

  if (messError) throw new Error(`Failed to create mess: ${messError.message}`)
  if (!mess) throw new Error('Failed to create mess, no data returned.')

  // Step 2: Add the creator as a manager
  const { error: memberError } = await supabase
    .from('mess_members')
    .insert({ mess_id: mess.id, user_id: userId, role: 'manager' })

  if (memberError) {
    // If adding the member fails, we should roll back the mess creation
    await supabase.from('messes').delete().eq('id', mess.id)
    throw new Error(`Failed to add manager to mess: ${memberError.message}`)
  }

  return mess
}

/**
 * Allows a user to join an existing mess.
 * @param userId - The ID of the user joining the mess.
 * @param messId - The ID of the mess to join.
 * @returns The joined mess object.
 */
export const joinMess = async (userId: string, messId: string) => {
  // Step 1: Verify the mess exists
  const { data: mess, error: messError } = await supabase
    .from('messes')
    .select('id')
    .eq('id', messId)
    .single()

  if (messError || !mess) {
    throw new Error('Mess not found. Please check the ID and try again.')
  }

  // Step 2: Add the user as a member
  const { error: memberError } = await supabase
    .from('mess_members')
    .insert({ mess_id: mess.id, user_id: userId, role: 'member' })

  if (memberError) {
    if (memberError.code === '23505') { // Unique constraint violation
      throw new Error('You are already a member of this mess.')
    }
    throw new Error(`Failed to join mess: ${memberError.message}`)
  }

  return mess
}

/**
 * Fetches the details of a mess if the user is a member.
 * @param messId - The ID of the mess to fetch.
 * @returns The mess object.
 */
export const getMessDetails = async (messId: string) => {
    const { data: mess, error } = await supabase
      .from('messes')
      .select('*')
      .eq('id', messId)
      .single();

    if (error) throw new Error(error.message);
    return mess;
  };

  /**
   * Fetches all members of a given mess.
   * @param messId - The ID of the mess.
   * @returns An array of member objects.
   */
  export const getMessMembers = async (messId: string) => {
    const { data: members, error } = await supabase
      .from('mess_members')
      .select(`
        user_id,
        role,
        users ( id, email )
      `)
      .eq('mess_id', messId);

    if (error) throw new Error(error.message);
    return members;
  };
