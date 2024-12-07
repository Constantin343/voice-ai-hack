import Anthropic from '@anthropic-ai/sdk';
import {createClient} from "@/utils/supabase/server";

export default async function request_Anthropic(prompt: string): Promise<any> {
    const anthropic = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"]
    });

    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [{
            role: "user",
            content: prompt
        }],
        temperature: 0.7,
        system: "You are a professional copywriter. Always return responses in valid JSON format when asked. Never truncate or shorten the response. Complete all sections fully."
    });

    console.log('Anthropic API response:', msg.content);
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
- Keep It Concise: The title should be no longer than 55 characters, with the most important words appearing early. 55 characters is the maximum length for the title!
- Target Your Audience: Tailor the language and tone of the title to the software development or technical community.

Example titles:
- "Winning the Supabase and YC Hackathon"
- "The Future of AI in Content Creation"

# 2. Writing the Main Content:
Using the same thoughts (and some relevant memory, but only if something similar was mentioned in the thoughts!), extract the key points to shape the thoughts. Follow these guidelines:
- Introduction: Hook the reader with an intriguing opening in which you introduce the main idea in one sentence.
- Key Arguments or Ideas: Present the main points or arguments concisely and engagingly; use bullet points if needed.
- Supporting Details: Incorporate the memory to provide examples, anecdotes, or context that enrich the main points.
- Takeaway or Call to Action: End with a conclusion that encourages further thought or engagement.
- If the conversation is short, just take all the ideas from the conversation.
- The content should be engaging, clear, and concise -> just like a good brainstorming session summary.
- Be really concise and only include the most important points. No generic blabla. Straight to the point.

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
        const msg = await anthropic.messages.create({
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
            messages: [{role: "user", content: prompt}],
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
4. Create a summary of the knowledge point that is a single bullet point and captures the key facts.

Return the information as an array of knowledge items in JSON format.`;

    const prompt = `
Please analyze this conversation transcript and extract key knowledge points:

${transcript}

Format each knowledge point as a JSON object with 'title', 'content' fields.
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
                                    "summary": {
                                        "type": "string",
                                        "description": "A summary of the knowledge point"
                                    }
                                },
                                "required": ["title", "content", "summary"]
                            }
                        }
                    },
                    "required": ["knowledge_points"]
                }
            }],
            tool_choice: {"type": "tool", "name": "extract_knowledge"},
            max_tokens: 1024,
            temperature: 0.5,
            messages: [{role: "user", content: prompt}],
        });

        return (msg.content[0] as any).input.knowledge_points;
    } catch (error) {
        console.error("Error extracting knowledge from transcript:", error);
        throw error;
    }
}

