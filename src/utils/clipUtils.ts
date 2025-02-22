// This function fetches clips from the firestore database

import { db } from './firebase-admin';
import { Digest } from '@/types/digest';

export async function fetchClipsFromFirestore(clipIds: string[]): Promise<Digest[]> {
    console.log('fetchClipsFromFirestore: Starting with clipIds:', clipIds);
    try {
        const clipsRef = db.collection('clips_dev_0612');
        console.log('fetchClipsFromFirestore: Created Firestore reference');

        const clipPromises = clipIds.map(async (id) => {
            console.log(`fetchClipsFromFirestore: Fetching document with ID: ${id}`);
            const doc = await clipsRef.doc(id).get();
            console.log(`fetchClipsFromFirestore: Fetched document for ID ${id}, exists: ${doc.exists}`);
            return doc;
        });

        console.log('fetchClipsFromFirestore: Waiting for all document fetch promises');
        const clipDocs = await Promise.all(clipPromises);
        console.log('fetchClipsFromFirestore: All documents fetched');

        const clips = clipDocs
            .filter(doc => doc.exists)
            .map(doc => {
                const data = doc.data();
                console.log(`fetchClipsFromFirestore: Processing document ${doc.id}, data:`, data);
                return {
                    clipId: doc.id,
                    clipSummary: data?.clipSummary,
                    clipTitle: data?.clipTitle,
                    clipTranscript: data?.clipTranscript,
                    episodeAudioGsUrl: data?.episodeAudioGsUrl,
                    episodeId: data?.episodeId,
                    episodeTitle: data?.episodeTitle,
                    episodeStartIndex: data?.episodeStartIndex,
                    firebaseAudioStoragePath: data?.firebaseAudioStoragePath,
                    firebaseAudioTokenUrl: data?.firebaseAudioTokenUrl,
                    indexed: data?.indexed,
                    podcastShowThumbnailColors: data?.podcastShowThumbnailColors,
                    podcastShowThumbnailFirebaseUrl: data?.podcastShowThumbnailFirebaseUrl,
                    podcastShowTitle: data?.podcastShowTitle,
                    podcastShowId: data?.podcastShowId,
                    indexed_timestamp: data?.productionDetails?.clipProductionDetails?.clipping_timestamp?.toDate?.()?.toISOString(),
                };
            });

        console.log('fetchClipsFromFirestore: Processed clips:', clips);
        return clips;
    } catch (error) {
        console.error('Error in fetchClipsFromFirestore:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
}

// Get a single clip by ID
export async function getClipById(clipId: string): Promise<Digest | null> {
    console.log('getClipById: Fetching clip with ID:', clipId);
    const clips = await fetchClipsFromFirestore([clipId]);
    console.log('getClipById: Fetched clips:', clips);
    return clips.length > 0 ? clips[0] : null;
}