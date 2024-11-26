import OAuth from "oauth-1.0a";
import crypto from "crypto";

async function postToTwitter_helper(
    statusMessage: string,
    imageFile: Blob, // Blob or File object
    apiKey: string,
    apiSecretKey: string,
    accessToken: string,
    accessTokenSecret: string
): Promise<void> {
    const twitterUploadURL = "https://upload.twitter.com/1.1/media/upload.json";
    const twitterPostURL = "https://api.twitter.com/1.1/statuses/update.json";

    const oauth = new OAuth({
        consumer: {key: apiKey, secret: apiSecretKey},
        signature_method: "HMAC-SHA1",
        hash_function(baseString, key) {
            return crypto.createHmac("sha1", key).update(baseString).digest("base64");
        },
    });

    const token = {key: accessToken, secret: accessTokenSecret};

    try {
        // Step 1: Upload the media
        const formData = new FormData();
        formData.append("media", imageFile);

        const mediaResponse = await fetch(twitterUploadURL, {
            method: "POST",
            headers: oauth.toHeader(oauth.authorize({url: twitterUploadURL, method: "POST"}, token)) as any,
            body: formData,
        });

        if (!mediaResponse.ok) {
            throw new Error("Failed to upload media to Twitter");
        }

        const mediaData = await mediaResponse.json();
        const mediaId = mediaData.media_id_string;

        if (!mediaId) {
            throw new Error("Failed to get media ID from Twitter upload response");
        }

        // Step 2: Post the tweet
        const tweetParams = new URLSearchParams({
            status: statusMessage,
            media_ids: mediaId,
        });

        const tweetResponse = await fetch(`${twitterPostURL}?${tweetParams.toString()}`, {
            method: "POST",
            headers: oauth.toHeader(oauth.authorize({url: twitterPostURL, method: "POST"}, token)) as any,
        });

        if (!tweetResponse.ok) {
            throw new Error("Failed to post tweet to Twitter");
        }

        const tweetData = await tweetResponse.json();
        console.log("Tweet posted successfully:", tweetData);
    } catch (error) {
        console.error("Error posting to Twitter:", error);
    }
}

async function postToTwitter() {
    const apiKey = process.env.TWITTER_API_KEY ?? "";
    const apiSecretKey = process.env.TWITTER_API_SECRET_KEY ?? "";
    const accessToken = process.env.TWITTER_ACCESS_TOKEN ?? "";
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET ?? "";

    const statusMessage = "Excited to share this post with an image! #TwitterAPI";
    const imageFile = new Blob([/* Image data */], {type: "image/jpeg"}); // Replace with actual image Blob or File

    postToTwitter_helper(statusMessage, imageFile, apiKey, apiSecretKey, accessToken, accessTokenSecret)
        .then(() => console.log("Tweet successfully posted!"))
        .catch((error) => console.error("Failed to post tweet:", error));
}

export function generateCodeVerifierAndChallenge() {
    const crypto = require('crypto');
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return { codeVerifier, codeChallenge };
}