import { NextRequest, NextResponse } from 'next/server'
import Retell from 'retell-sdk';
import { getPostTitleAndContent } from '@/lib/anthropic';
import {createClient} from "@/utils/supabase/server";
import { match_entries } from '@/lib/memory';
import { updateKnowledgeBase } from '@/lib/knowledge';
import { incrementPostCount } from '@/lib/subscription';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  
  // Get the current user from the session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const apiKey = process.env.RETELL_API_KEY;
  
  if (!apiKey) {
    console.error('Missing required environment variables');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // Get call_id from request body
    const { call_id } = await req.json();
    console.log('Received call_id:', call_id);
    
    if (!call_id) {
      return NextResponse.json(
        { error: 'call_id is required' },
        { status: 400 }
      );
    }

    const client = new Retell({
      apiKey,
      fetch: fetch
    });

    console.log('Fetching call data for call_id:', call_id);
    const callResponse = await client.call.retrieve(call_id);
    console.log('Retrieved call data:', callResponse.transcript);
    console.log('Retrieved call data, transcript length:', callResponse.transcript?.length || 0);

    const transcript = callResponse.transcript;

    if (!transcript) {
      return NextResponse.json(
        { error: 'No call data found' },
        { status: 500 }
      );
    }

    // Update this line to pass the user.id
    updateKnowledgeBase(transcript, user.id).catch(error => 
      console.error('Error in background knowledge base update:', error)
    );

    console.log('Fetching relevant memories');
    const relevantMemories = await match_entries(supabase, transcript, user.id);
    const memoriesContext = relevantMemories
      .map((memory: { title: string; content: string }) => 
        `${memory.title}: ${memory.content}`
      )
      .join('\n');
    
    console.log('Generating title and content with Anthropic');
    const { title, content, linkedin, twitter } = await getPostTitleAndContent(transcript, memoriesContext);
    console.log('Generated title:', title);

    console.log('Storing content in Supabase');
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        title,
        details: content,
        content_type: 'post',
        status: 'draft',
        linkedin_description: linkedin || null,
        x_description: twitter || null,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Successfully stored content with ID:', data.id);

    // Update user's post count if they're not subscribed
    await incrementPostCount(supabase, user.id);

    return NextResponse.json({ 
      success: true,
      data: {
        id: data.id,
        title: data.title,
        details: data.details
      }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Error processing call data' },
      { status: 500 }
    );
  }
}
