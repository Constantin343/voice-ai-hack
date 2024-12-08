import axios from 'axios';

interface CovalTranscriptMessage {
  role: 'user' | 'agent';
  content: string;
}

interface CovalTranscriptPayload {
  transcript: CovalTranscriptMessage[];
  metrics?: Record<string, any>;
  metadata?: {
    agent_id?: string;
  };
  simulators?: Record<string, any>;
}

export async function pushTranscriptToCoval(transcript: string, agentId?: string): Promise<void> {
  const apiKey = process.env.COVAL_API_KEY;
  if (!apiKey) {
    throw new Error('COVAL_API_KEY is not set');
  }

  // Parse the transcript into the required format
  const messages: CovalTranscriptMessage[] = transcript
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [role, ...contentParts] = line.split(':');
      const content = contentParts.join(':').trim();
      return {
        role: role.toLowerCase().includes('user') ? 'user' : 'agent',
        content
      };
    });

  const payload: CovalTranscriptPayload = {
    transcript: messages,
    metadata: agentId ? { agent_id: agentId } : undefined
  };

  try {
    await axios.post('https://api.coval.dev/eval/transcript', payload, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log('Successfully pushed transcript to Coval');
  } catch (error) {
    console.error('Error pushing transcript to Coval:', error);
    // Don't throw the error to avoid breaking the main flow
  }
} 