const PERSONA_CREATION_PROMPT_OUPUT_TOOL: any = {
    "name": "personal_branding_analysis",
    "description": "Analyzes and refines personal branding inputs to create a cohesive personal brand strategy",
    "input_schema": {
        "type": "object",
        "properties": {
            "introduction": {
                "type": "string",
                "description": "A concise introduction describing who you are, what you do, and what you're passionate about.Example:\n" +
                    "I help people see the world differently. I'm a tech visionary and storyteller who believes in the intersection of technology and liberal arts. My passion lies in creating products that aren't just tools, but extensions of the human experience - products that change how we live, work, and think.\n" +
                    "\n" +
                    "I'm not just a tech entrepreneur; I'm someone who stands at the crossroads of counterculture and technology. From calligraphy classes at Reed College to zen meditation in India, my journey has been about seeking perfection in simplicity and bringing that vision to life through technology.\n"
            },
            "uniqueness": {
                "type": "string",
                "description": "Details about what makes you unique and how you want to be perceived. Example:\n" +
                    "I want to be known as the person who makes technology human. My uniqueness comes from:\n" +
                    "\n" +
                    "- The ability to see what others don't and make the impossible seem inevitable\n" +
                    "- Merging design, humanities, and technology in ways nobody else does\n" +
                    "- Uncompromising pursuit of perfection in every detail\n" +
                    "- Ability to distill complex technologies into magical experiences\n" +
                    "- Creating reality distortion fields that push people beyond their perceived limits\n"
            },
            "audience": {
                "type": "string",
                "description": "The target audience you aim to serve with your personal brand, based on your goals and skills. Example:\n" +
                    "I serve the dreamers, the misfits, the rebels, the troublemakers - the ones who see things differently. Specifically:   \n" +
                    "- Innovators and entrepreneurs who want to make a dent in the universe\n" +
                    "- Creative professionals who use technology to bring their visions to life\n" +
                    "- Technology enthusiasts who believe in the power of design\n" +
                    "- Business leaders looking to create category-defining products\n" +
                    "- Anyone who believes that the best way to predict the future is to invent it\n"
            },
            "value_proposition": {
                "type": "string",
                "description": "The specific value you provide to your audience, detailing the problems you solve and how. Example:\n" +
                    "I solve the fundamental problem of complexity in technology. Here's how:\n" +
                    "\n" +
                    "- I show people what they need before they know they need it\n" +
                    "- I simplify the complex into something beautiful and intuitive\n" +
                    "- I help organizations think differently about product development\n" +
                    "- I demonstrate how to build products that create emotional connections\n" +
                    "- I inspire people to push beyond the ordinary and achieve the extraordinary\n" +
                    "\n" +
                    "For my audience, I translate this into:\n" +
                    "\n" +
                    "- Insights about building revolutionary products\n" +
                    "- Strategies for creating category-defining companies\n" +
                    "- Frameworks for thinking differently about design and user experience\n" +
                    "- Leadership principles for driving innovation\n" +
                    "- Stories that inspire people to pursue their crazy ideas"
            },
            "style": {
                "type": "string",
                "description": "The tone, visual, and verbal style you aspire to in your content. Example:\n" +
                    "Content Tone:\n" +
                    "\n" +
                    "- Minimalist yet powerful\n" +
                    "- Bold, contrarian statements\n" +
                    "- Theatrical buildups with \"one more thing\" moments\n" +
                    "- Zero tolerance for mediocrity\n" +
                    "- Short, quotable mantras\n" +
                    "\n" +
                    "Verbal Style:\n" +
                    "\n" +
                    "- Direct and uncompromising\n" +
                    "- No corporate speak\n" +
                    "- Emotional storytelling\n" +
                    "- Power words: \"revolutionary,\" \"incredible,\" \"magical\"\n" +
                    "- Dramatic pauses and timing\n" +
                    "\n" +
                    "Visual Style:\n" +
                    "\n" +
                    "- Black backgrounds\n" +
                    "- High contrast\n" +
                    "- Abundant white space\n" +
                    "- One perfect image > many average ones\n" +
                    "- Consistent personal appearance (black turtleneck)\n" +
                    "\n" +
                    "Core Principles:\n" +
                    "\n" +
                    "- Quality over quantity - each post must be perfect\n" +
                    "- Challenge status quo\n" +
                    "- Paint impossible futures\n" +
                    "- Make people think differently\n" +
                    "- No compromise for engagement\n" +
                    "- Focus on vision, not tactics\n" +
                    "\n" +
                    "Remember: The goal isn't to be likable - it's to be unforgettable. Every piece of content should feel like a keynote moment, even if it's just a LinkedIn post."
            },
            "goals": {
                "type": "string",
                "description": "Your vision, metrics of success, and long-term aspirations for your personal brand. Example:\n" +
                    "My goals with my personal brand:\n" +
                    "\n" +
                    "Vision:\n" +
                    "To inspire a new generation of leaders who understand that the intersection of technology and humanities is where the magic happens.\n" +
                    "\n" +
                    "Metrics of Success:\n" +
                    "\n" +
                    "- Number of people inspired to start companies that merge technology and liberal arts\n" +
                    "- Adoption of human-centered design principles in technology companies\n" +
                    "- Impact on how people think about product development\n" +
                    "- Cultural shift in how technology is perceived and designed\n" +
                    "\n" +
                    "Business Model:\n" +
                    "\n" +
                    "- Speaking engagements about innovation and design\n" +
                    "- Advisory roles for companies wanting to create revolutionary products\n" +
                    "- Building and leading companies that exemplify my philosophy\n" +
                    "- Investment in ventures that align with my vision of technology and humanities\n" +
                    "\n" +
                    "One-Year Goals:\n" +
                    "\n" +
                    "- Establish a strong thought leadership presence around human-centered technology\n" +
                    "- Build a community of innovators who share my vision\n" +
                    "- Create content that challenges conventional thinking about technology and design\n" +
                    "- Influence the next generation of product developers and entrepreneurs\n" +
                    "- Share insights about building products that change the world\n" +
                    "\n" +
                    "Remember: I'm not here to win a popularity contest. I'm here to push the human race forward. If some people don't like my methods or message, that's fine. I'm looking for the ones who want to help change the world."
            }
        },
        "required": ["introduction", "uniqueness", "audience", "value_proposition", "style", "goals"]
    }
}

