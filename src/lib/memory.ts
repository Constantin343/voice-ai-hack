import { createClient } from '@/utils/supabase/server';
import { Database } from './database.types';
import { generateEmbedding } from './embeddings';

type MemoryEntry = {
  id: number;
  title: string;
  content: string;
  similarity: number;
};

export async function match_entries(
  supabase: Awaited<ReturnType<typeof createClient>>, 
  query: string,
  userId: string
): Promise<MemoryEntry[]> {
  try {
    const embedding = await generateEmbedding(query);
    
    const { data, error } = await supabase.rpc('match_entries', {
      query_embedding: `[${embedding.toString()}]`,
      match_threshold: 0.7,
      match_count: 5,
      p_user_id: userId
    });

    if (error) {
      console.error('Error matching entries:', error);
      return [];
    }

    console.log('Matched entries:', data);

    return data as MemoryEntry[];
  } catch (error) {
    console.error('Error in match_entries:', error);
    return [];
  }
}