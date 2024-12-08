import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import request_Anthropic from '@/lib/anthropic';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId, selectedText, fullText, regenerationInstructions, platform } = await req.json();

        if (!postId || !selectedText || !fullText || !regenerationInstructions || !platform) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch the current post for context
        const { data: post, error: postError } = await supabase
            .from('content_items')
            .select('*')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Construct the prompt for Anthropic
        const prompt = `
You are a professional copywriter tasked with improving a specific section of a social media post.

# Post Topic Description for more context:
${post.details}

# Current ${platform.toUpperCase()} Post:
${fullText}

# Selected Text to Replace:
"${selectedText}"

# Instructions:
${regenerationInstructions}

CRITICAL RESPONSE FORMAT:
- Return ONLY the new text that will replace the selected text
- NO explanations, NO metadata, NO quotes
- NO descriptions of what you changed
- JUST the new text itself
- Must feel complete and natural, not abruptly cut off
- For bullet points, use actual bullet points (•) followed by a space
- Each bullet point should be on a new line
- Do not use \\n for line breaks, use actual line breaks

Example format:
If the selected text was:
• Strategic frameworks for success
• High-impact decision making
• Leadership principles that scale

Your response should look exactly like that, with actual bullet points and line breaks.

YOUR RESPONSE SHOULD PRESERVE THE EXACT FORMATTING OF THE ORIGINAL TEXT.
If the platform is X, make sure that the improved post does not exceed 280 characters in total! -> consider this when writing the response.
`;

        console.log('Sending prompt to Anthropic...');
        const response = await request_Anthropic(prompt);
        console.log('Raw Anthropic response:', response);

        // Clean up the response - remove any quotes, JSON formatting, or extra whitespace
        let cleanedResponse = response
            .trim()
            // Remove any JSON-like formatting
            .replace(/^{[\s\S]*".*":\s*"|"[\s\S]*}$/g, '')
            // Remove any remaining quotes at start/end
            .replace(/^["']|["']$/g, '')
            // Remove any escaped quotes
            .replace(/\\"/g, '"')
            // Replace escaped bullet points with actual bullet points
            .replace(/\\•/g, '•')
            // Replace escaped newlines with actual newlines
            .replace(/\\n/g, '\n')
            // Clean up any whitespace while preserving intentional line breaks
            .split('\n').map((line: string) => line.trim()).join('\n');

        // Check total post length for X posts
        if (platform === 'x') {
            const newTotalLength = fullText.length - selectedText.length + cleanedResponse.length;
            if (newTotalLength > 280) {
                return NextResponse.json({ 
                    error: 'Regenerated text would make the X post exceed 280 characters' 
                }, { status: 400 });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                regeneratedText: cleanedResponse
            }
        });

    } catch (error) {
        console.error('Error regenerating selection:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate selection: ' + (error as Error).message },
            { status: 500 }
        );
    }
} 