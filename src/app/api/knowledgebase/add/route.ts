import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';
import { createClient } from "@/utils/supabase/server";
import { generateSummary } from '@/lib/anthropic';

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { title, content } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate summary using Anthropic
    const summary = await generateSummary(title, content);
    const embedding = await generateEmbedding(content);
    
    const { error } = await supabase
      .from('entries')
      .insert([
        {
          title: title as string,
          content: content as string,
          summary: summary,
          embedding: JSON.stringify(embedding),
          user_id: user.id,
        },
      ]);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding entry:', error);
    return NextResponse.json(
      { error: 'Failed to add entry' },
      { status: 500 }
    );
  }
} 