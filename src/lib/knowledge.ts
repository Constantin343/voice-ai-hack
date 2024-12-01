import { extractKnowledgeFromTranscript } from './anthropic';
import { createClient } from '@/utils/supabase/server';

export async function updateKnowledgeBase(transcript: string, userId: string) {
    try {
        const supabase = await createClient();
        const knowledgePoints = await extractKnowledgeFromTranscript(transcript);
        
        for (const point of knowledgePoints) {
            const { error } = await supabase
                .from('entries')
                .insert([{
                    title: point.title,
                    content: point.content,
                    category: point.category,
                    user_id: userId,
                    embedding: '[]' // This will be updated by a trigger
                }]);
                
            if (error) {
                console.error('Error inserting knowledge point:', error);
            }
        }
    } catch (error) {
        console.error('Error updating knowledge base:', error);
    }
} 