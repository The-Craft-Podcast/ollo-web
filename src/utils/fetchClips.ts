// This function fetches clips from the server

import { Digest } from '../types/digest';

export const fetchClips = async (inputText: string, top_k: string = "10", alpha: string = "0.2"): Promise<Digest[]> => {
    const apiUrl = "/api/search";
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: inputText, top_k, alpha })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const clips: Digest[] = await response.json();
            if (!Array.isArray(clips)) {
                throw new Error('Invalid response format');
            }

            // Sort clips by indexed_timestamp in descending order
            // Note: Clips without timestamp will be placed at the end
            return clips.sort((a, b) => {
                if (!a.indexed_timestamp) return 1;
                if (!b.indexed_timestamp) return -1;
                return new Date(b.indexed_timestamp).getTime() - new Date(a.indexed_timestamp).getTime();
            });
        } catch (error) {
            retries++;
            if (retries === maxRetries) {
                console.error('Failed to get clips after retries:', error);
                throw error;
            }
        }
    }

    return [];
};