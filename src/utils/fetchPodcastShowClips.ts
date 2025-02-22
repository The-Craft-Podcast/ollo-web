import { Digest } from '@/types/digest';

export async function fetchPodcastShowClips(
    query: string,
    page: number,
    pageSize: number = 15
): Promise<{
    results: Digest[],
    hasMore: boolean,
    total: number
}> {
    const response = await fetch(
        `/api/podcast-shows/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
    )
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
}
