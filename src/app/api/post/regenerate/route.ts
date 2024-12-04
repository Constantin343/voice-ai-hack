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
- CRITICAL: Must be complete - never end mid-sentence or with "..."
- Include a proper conclusion and call-to-action
- Format with proper line breaks

STRUCTURE:

Hook (around 50 characters): Start with a powerful first line that stops scrolling
Re-hook (around 50 characters): Follow up with a second line that reinforces and builds intrigue
Body text (around 600 - 1200 characters): Deliver the core message in an easily digestible format
End of body (around 130 characters): Wrap up with an impactful summary
CTA (around 70 characters): Include a clear call to action
2nd CTA (around 60 characters): Add a subtle reminder to share/engage

FORMATTING:

Use short, punchy paragraphs (1-3 lines each)
Add strategic line breaks between thoughts
Use bullet points or numbered lists only when absolutely necessary
Break complex ideas into simple, digestible chunks
Do not incorporate hashtags

CONTENT GUIDELINES:

Focus on one clear message or takeaway
Make it personal - share real experiences or insights
Create tension or contrast (before/after, problem/solution)
Include specific numbers or results when possible
If it fits well, add something that adds authority / credibility (based on the memory you got provided)
Be polarizing (take a clear stance) but professional
Avoid jargon or complex terminology
Write conversationally - like you're talking to one person

KEY PRINCIPLES:

Focus on grabbing attention in the first 2-3 lines
Create curiosity gaps that make readers want to click "see more"
Build momentum through short, progressive reveals
End with an engaging question or clear call to action
Make it easy to skim but rewarding to read fully through extraordinary storytelling

AVOID:

Generic opening lines that don't hook
Long, dense paragraphs
Obvious self-promotion
Complex arguments that require too much context

# Guidelines for X Post:
- Must be under 280 characters
- Complete thoughts only - no truncation
- Include call-to-action if space permits

STRUCTURE:
Start with an attention-grabbing hook
Deliver one clear, focused message
If it fits well, end with a strong call-to-action

EXAMPLE CONTENT TYPES:

Descriptive Lists: Break down complex topics into clear bullet points
Example: "The New 1%:
- Self-educated
- Highly skilled
- Emotionally intelligent"

Harsh Truths: Challenge conventional wisdom with a direct statement
Example: "Hard pill to swallow:
Most of your limitations are self-imposed."

Metaphors: Use familiar concepts to explain complex ideas
Example: "Become an online plumber:
Fix leaky pipes (stop losing customers)
Increase water pressure (generate more leads)"

Commentary: Share unique perspectives on common situations
Example: "Must be nice."
Yes.
It is.
It would be nice for you too if you stopped saying that and improved your life.

But those are just for inspiration, you don't need to follow them, and are not limited to those. 

ATTENTION-GRABBING TECHNIQUES:

Use specific numbers (metrics, statistics, dollar amounts)
Create pattern interrupts that break the scrolling habit
Leverage negativity bias ("never do X" vs "always do Y")
Target specific audiences ("If you're in your 20s...")
Call out common problems your audience faces
Use social proof without appearing boastful

WRITING STYLE:

Write with confidence - eliminate uncertainty words
Keep paragraphs to 1-2 lines
Use line breaks between thoughts
Use short, punchy sentences
Create curiosity gaps that make readers stop scrolling
Focus on one main message per post
Write conversationally, as if talking to one person
Do not use hashtags

OPTIMIZATION:

Lead with your most compelling point
Format for easy scanning
Maintain a clear focus throughout
Make content valuable as a standalone piece
Consider how your post appears in previews/feeds

ENGAGEMENT:

Encourage meaningful discussion
Make it easy for others to share
Provide actionable takeaways
Create content worth bookmarking
Build in viral sharing hooks


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
            const xMatch = response.match(/["']x_description["']\s*:\s*["']([\s\S]*?)["']\s*(?=,\s*["']linkedin_description|}\s*$)/);
            const linkedinMatch = response.match(/["']linkedin_description["']\s*:\s*["']([\s\S]*?)["']\s*(?=}|,\s*["'])/);
            
            if (!xMatch || !linkedinMatch) {
                console.error('Failed to extract content using regex. Response:', response);
                throw new Error('Failed to parse AI response');
            }
            
            parsedResponse = {
                x_description: xMatch[1].replace(/\\n/g, '\n').trim(),
                linkedin_description: linkedinMatch[1].replace(/\\n/g, '\n')
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