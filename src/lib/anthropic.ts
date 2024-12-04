import Anthropic from '@anthropic-ai/sdk';

export default async function request_Anthropic(prompt: string) : Promise<any> {
    const anthropic = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"]
    });

    const msg= await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
    });

    return (msg.content[0] as any).text;

}

export async function getPostTitleAndContent(thoughts: string, memory: string): Promise<any> {
    const anthropic = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"],
        maxRetries: 2,
        timeout: 30000
    });

    const systemPrompt = `
You are a professional award-winning copywriter tasked with brainstorming and crafting a blog post based on provided thoughts and memory. Your goal is to generate both a title and the main content of the post, returning them as JSON. Use the thoughts as the main idea and incorporate the memory as additional context to enrich the content.

First, you will be given the thoughts and memory. Then, you will craft a title and write the main content following specific guidelines.

# 1. Crafting the Title:
Create a succinct, engaging, and short title for the post. Keep these tips in mind:
- Clarity is Key: Avoid vague or overly abstract titles. Ensure the audience immediately understands the topic.
- Make It Intriguing: Use power words or pose a question that resonates with your audience.
- Keep It Concise: The title should be no longer than 10-12 words, with the most important words appearing early.
- Target Your Audience: Tailor the language and tone of the title to the software development or technical community.

Example titles:
- "Winning the Supabase and YC Hackathon"
- "The Future of AI in Content Creation"

# 2. Writing the Main Content:
Using the same thoughts and some memory, extract the key points to shape the thoughts. Follow these guidelines:
- Introduction: Hook the reader with an intriguing opening.
- Key Arguments or Ideas: Present the main points or arguments concisely and engagingly.
- Supporting Details: Incorporate the memory to provide examples, anecdotes, or context that enrich the main points.
- Takeaway or Call to Action: End with a conclusion that encourages further thought or engagement.
- If the conversation is short, just take all the ideas from the conversation.
- The content should be engaging, clear, and concise, suitable for a blog post or LinkedIn article.

# 3. Write LinkedIn Post:
Transform the content into a highly engaging LinkedIn post following these specific guidelines:

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
Do not incorporate emojis and hashtags

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

# 4. Write Twitter Post: 
Transform the content into a high-impact Twitter post following these guidelines:

Twitter posts are limited to 280 characters!!

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
Keep paragraphs to 1-3 lines
Use short, punchy sentences
Create curiosity gaps that make readers stop scrolling
Focus on one main message per post
Write conversationally, as if talking to one person

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

`;

    const prompt = `Here are the thoughts and memory:
        <thoughts>
        ${thoughts}
        </thoughts>
        
        <memory>
        ${memory}
        </memory>
        
        Based on the provided thoughts and memory, generate the title and main content for creating a draft`;

    try {
        const msg= await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            system: systemPrompt,
            tools: [
                {
                    "name": "create_draft",
                    "description": "Creates a draft for a writing a blog, linkedin or twitter post from the provided title and content.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "Generated title for the thoughts and memory provided."
                            },
                            "content": {
                                "type": "string",
                                "description": "The main content of the thoughts augmented with information from the provided memory."
                            },
                            "linkedin": {
                                "type": "string",
                                "description": "A Twitter post based on the title and content."
                            },
                            "twitter": {
                                "type": "string",
                                "description": "A Twitter post based on the title and content."
                            }
                        },
                        "required": ["title", "content"]
                    }
                }
            ],
            tool_choice: {"type": "tool", "name": "create_draft"},
            max_tokens: 1024,
            temperature: 0.5,
            messages: [{ role: "user", content: prompt }],
        });
        return (msg.content[0] as any).input;
    } catch (error) {
        if (error instanceof Anthropic.APIConnectionTimeoutError) {
            console.error("Timeout connecting to Anthropic API:", error);
            throw new Error("Request timed out. Please try again.");
        } else if (error instanceof Anthropic.APIConnectionError) {
            console.error("Connection error with Anthropic API:", error);
            throw new Error("Unable to connect to AI service. Please try again later.");
        } else {
            console.error("Unexpected error generating post title and content:", error);
            throw new Error("An unexpected error occurred. Please try again.");
        }
    }
}

export async function extractKnowledgeFromTranscript(transcript: string): Promise<any> {
    const anthropic = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"],
        maxRetries: 2,
        timeout: 30000
    });
    console.log('Extracting knowledge from transcript:', transcript);

    const systemPrompt = `
You are an AI tasked with extracting valuable knowledge points from conversation transcripts. 
Your goal is to identify distinct pieces of information that would be valuable to store in a knowledge base. Only extract knowledge that was mentioned by the user not the agent! Ignore the agent's thoughts and comments.
The converation is always in the context of content creation, so you don't need to mention that in the knowledge points. The user usally wants to create a post on LinkedIn or Twitter which you should not mention in the knowledge points.
Aggregate similiar aspects into one knowledge point and only create distinct knowledge points if they are clearly different.

For each knowledge point you identify:
1. Create a clear, concise title
2. Extract or summarize the relevant content concisely
3. Categorize it appropriately (e.g., 'technical', 'business', 'process', 'client', etc.)

Return the information as an array of knowledge items in JSON format.`;

    const prompt = `
Please analyze this conversation transcript and extract key knowledge points:

${transcript}

Format each knowledge point as a JSON object with 'title', 'content', and 'category' fields.
Focus on extracting factual, reusable information that would be valuable for future reference.`;

    try {
        const msg = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            system: systemPrompt,
            tools: [{
                "name": "extract_knowledge",
                "description": "Extracts knowledge points from the transcript",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "knowledge_points": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {
                                        "type": "string",
                                        "description": "Clear, concise title for the knowledge point"
                                    },
                                    "content": {
                                        "type": "string",
                                        "description": "The extracted knowledge content"
                                    },
                                    "category": {
                                        "type": "string",
                                        "description": "Category of the knowledge point"
                                    }
                                },
                                "required": ["title", "content", "category"]
                            }
                        }
                    },
                    "required": ["knowledge_points"]
                }
            }],
            tool_choice: {"type": "tool", "name": "extract_knowledge"},
            max_tokens: 1024,
            temperature: 0.5,
            messages: [{ role: "user", content: prompt }],
        });
        
        return (msg.content[0] as any).input.knowledge_points;
    } catch (error) {
        console.error("Error extracting knowledge from transcript:", error);
        throw error;
    }
}

