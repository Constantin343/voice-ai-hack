import { NextRequest, NextResponse } from 'next/server'
import Retell from 'retell-sdk';
import { createClient } from "@/utils/supabase/server";
import { checkUserSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const apiKey = process.env.RETELL_API_KEY;

  if (!apiKey) {
    console.error('RETELL_API_KEY is not defined in environment variables');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check subscription status and post count
    const { canCreatePost, remainingPosts, isSubscribed } = await checkUserSubscription(supabase, user.id);
    
    if (!canCreatePost) {
      return NextResponse.json(
        { error: 'Free tier limit reached. Please upgrade to continue.' },
        { status: 403 }
      );
    }

    // Add warning when approaching limit
    if (remainingPosts <= 3 && !isSubscribed) {
      const client = new Retell({
        apiKey,
        fetch: fetch
      });

      const body = await req.json().catch(() => ({}));
      let agentId = 'agent_44d9118a49a822e22bfc1c2023';
      
      if (body.agent_id) {
        agentId = body.agent_id;
      }

      const webCallResponse = await client.call.createWebCall({ 
        agent_id: agentId 
      });

      return NextResponse.json({ 
        warning: 'Free tier limit approaching',
        remainingPosts,
        accessToken: webCallResponse.access_token,
        callId: webCallResponse.call_id 
      }, { status: 403 });
    }

    const client = new Retell({
      apiKey,
      fetch: fetch
    });

    const body = await req.json().catch(() => ({}));
    let agentId = 'agent_44d9118a49a822e22bfc1c2023';
    
    if (body.agent_id) {
      agentId = body.agent_id;
    }

    const webCallResponse = await client.call.createWebCall({ 
      agent_id: agentId 
    });

    return NextResponse.json({ 
      accessToken: webCallResponse.access_token,
      callId: webCallResponse.call_id 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error creating call' },
      { status: 500 }
    );
  }
} 