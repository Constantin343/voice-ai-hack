import { ApifyClient } from 'apify-client';

type Reaction = {
    type: string;
    occupationSummary: string;
};

type Comment = {
    text: string;
    authorSummary: string;
};

type PostData = {
    url: string;
    text: string;
    timeSincePosted: string;
    author: string;
    reactionsSummary: Reaction[];
    commentsSummary: Comment[];
};

const client = new ApifyClient({
    token: process.env.APIFY_API_KEY,
});

export async function extractPostData(postUrls: string[]): Promise<PostData[] | null> {
    const cookie = require('./cookie.json').cookie;

    try {
        const input = {
            urls: [postUrls],
            cookie,
            deepScrape: true,
            rawData: false,
            minDelay: 2,
            maxDelay: 4,
            proxy: {
                useApifyProxy: true,
                apifyProxyCountry: 'US',
            },
        };
        const ACTOR_ID = process.env.APIFY_POSTS_EXTRACTOR_ACTOR_ID!;

        // Run the Actor and wait for it to finish
        const run = await client.actor(ACTOR_ID).call(input);

        // Fetch the results from the dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        if (items.length === 0) {
            console.warn('No data returned from the scraper');
            return null;
        }

        // Transform the data
        return transformScrapedPostData(items);
    } catch (error) {
        console.error('Error extracting post data:', error);
        return null;
    }
}

function transformScrapedPostData(data: any[]): PostData[] {
    return data.map((post) => ({
        url: post.url,
        text: post.text || '',
        timeSincePosted: post.timeSincePosted || '',
        author: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim(),
        reactionsSummary: summarizeReactions(post.reactions || []),
        commentsSummary: summarizeComments(post.comments || []),
    }));
}

function summarizeReactions(reactions: any[]): Reaction[] {
    return reactions.slice(0, 5).map((reaction) => ({
        type: reaction.type,
        occupationSummary: reaction.profile?.occupation || 'Unknown occupation',
    }));
}

function summarizeComments(comments: any[]): Comment[] {
    return comments.slice(0, 5).map((comment) => ({
        text: comment.text || '',
        authorSummary: `${comment.author?.firstName || ''} ${comment.author?.lastName || ''}`.trim() +
            (comment.author?.occupation ? `, ${comment.author.occupation}` : ''),
    }));
}