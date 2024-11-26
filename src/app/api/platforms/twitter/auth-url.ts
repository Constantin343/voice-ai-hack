import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID as string,
    clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
            process.env.TWITTER_REDIRECT_URI as string,
            { scope: ["tweet.read", "tweet.write", "users.read", "offline.access"] }
        );

        // Save the codeVerifier and state in a session or database for verification later
        res.status(200).json({ url, codeVerifier, state });
    } catch (error) {
        console.error("Error generating Twitter auth URL:", error);
        res.status(500).json({ message: "Error generating Twitter auth URL" });
    }
}