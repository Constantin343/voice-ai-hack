import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('entries')
      .select('id, title, content, summary')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ entries: data });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
} 