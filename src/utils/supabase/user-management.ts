import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { createAgent, createLLM } from '@/services/agent'

export async function handleUserAgentConnection(
  supabase: SupabaseClient<Database>,
  userId: string
) {
    console.log("checking if user_agent exists")

    // Check if connection exists
    const { data: existingConnection, error: fetchError } = await supabase
        .from('user_agent')
        .select('*')
        .eq('user_id', userId)
        .single()

    console.log("existingConnection", existingConnection)

    if (fetchError) {
        console.error('Error fetching user_agent:', fetchError)
    }

    // Create new agent if there's no connection or if agent_id is missing
    if (!existingConnection || !existingConnection.agent_id) {
        console.log("Creating new agent - no existing connection or missing agent_id")
        try {
            const { llm_id } = await createLLM()
            const { agent_id } = await createAgent({
                name: userId,
                llm_id: llm_id
            })

            // Upsert connection with new agent_id
            const { error: upsertError } = await supabase
                .from('user_agent')
                .upsert(
                    {
                        user_id: userId,
                        agent_id: agent_id,
                        llm_id: llm_id
                    },
                    { onConflict: 'user_id' }
                )
            
            if (upsertError) {
                throw upsertError
            }

            return { user_id: userId, agent_id: agent_id, llm_id: llm_id }
        } catch (error) {
            console.error('Error in handleUserAgentConnection:', error)
            throw error
        }
    }

    return existingConnection
} 