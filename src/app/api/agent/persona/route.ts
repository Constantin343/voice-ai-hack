import { NextRequest, NextResponse } from 'next/server'
import Retell from 'retell-sdk';
import { createClient } from "@/utils/supabase/server";
import {refinePersonaFromTranscript} from "@/lib/anthropic";

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

    const persona = await refinePersonaFromTranscript(transcript);

    const {error: upsertError} = await supabase
        .from('user_personas')
        .upsert({
          user_id: user.id,
          introduction: persona?.introduction,
          uniqueness: persona?.uniqueness,
          audience: persona?.audience,
          value_proposition: persona?.value_proposition,
          style: persona?.style,
          goals: persona?.goals
        }, {
          onConflict: 'user_id',
        });
    if (upsertError) {
      throw new Error(`Failed to store the refined persona: ${upsertError.message}`);
    }

    return NextResponse.json({ 
      success: true
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Error processing call data' },
      { status: 500 }
    );
  }
} 