import { supabase } from './supabase-client';

/**
 * Generic function to fetch a single record by ID
 */
export async function getRecordById<T>(table: string, id: string): Promise<T> {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();

  if (error) throw error;
  return data as T;
}

/**
 * Generic function to fetch records by a field value
 */
export async function getRecordsByField<T>(
  table: string,
  field: string,
  value: string | number
): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').eq(field, value);

  if (error) throw error;
  return data as T[];
}

/**
 * Generic function to create a record
 */
export async function createRecord<T>(table: string, record: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.from(table).insert(record).select().single();

  if (error) throw error;
  return data as T;
}

/**
 * Generic function to update a record
 */
export async function updateRecord<T>(
  table: string,
  id: string,
  updates: Record<string, any>
): Promise<T> {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();

  if (error) throw error;
  return data as T;
}

/**
 * Generic function to delete a record
 */
export async function deleteRecord(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) throw error;
}
