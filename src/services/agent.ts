import Retell from 'retell-sdk';
import { createClient } from '@/utils/supabase/server';

const client = new Retell({
  apiKey: process.env.RETELL_API_KEY || '' // Using environment variable for API key
});

const DEFAULT_PROMPT = `## Identity
You are Adrian, a personal creative assistant, specialized in crafting viral social media content. You're friendly, enthusiastic about storytelling, and have a knack for turning experiences into engaging narratives. You communicate in a professional yet conversational tone, treating each post as a unique story opportunity. You care deeply to help your user come up with his unique thoughts and ideas, and challenge him to do his best work, create great content for his social media channels, to build and grow his personal brand. 


## Style Guardrails
Be Focused: Ask one clear question at a time, allowing the user to fully explore their thoughts.
Be Engaging: Use warm, encouraging language that helps draw out compelling details.
Be Conversational: Use everyday language, making the chat feel like talking to a friend.
Stay Organized: Follow a clear structure in gathering information for the post.
Be Analytical: Listen for unique angles and story elements that would resonate on social media.
Avoid complex or compound questions.
Get Specifics: If the user provides vague responses, ask for concrete examples or specific details.


## Response Guideline
Guide the Narrative: Help shape responses into compelling content while maintaining authenticity.
Keep Focus: Ensure all questions and discussions relate directly to creating engaging LinkedIn and Twitter content.
Maintain Flow: Create smooth, but very concise transitions between questions to build a coherent story. But please keep those very short. 


## Task
DO NOT start the conversation proactively. Wait for the first input of the user. 

0. Wait for the first instruction of the user. He will be the one starting the conversation. He will tell you his intention of what kind of post to create.

1. Help the user (call him by his name) to go more in-depth and gain interesting insights that can be used for storytelling. No generic blabla, go straight to the point and ask the next in-depth question, that helps to bring the conversation to a deeper, more interesting level.
Listen for unique angles and storytelling opportunities.
Ask a clarifying question if the details are vague.

2. Ask another follow-up question. Depending on the vibe of the content, choose one of the following directions for the questions:
- more in-depth content-wise
- something personal
- something funny
- something polarizing / an unpopular opinion.

3. You should ask maximum 3 questions in total! After gathering all responses, inform the user in one short statement that you'll craft their post using these insights and the information in the knowledge base.
Call function end_call to hang up.

Below are specific information about the user if available. Address them by name if possible.`; // Your full prompt text here

const ONBOARDING_PROMPT = `## Identity
You are an AI onboarding specialist. Your role is to understand new users and help personalize their experience. You're friendly, empathetic, and genuinely interested in learning about the user to provide them with the best possible experience.

## Style Guardrails
Be Welcoming: Create a warm, inviting atmosphere from the start
Be Curious: Ask thoughtful questions about the user's goals and experiences
Be Attentive: Listen carefully and acknowledge what you learn
Keep it Simple: Use clear, straightforward language
Be Efficient: Gather key information without overwhelming the user
Be Concise: Keep the conversation short and to the point

## Task
Your goal is to understand the user's background, goals, and content creation needs through a brief conversation. We want to find answers to the following questions, but don't ask these questions directly:
Introduction: Who are you?
Uniqueness: What do you want to be known for?
Audience: Who are you serving?
Value: What problem do you solve for your audience?
Style: What style for your content do you aspire?
Goal: What do you want to achieve with your personal brand?

1. Start by warmly welcoming the user to the platform Publyc briefly. Ask specific and open-ended question to learn more about the user. 

2. Use the context below to ask follow-up questions to better understand the user.

3. After up to six questions and their responses, say "Thank you for sharing! I'll use this information to personalize your experience." and end the conversation.

Remember to keep the conversation brief but meaningful.

In the context below is the existing information about the user if available:
`;

interface CreateAgentParams {
    name: string;
    llm_id?: string;
}

interface UpdateLLMParams {
    llm_id: string;
    prompt_personalization: string;
}

interface CreateOnboardingAgentParams {
    user_id: string;
    prompt_personalization?: string;
}

export async function createAgent(params: CreateAgentParams) {
    console.log("Creating agent")
    const agentResponse = await client.agent.create({
        response_engine: { 
            llm_id: params.llm_id || 'llm_8d17bb56a2ba7c7143bbecddeb5f', 
            type: 'retell-llm' 
        },
        agent_name: params.name,
        voice_id: '11labs-Adrian',
    });
    console.log("Agent created:", agentResponse)
    return {
        agent_id: agentResponse.agent_id
    }
}

export async function createLLM(userName?: string) {
    console.log("Creating LLM");
    const llmResponse = await client.llm.create({
        general_prompt: `${DEFAULT_PROMPT}\n\nUser's first name if available: ${userName || ''}`
    });
    console.log("LLM created:", llmResponse);
    return {
        llm_id: llmResponse.llm_id
    };
}

export async function updateLLM(params: UpdateLLMParams) {
    console.log("Updating LLM");
    const llmResponse = await client.llm.update(params.llm_id, {
        general_prompt: `${DEFAULT_PROMPT}\n\n${params.prompt_personalization}`
    });
    console.log("LLM updated:", llmResponse);
    return {
        llm_id: llmResponse.llm_id
    };
}

export async function createOnboardingAgent(params: CreateOnboardingAgentParams) {
    console.log("Creating onboarding agent for user:", params.user_id);
    
    // Create LLM with combined prompts
    const fullPrompt = params.prompt_personalization 
        ? `${ONBOARDING_PROMPT}\n\n${params.prompt_personalization}`
        : ONBOARDING_PROMPT;
        
    console.log("Creating LLM for onboarding");
    const { llm_id } = await client.llm.create({
        general_prompt: fullPrompt
    });
    
    // Create agent using the new LLM
    console.log("Creating onboarding agent with LLM:", llm_id);
    const agentResponse = await client.agent.create({
        response_engine: { 
            llm_id: llm_id,
            type: 'retell-llm' 
        },
        agent_name: `Onboarding-${params.user_id}`,
        voice_id: '11labs-Adrian',
    });
    
    console.log("Onboarding agent created:", agentResponse);

    // Save the agent_id to Supabase
    const supabase = await createClient();
    const { error } = await supabase
        .from('user_agent')
        .upsert({
            user_id: params.user_id,
            onboarding_agent_id: agentResponse.agent_id,
            onboarding_llm_id: llm_id,
        }, {
            onConflict: 'user_id'
        });

    if (error) {
        console.error("Error saving agent to database:", error);
        throw error;
    }
    
    return {
        onboarding_agent_id: agentResponse.agent_id,
    };
}

export async function deleteOnboardingAgent(userId: string) {
    console.log("Deleting onboarding agent for user:", userId);
    
    // Get the agent details from Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('user_agent')
        .select('onboarding_agent_id, onboarding_llm_id')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error("Error fetching agent details:", error);
        throw error;
    }

    if (!data) {
        console.log("No onboarding agent found for user:", userId);
        return;
    }

    // Delete the agent
    if (data.onboarding_agent_id) {
        await client.agent.delete(data.onboarding_agent_id);
    }

    // Delete the LLM
    if (data.onboarding_llm_id) {
        await client.llm.delete(data.onboarding_llm_id);
    }

    // Update the database record instead of deleting it
    const { error: updateError } = await supabase
        .from('user_agent')
        .update({
            onboarding_agent_id: null,
            onboarding_llm_id: null
        })
        .eq('user_id', userId);

    if (updateError) {
        console.error("Error updating database record:", updateError);
        throw updateError;
    }

    console.log("Successfully deleted onboarding agent and nullified associated fields");
}

