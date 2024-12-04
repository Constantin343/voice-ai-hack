import { NextRequest, NextResponse } from 'next/server'
import Retell from 'retell-sdk';
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { call_id } = await req.json();
    
    if (!call_id) {
      return NextResponse.json(
        { error: 'call_id is required' },
        { status: 400 }
      );
    }
    
    if (!process.env.RETELL_API_KEY) {
      return NextResponse.json(
        { error: 'RETELL_API_KEY is not set' },
        { status: 500 }
      );
    }

    const client = new Retell({
      apiKey: process.env.RETELL_API_KEY,
      fetch: fetch
    });

    const callResponse = await client.call.retrieve(call_id);
    const transcript = callResponse.transcript;

    if (!transcript) {
      return NextResponse.json(
        { error: 'No call data found' },
        { status: 500 }
      );
    }

    // TODO: Process the transcript to extract persona information
    // For now, just return the transcript
    return NextResponse.json({ 
      success: true,
      data: {
        transcript,
        // Add processed persona data here later
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