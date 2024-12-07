import { createClient } from '@/utils/supabase/server'
import { updateLLM } from '@/services/agent'
import { NextRequest,NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    console.log("Updating agent persona")
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's given_name from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('given_name')
            .eq('id', user.id)
            .single()

        if (userError) {
            console.error('Error fetching user data:', userError)
        }

        // Get existing knowledge entries
        const { data: entries, error: entriesError } = await supabase
            .from('entries')
            .select('summary')
            .eq('user_id', user.id)
            .not('summary', 'is', null);

        if (entriesError) {
            console.error('Error fetching knowledge entries:', entriesError);
        }

        const body = await request.json()
        const { introduction, uniqueness, audience, value_proposition, style, goals } = body

        // Create a formatted prompt personalization from the persona data
        const prompt_personalization = `
            ## User Persona Information

            Introduction:
            ${introduction}

            Uniqueness:
            ${uniqueness}

            Target Audience:
            ${audience}

            Value Proposition:
            ${value_proposition}

            Content Style:
            ${style}

            Goals:
            ${goals}
`

        // Get the existing LLM ID from the database
        const { data: agentData } = await supabase
            .from('user_agent')
            .select('llm_id')
            .eq('user_id', user.id)
            .single()

        if (!agentData?.llm_id) {
            return NextResponse.json({ error: 'No LLM found for user' }, { status: 500 })
        }

        // Update the LLM with all parameters in a single object
        await updateLLM({
            llm_id: agentData.llm_id,
            prompt_personalization,
            userName: userData?.given_name,
            knowledgeEntries: entries?.map(entry => entry.summary) || []
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating agent persona:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 