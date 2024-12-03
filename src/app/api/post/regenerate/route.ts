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

        const { postId, regenerationInstructions } = await req.json();

        if (!postId || !regenerationInstructions) {
            return NextResponse.json({ error: 'Post ID and regeneration instructions are required' }, { status: 400 });
        }

        // Fetch the current post
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
You are a professional copywriter tasked with polishing social media posts based on specific instructions.

# Original Content:
${post.details}

# Original X Post:
${post.x_description}

# Original LinkedIn Post:
${post.linkedin_description}

#User Instructions:
${regenerationInstructions}

# Your Task:
Please regenerate both posts COMPLETELY. Do not truncate or leave any post unfinished.

Your response MUST be in this exact JSON format, with COMPLETE posts:
{
    "x_description": "your complete X post here (max 280 chars)",
    "linkedin_description": "your complete LinkedIn post here - IMPORTANT: FINISH THE ENTIRE POST, DO NOT TRUNCATE"
}

# Guidelines for LinkedIn Post:
- Must be complete - never end mid-sentence or with "..."
- Include a proper conclusion and call-to-action
- Format with proper line breaks
- Keep paragraphs short (1-3 lines)
- Professional tone throughout
- Complete all thoughts fully

# Guidelines for X Post:
- Must be under 280 characters
- Complete thoughts only - no truncation
- Include call-to-action if space permits

Remember: Both posts must be complete with proper endings. Never leave a post unfinished.`;

        console.log('Sending prompt to Anthropic...');
        const response = await request_Anthropic(prompt);
        console.log('Raw Anthropic response:', response);
        
        let parsedResponse;
        try {
            // First try parsing the entire response as JSON
            parsedResponse = JSON.parse(response);
            console.log('Successfully parsed JSON response:', parsedResponse);
        } catch (e) {
            console.log('Failed to parse JSON directly, trying regex extraction...');
            // If that fails, try to extract the content using regex
            const xMatch = response.match(/["']x_description["']\s*:\s*["']([^"']*)["']/);
            const linkedinMatch = response.match(/["']linkedin_description["']\s*:\s*["']([^"']*)["']/);
            
            if (!xMatch || !linkedinMatch) {
                console.error('Failed to extract content using regex. Response:', response);
                throw new Error('Failed to parse AI response');
            }
            
            parsedResponse = {
                x_description: xMatch[1],
                linkedin_description: linkedinMatch[1]
            };
            console.log('Successfully extracted content using regex:', parsedResponse);
        }

        // Validate the response
        if (!parsedResponse.x_description || !parsedResponse.linkedin_description) {
            console.error('Invalid response structure:', parsedResponse);
            throw new Error('Invalid AI response structure');
        }

        // Ensure X post is within character limit
        if (parsedResponse.x_description.length > 280) {
            parsedResponse.x_description = parsedResponse.x_description.substring(0, 280);
        }

        // Update the post in the database
        const { error: updateError } = await supabase
            .from('content_items')
            .update({
                x_description: parsedResponse.x_description,
                linkedin_description: parsedResponse.linkedin_description
            })
            .eq('id', postId);

        if (updateError) {
            console.error('Database update error:', updateError);
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            data: {
                x_description: parsedResponse.x_description,
                linkedin_description: parsedResponse.linkedin_description
            }
        });

    } catch (error) {
        console.error('Error regenerating post:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate post: ' + (error as Error).message },
            { status: 500 }
        );
    }
}