import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { updateLLMWithUserContext } from '@/lib/knowledge';

export async function DELETE(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', success: false },
      { status: 401 }
    );
  }

  try {
    const { id } = await request.json();
    console.log('Attempting to delete entry:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required', success: false },
        { status: 400 }
      );
    }

    // Perform the deletion
    const { error: deleteError, data } = await supabase
      .from('entries')
      .delete()
      .eq('id', Number(id))
      .eq('user_id', user.id) // Ensure user owns the entry
      .select();

    if (deleteError) {
      console.error('Error deleting entry:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete entry', success: false },
        { status: 500 }
      );
    }

    // Try to update LLM context, but don't fail if it errors
    try {
      await updateLLMWithUserContext(user.id);
    } catch (llmError) {
      console.error('Error updating LLM context:', llmError);
      // Continue with deletion success response
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Entry deleted successfully',
      deletedEntry: data
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry', success: false },
      { status: 500 }
    );
  }
} 