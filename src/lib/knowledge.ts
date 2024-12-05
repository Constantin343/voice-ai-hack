import { extractKnowledgeFromTranscript } from './anthropic';
import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from './embeddings';

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
                    embedding: embedding
                }]);
                
            if (error) {
                console.error('Error inserting knowledge point:', error);
            } else {
                console.log('Successfully inserted knowledge point:', point);
                //TODO: Also update retell knowledge base
            }
        }
    } catch (error) {
        console.error('Error updating knowledge base:', error);
    }
}