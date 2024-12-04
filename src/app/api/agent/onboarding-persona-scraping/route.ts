import {NextRequest, NextResponse} from 'next/server';
import {extractProfileData} from "@/lib/apify/extractProfileData";
import {createClient} from "@/utils/supabase/server";
import {extractPostData} from "@/lib/apify/extractPostData";
import {extractPersonaFromScrapedLinkedinProfile} from "@/lib/anthropic";
import {createOnboardingAgent} from "@/services/agent";


export async function POST(req: NextRequest) {
    const supabase = await createClient();
    try {
        const {linkedinProfile} = await req.json();

        if (!linkedinProfile) {
            return NextResponse.json({error: 'LinkedIn profile URL is required'}, {status: 400});
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
        console.log('Start time: ', new Date().toISOString());
        const postData = await extractPostData(linkedinProfile);
        if (!postData) {
            return NextResponse.json({error: 'Failed to scrape LinkedIn post data'}, {status: 500});
        }

        // Extract profile data
        const profileData = await extractProfileData(linkedinProfile);
        if (!profileData) {
            return NextResponse.json({error: 'Failed to scrape LinkedIn profile data'}, {status: 500});
        }

        const persona = await extractPersonaFromScrapedLinkedinProfile(JSON.stringify(profileData), JSON.stringify(postData))

        // Upsert scraped profile data into the user_personas table
        const {error: upsertError} = await supabase
            .from('user_personas')
            .upsert({
                user_id: user.id,
                introduction: persona?.introduction,
                uniqueness: persona?.uniqueness,
                audience: persona?.audience,
                value_proposition: persona?.value_proposition,
                style: persona?.style,
                goals: persona?.goals,
                scraped_profile: profileData,
                scraped_posts: postData,
            }, {
                onConflict: 'user_id',
            });

        if (upsertError) {
            throw new Error(`Failed to upsert profile data: ${upsertError.message}`);
        }

        await createOnboardingAgent({
            user_id: user.id,
            prompt_personalization: persona ? JSON.stringify(persona) : "",
        })
        console.log('End time: ', new Date().toISOString());


        return NextResponse.json({message: 'Profile data saved successfully'}, {status: 200});
    } catch (error: any) {
        console.error('Error in scrapeProfile API:', error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}