import { useEffect } from 'react';

export default function HubspotWaitlistForm() {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '//js.hsforms.net/forms/v2.js';
        script.async = true; // Ensures the script loads asynchronously
        document.body.appendChild(script);

        script.onload = () => {
            if ((window as any).hbspt) {
                (window as any).hbspt.forms.create({
                    portalId: '48430806', // Replace with your portalId
                    formId: '5cc69aab-b710-4d3f-88c7-698319420e11', // Replace with your formId
                    target: '#hubspotForm',
                });
            }
        };

        return () => {
            // Cleanup the script on unmount
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div id="hubspotForm" className="hubspotForm px-4"></div>
    );
}