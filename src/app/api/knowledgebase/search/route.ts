import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';
import {createClient} from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const queryEmbedding = await generateEmbedding(query);
    
    const { data, error } = await supabase.rpc('match_entries', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.7,
      match_count: 5,
      p_user_id: user.id
    });

    if (error) throw error;
    
    return NextResponse.json({ results: data });
  } catch (error) {
    console.error('Error searching entries:', error);
    return NextResponse.json(
      { error: 'Failed to search entries' },
      { status: 500 }
    );
  }
} 