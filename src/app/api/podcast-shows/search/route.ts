import { NextRequest, NextResponse } from 'next/server';
import { FirebaseError } from 'firebase/app';
import { fetchClipsFromFirestore } from '@/utils/clipUtils';
import { db } from '@/utils/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');

        if (!query) {
            console.log('Search request missing query parameter');
            return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
        }

        // Query the podcast_shows_index collection for matching show titles
        const showsRef = db.collection('podcast_shows_index');
        const showsSnapshot = await showsRef
            .where('title', '>=', query)
            .where('title', '<=', query + '\uf8ff')
            .get();

        if (showsSnapshot.empty) {
            return NextResponse.json({
                error: 'No podcast shows found matching your search',
                results: []
            }, { status: 404 });
        }

        // Get all episode subcollections and their clips
        const clipIds: string[] = [];

        for (const showDoc of showsSnapshot.docs) {
            const episodesRef = showDoc.ref.collection('episodes');
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const episodesSnapshot = await episodesRef
                .where('processed_time', '>=', oneMonthAgo.toISOString())
                .get();

            for (const episodeDoc of episodesSnapshot.docs) {
                const episodeData = episodeDoc.data();
                if (episodeData.clips && Array.isArray(episodeData.clips)) {
                    clipIds.push(...episodeData.clips);
                }
            }
        }

        if (clipIds.length === 0) {
            return NextResponse.json({
                results: [],
                hasMore: false,
                total: 0
            });
        }

        // Fetch the actual clip data
        const clips = await fetchClipsFromFirestore(clipIds);

        // Sort by indexed_timestamp
        const sortedClips = clips
            .sort((a, b) => {
                if (!a.indexed_timestamp) return 1;
                if (!b.indexed_timestamp) return -1;
                return new Date(b.indexed_timestamp).getTime() - new Date(a.indexed_timestamp).getTime();
            });

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedClips = sortedClips.slice(startIndex, endIndex);
        const hasMore = sortedClips.length > endIndex;

        console.log(`Found ${sortedClips.length} total clips, returning ${paginatedClips.length} for page ${page}`);

        return NextResponse.json({
            results: paginatedClips,
            hasMore,
            total: sortedClips.length
        });

    } catch (error) {
        console.error('Error in podcast show search API:', error);

        if (error instanceof FirebaseError) {
            return NextResponse.json({ error: 'Firestore query failed.' }, { status: 500 });
        } else {
            return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
        }
    }
}
