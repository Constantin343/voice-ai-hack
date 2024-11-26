import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function GET(request: NextRequest) {
    try {
        console.log('Starting GET handler for Twitter callback...');

        // Parse the incoming request URL to extract the 'code' parameter from query string
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        console.log('Authorization code:', code);

        if (!code) {
            console.warn('Missing authorization code in the request.');
            return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        // Retrieve the 'code_verifier' stored in cookies during the initial authorization request
        const codeVerifier = request.cookies.get('code_verifier')?.value;
        console.log('Code verifier retrieved from cookies:', codeVerifier);

        if (!codeVerifier) {
            console.warn('Missing code verifier in the request.');
            return NextResponse.json({ error: 'Missing code verifier' }, { status: 400 });
        }

        // Validate required environment variables to ensure proper server configuration
        const clientId = process.env.TWITTER_CLIENT_ID;
        const clientSecret = process.env.TWITTER_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        console.log('Environment variables:');
        console.log('TWITTER_CLIENT_ID:', clientId);
        console.log('TWITTER_CLIENT_SECRET:', clientSecret ? '*****' : 'undefined'); // Mask sensitive info
        console.log('NEXT_PUBLIC_BASE_URL:', baseUrl);

        if (!clientId || !clientSecret || !baseUrl) {
            console.error('Server configuration error: Missing one or more required environment variables.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Construct the redirect URI used during the initial authorization flow
        const redirectUri = `${baseUrl}/auth/twitter/callback`;
        console.log('Redirect URI:', redirectUri);

        // Initialize the Twitter API client with client credentials
        const client = new TwitterApi({ clientId, clientSecret });
        console.log('Initialized Twitter API client.');

        // Exchange the authorization code for access and refresh tokens
        console.log('Exchanging authorization code for tokens...');
        const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri,
        });
        console.log('Tokens received:');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        console.log('Expires In:', expiresIn);

        // Prepare a response to redirect the user to the home page after successful authentication
        const response = NextResponse.redirect(new URL('/', request.url));
        console.log('Redirecting to home page with tokens set in cookies.');

        // Set the 'accessToken' in a secure HTTP-only cookie for session management
        response.cookies.set('twitter_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: expiresIn, // Set cookie expiration to match the token's lifetime
            path: '/', // Make cookie accessible across the entire domain
        });
        console.log('Set access token in cookies.');

        // Set the 'refreshToken' in a secure HTTP-only cookie for token renewal
        response.cookies.set('twitter_refresh_token', refreshToken || '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2592000, // Set expiration to 30 days
            path: '/',
        });
        console.log('Set refresh token in cookies.');

        // Return the response with cookies and redirect
        return response;
    } catch (error: any) {
        // Log the error details for debugging purposes
        console.error('Error during Twitter callback:', error);

        // Respond with a generic error message and detailed error information for debugging
        return NextResponse.json(
            { error: 'Authentication failed', details: error.message },
            { status: 500 }
        );
    }
}