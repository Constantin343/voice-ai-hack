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
You are a writer tasked with brainstorming and crafting a blog post based on provided thoughts and memory. Your goal is to generate both a title and the main content of the post, returning them as JSON. Use the thoughts as the main idea and incorporate the memory as additional context to enrich the content.

First, you will be given the thoughts and memory. Then, you will craft a title and write the main content following specific guidelines.

1. Crafting the Title:
Create a succinct, engaging, and short title for the post. Keep these tips in mind:
- Clarity is Key: Avoid vague or overly abstract titles. Ensure the audience immediately understands the topic.
- Make It Intriguing: Use power words or pose a question that resonates with your audience.
- Keep It Concise: The title should be no longer than 10-12 words, with the most important words appearing early.
- Target Your Audience: Tailor the language and tone of the title to the software development or technical community.

Example titles:
- "Winning the Supabase and YC Hackathon"
- "The Future of AI in Content Creation"

2. Writing the Main Content:
Using the same thoughts and some memory, extract the key points to shape the thoughts. Follow these guidelines:
- Introduction: Hook the reader with an intriguing opening.
- Key Arguments or Ideas: Present the main points or arguments concisely and engagingly.
- Supporting Details: Incorporate the memory to provide examples, anecdotes, or context that enrich the main points.
- Takeaway or Call to Action: End with a conclusion that encourages further thought or engagement.
- If the conversation is short, just take all the ideas from the conversation.

3. Write LinkedIn Post:
- Write a LinkedIn post based on the title and content.
- Depending on the context decide if a LinkedIn post is relevant. If it is, write a LinkedIn post based on the title and content.

4. Write Twitter Post:
- Write a Twitter post based on the title and content.
- Twitter posts are limited to 280 characters!!
- Depending on the context decide if a Twitter post is relevant. If it is, write a Twitter post based on the title and content.

The content should be engaging, clear, and concise, suitable for a blog post or LinkedIn article.`;

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