import { ApifyClient } from 'apify-client';

type DateRange = {
    year?: number;
    month?: number;
};

type Position = {
    title?: string;
    description?: string;
    company?: string;
    startDate?: DateRange;
    endDate?: DateRange;
};

type Certification = {
    name?: string;
    authority?: string;
    startDate?: DateRange;
};

type Language = {
    name?: string;
    proficiency?: string;
};

type Education = {
    degree?: string;
    fieldOfStudy?: string;
    school?: string;
    startDate?: DateRange;
    endDate?: DateRange;
};

type Honor = {
    title?: string;
    description?: string;
    issueDate?: DateRange;
};

type PersonProfile = {
    name?: string;
    headline?: string;
    currentJob?: string;
    currentCompany?: string;
    skills?: string[];
    positions?: Position[];
    certifications?: Certification[];
    languages?: Language[];
    education?: Education[];
    honors?: Honor[];
};

const client = new ApifyClient({
    token: process.env.APIFY_API_KEY,
});

export async function extractProfileData(linkedinProfileUrl: string): Promise<PersonProfile | null> {
    try {
        const cookie = require('./cookie.json').cookie;
        const input = {
            urls: [linkedinProfileUrl],
            cookie,
            minDelay: 15,
            maxDelay: 60,
            proxy: {
                useApifyProxy: true,
                apifyProxyCountry: "US",
            },
            findContacts: false,
        };
        const ACTOR_ID = process.env.APIFY_PROFILE_EXTRACTOR_ACTOR_ID!
        // Run the Actor and wait for it to finish
        const run = await client.actor(ACTOR_ID).call(input);

        // Fetch the results from the dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        if (items.length === 0) {
            console.warn('No data returned from the scraper');
            return null;
        }

        // Extract and transform the data
        const profileData = extractLLMContextFromScrapedProfile(items);

        // Return the first person's profile (assuming one profile per URL)
        return profileData[0] || null;
    } catch (error) {
        console.error("Error extracting profile data:", error);
        return null;
    }
}

// Reuse the function provided to extract and transform the scraped data
function extractLLMContextFromScrapedProfile(data: any[]): PersonProfile[] {
    return data.map((person) => ({
        name: `${person.firstName || ""} ${person.lastName || ""}`.trim(),
        headline: person.headline,
        currentJob: person.jobTitle || person.positions?.[0]?.title || "Not available",
        currentCompany: person.companyName || person.positions?.[0]?.companyName || "Not available",
        skills: person.skills || [],
        positions: person.positions?.map((position: any) => ({
            title: position.title,
            description: position.description,
            company: position.companyName,
            startDate: position.timePeriod?.startDate || {},
            endDate: position.timePeriod?.endDate || {},
        })) || [],
        certifications: person.certifications?.map((cert: any) => ({
            name: cert.name,
            authority: cert.authority,
            startDate: cert.timePeriod?.startDate || {},
        })) || [],
        languages: person.languages?.map((lang: any) => ({
            name: lang.name,
            proficiency: lang.proficiency,
        })) || [],
        education: person.educations?.map((edu: any) => ({
            degree: edu.degreeName,
            fieldOfStudy: edu.fieldOfStudy || "Not specified",
            school: edu.schoolName,
            startDate: edu.timePeriod?.startDate || {},
            endDate: edu.timePeriod?.endDate || {},
        })) || [],
        honors: person.honors?.map((honor: any) => ({
            title: honor.title,
            description: honor.description || "No description",
            issueDate: honor.issueDate || {},
        })) || [],
    }));
}