export async function extractPersonaFromScrapedLinkedinProfile(scraped_profile: string, scraped_posts: string): Promise<any> {
    const anthropic = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"],
        maxRetries: 2,
        timeout: 40000
    });

    const supabase = await createClient()

    // Get the current user
    const {
        data: {user},
        error: userError,
    } = await supabase.auth.getUser();
    if (!scraped_profile || !scraped_posts) {
        const {data, error} = await supabase
            .from('user_personas')
            .select('user_id, scraped_profile, scraped_posts')
            .filter('user_id', 'eq', user?.id)
            .single();

        if (error) {
            console.error('Error fetching scraped linkedin data:', error);
        } else {
            scraped_profile = !scraped_profile ? data.scraped_profile : scraped_profile;
            scraped_posts = !scraped_posts ? data.scraped_posts : scraped_posts;
            console.log('Linkedin Data:', data);
        }
    }

    const systemPrompt = `
You are an AI tasked with analyzing LinkedIn profiles and posts to extract personal branding elements. 
Focus on identifying relevant information that aligns with the predefined fields: introduction, uniqueness, audience, value_proposition, style, and goals. 
Extract only explicitly or implicitly stated information from the profile and posts. Aggregate similar aspects into one input, avoid redundancy, and ensure clarity and conciseness. 

Return the extracted information as a JSON object.
`;

    const prompt = `
Please analyze the following LinkedIn profile and posts to extract the required personal branding inputs:

PROFILE:
'''${scraped_profile ? JSON.stringify(scraped_profile) : 'No profile information'}'''

POSTS:
'''${scraped_posts ? JSON.stringify(scraped_posts) : 'No post information'}'''

Based on the linkedin profile and posts, extract user persona to call the personal_branding_analysis tool with the following attributes:
- 'introduction'
- 'uniqueness'
- 'audience'
- 'value_proposition'
- 'style'
- 'goals'

Focus on actionable and insightful descriptions of the different attributes of the persona. If no information is provided or the information is not sufficient, come up with reasonable attributes.
`;

    try {
        const msg = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            system: systemPrompt,
            tools: [PERSONA_CREATION_PROMPT_OUPUT_TOOL],
            tool_choice: {"type": "tool", "name": "personal_branding_analysis"},
            max_tokens: 1024,
            temperature: 0.5,
            messages: [{role: "user", content: prompt}],
        });

        return (msg.content[0] as any).input;
    } catch (error) {
        console.error("Error extracting knowledge from linkedin Scraper:", error);
        throw error;
    }
}


export async function refinePersonaFromTranscript(transcript: string): Promise<any> {
    const anthropic = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"],
        maxRetries: 2,
        timeout: 40000
    });

    const supabase = await createClient()

    // Get the current user
    const {
        data: {user},
        error: userError,
    } = await supabase.auth.getUser();
    const {data, error} = await supabase
        .from('user_personas')
        .select('user_id, introduction, uniqueness, audience, value_proposition, style, goals')
        .filter('user_id', 'eq', user?.id)
        .single();

    if (error) {
        console.error('Error fetching current persona for refinement:', error);
    } else {
        console.log('Current persona:', data);
    }


const systemPrompt = `
You are an AI tasked to refine personal branding elements based on an interview transcript. 
Only refine if you have information that could improve or correct existing personal branding elements.
Return the new branding elements as a JSON object.
`;

const prompt = `
Please analyze the following conversation transcript to refine the existing personal branding elements:

TRANSCRIPT:
'''${transcript}'''

EXISTING PERSONA:
'''${data ? JSON.stringify(data) : 'No existing persona information'}'''

Based on the transcript refine the existing persona to call the personal_branding_analysis tool with the following attributes:
- 'introduction'
- 'uniqueness'
- 'audience'
- 'value_proposition'
- 'style'
- 'goals'

Focus on actionable and insightful descriptions of the different attributes of the persona.
`;

try {
    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        system: systemPrompt,
        tools: [PERSONA_CREATION_PROMPT_OUPUT_TOOL],
        tool_choice: {"type": "tool", "name": "personal_branding_analysis"},
        max_tokens: 1024,
        temperature: 0.5,
        messages: [{role: "user", content: prompt}],
    });

    return (msg.content[0] as any).input;
} catch (error) {
    console.error("Error extracting knowledge from linkedin Scraper:", error);
    throw error;
}
}