import {NextRequest, NextResponse} from 'next/server';
import { extractProfileData } from "@/lib/apify/extractProfileData";
import {createClient} from "@/utils/supabase/server";

export const maxDuration = 60;
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    try {
        const { linkedinProfile } = await req.json();

        if (!linkedinProfile) {
            return NextResponse.json({ error: 'LinkedIn profile URL is required' }, { status: 400 });
        }

        const profileData = await extractProfileData(linkedinProfile);

        if (!profileData) {
            return NextResponse.json({ error: 'Failed to scrape LinkedIn profile data' }, { status: 500 });
        }

        // Get the current user
        const {
            data: {user},
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            throw new Error(`Failed to retrieve user: ${userError.message}`);
        }

        if (!user) {
            return NextResponse.json({error: 'User not authenticated'}, {status: 401});
        }

        // Upsert scraped profile data into the user_personas table
        const {error: upsertError} = await supabase
            .from('user_personas')
            .upsert({
                user_id: user.id,
                scraped_profile: profileData,
            }, {
                onConflict: 'user_id',
            }).filter('user_id', 'eq', user.id);

        if (upsertError) {
            throw new Error(`Failed to upsert profile data: ${upsertError.message}`);
        }

        return NextResponse.json({ profileData }, { status: 200 });
    } catch (error: any) {
        console.error('Error in scrape-profile API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}