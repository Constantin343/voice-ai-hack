import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';
import { createClient } from "@/utils/supabase/server";
import { generateSummary } from '@/lib/anthropic';
import { updateLLMWithUserContext } from '@/lib/knowledge';

export async function PUT(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id, title, content } = await request.json();
    
    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID, title and content are required' },
        { status: 400 }
      );
    }

    // Generate new summary and embedding
    const summary = await generateSummary(title, content);
    const embedding = await generateEmbedding(content);
    
    const { error } = await supabase
      .from('entries')
      .update({
        content,
        summary,
        embedding: JSON.stringify(embedding),
      })
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only update their own entries

    if (error) throw error;

    // Update LLM context after successful update
    try {
      await updateLLMWithUserContext(user.id);
    } catch (llmError) {
      console.error('Error updating LLM context:', llmError);
      // Continue with update success response
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
} 