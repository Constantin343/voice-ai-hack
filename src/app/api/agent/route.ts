import { NextRequest, NextResponse } from 'next/server'
import Retell from 'retell-sdk';
import { createClient } from "@/utils/supabase/server";
import { checkUserSubscription } from "@/lib/subscription";
import { createOnboardingAgent } from "@/services/agent";

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

    const client = new Retell({
      apiKey,
      fetch: fetch
    });

    // Add warning when approaching limit
    if (remainingPosts <= 3 && !isSubscribed) {

      const body = await req.json().catch(() => ({}));
      let agentId = '';
      
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

    const body = await req.json().catch(() => ({}));
    
    // Use different agent ID for onboarding
    let agentId = 'agent_4ca809823f3c30a1cd561b3943'; // default agent
    
    if (body.isOnboarding) {
        // Check if we already have an onboarding agent for this user
      const { data: agentData } = await supabase
        .from('user_agents')
        .select('onboarding_agent_id')
        .eq('user_id', user.id)
        .single();

      if (agentData?.onboarding_agent_id) {
        agentId = agentData.onboarding_agent_id;
      } else {
        // TODO: remove
        agentId = "agent_4ca809823f3c30a1cd561b3943"
      } 
    } else if (body.agent_id) {
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