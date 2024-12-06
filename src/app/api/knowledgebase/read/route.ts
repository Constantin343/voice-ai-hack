import { NextResponse } from 'next/server';
import {createClient} from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('entries')
      .select('id, title, content')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include truncated content
    const transformedData = data.map(entry => ({
      id: entry.id,
      title: entry.title,
      summary: entry.content.length > 100 
        ? `${entry.content.substring(0, 100)}...` 
        : entry.content,
    }));
    
    return NextResponse.json({ entries: transformedData });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
} 