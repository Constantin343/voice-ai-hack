import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const clientId = process.env.LINKEDIN_CLIENT_ID as string;

    // Base callback URL
    const baseCallbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/linkedin/callback`;

    // Create a URL object for the base callback URL
    const callbackUrl = new URL(baseCallbackUrl);

    // Get the original query parameters from the incoming request
    const originalQueryParams = request.nextUrl.searchParams;

    // Append each query parameter to the callback URL
    originalQueryParams.forEach((value, key) => {
        callbackUrl.searchParams.append(key, value);
    });

    // Encode the full callback URL
    const redirectUri = encodeURIComponent(callbackUrl.toString());

    const state = 'random_string'; // Replace with a secure random string
    const scope = encodeURIComponent('liteprofile emailaddress w_member_social');

    const authorizationUrl = `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&state=${state}` +
        `&scope=${scope}`;

    return NextResponse.redirect(authorizationUrl);
}