import { AppSupabaseClient, Table } from '@/types';

export const getAllPrivateItems = async (
  supabase: AppSupabaseClient
): Promise<Array<Table<'towns'>>> => {
  const { data, error } = await supabase.from('towns').select('*');

  if (error) {
    throw error;
  }

  return data;
};

export const deletePrivateItem = async (
  supabase: AppSupabaseClient,
  id: string
) => {
  const { error } = await supabase.from('towns').delete().match({ id: id as string });

  if (error) {
    throw error;
  }

  return true;
};

export const getPrivateItem = async (
  supabase: AppSupabaseClient,
  id: string
): Promise<Table<'towns'>> => {
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
