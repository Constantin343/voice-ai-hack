import { extractKnowledgeFromTranscript } from './anthropic';
import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from './embeddings';
import { Database } from './database.types';
import { updateLLM } from '@/services/agent';


type MemoryEntry = {
  id: number;
  title: string;
  content: string;
  similarity: number;
};

export async function updateLLMWithUserContext(userId: string) {
    try {
        const supabase = await createClient();

        // Get all knowledge points for this user
        const { data: entries, error: entriesError } = await supabase
            .from('entries')
            .select('summary')
            .eq('user_id', userId)
            .not('summary', 'is', null);

        if (entriesError) {
            console.error('Error fetching knowledge entries:', entriesError);
            return;
        }

        // Get user persona
        const { data: persona, error: personaError } = await supabase
            .from('user_personas')
            .select('persona')
            .eq('user_id', userId)
            .single();

        if (personaError) {
            console.error('Error fetching user persona:', personaError);
            return;
        }

        // Get user's LLM ID
        const { data: userAgent, error: agentError } = await supabase
            .from('user_agent')
            .select('llm_id')
            .eq('user_id', userId)
            .single();

        if (agentError || !userAgent?.llm_id) {
            console.error('Error fetching user agent:', agentError);
            return;
        }

        // Update LLM with knowledge points and persona
        await updateLLM({
            llm_id: userAgent.llm_id,
            prompt_personalization: persona?.persona || ''
        }, entries?.map(entry => entry.summary) || []);

    } catch (error) {
        console.error('Error updating LLM with user context:', error);
    }
}

export async function updateKnowledgeBase(transcript: string, userId: string) {
    try {
        const supabase = await createClient();
        const knowledgePoints = await extractKnowledgeFromTranscript(transcript);

        console.log('Extracted knowledge points:', knowledgePoints);
        
        for (const point of knowledgePoints) {
            // Generate embedding from title and content
            const embedding = await generateEmbedding(`${point.title} ${point.content}`);
            
            const { error } = await supabase
                .from('entries')
                .insert([{
                    title: point.title,
                    content: point.content,
                    user_id: userId,
                    summary: point.summary,
                    embedding: embedding
                }]);
                
            if (error) {
                console.error('Error inserting knowledge point:', error);
            } else {
                console.log('Successfully inserted knowledge point:', point);
            }
        }
        // Update LLM with new knowledge points
        await updateLLMWithUserContext(userId);

    } catch (error) {
        console.error('Error updating knowledge base:', error);
    }
}

export async function match_entries(
  supabase: Awaited<ReturnType<typeof createClient>>, 
  query: string,
  userId: string
): Promise<MemoryEntry[]> {
  try {
    const embedding = await generateEmbedding(query);
    
    const { data, error } = await supabase.rpc('match_entries', {
      query_embedding: `[${embedding.toString()}]`,
      match_threshold: 0.7,
      match_count: 5,
      p_user_id: userId
    });

    if (error) {
      console.error('Error matching entries:', error);
      return [];
    }

    console.log('Matched entries:', data);

    return data as MemoryEntry[];
  } catch (error) {
    console.error('Error in match_entries:', error);
    return [];
  }
}