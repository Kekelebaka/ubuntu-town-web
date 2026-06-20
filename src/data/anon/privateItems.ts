'use server';
import { createSupabaseClient } from '@/supabase-clients/server';
import { Table } from '@/types';
export const getUserPrivateItems = async (): Promise<
  Array<Table<'towns'>>
> => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from('towns').select('*');

  if (error) {
    throw error;
  }

  return data;
};

export const getPrivateItem = async (
  id: string
): Promise<Table<'towns'>> => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('towns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
