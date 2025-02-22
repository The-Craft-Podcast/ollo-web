'use client'

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Digest } from "@/types/digest"
import { fetchPodcastShowClips } from "@/utils/fetchPodcastShowClips"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveAs } from 'file-saver'

const PAGE_SIZE = 15;

export function PodcastShowSearchComponent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialQuery = searchParams?.get('q') || ""

    const [searchTerm, setSearchTerm] = useState(initialQuery)
    const [results, setResults] = useState<Digest[]>([])
    const [hasMore, setHasMore] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [currentlyPlaying, setCurrentlyPlaying] = useState<Digest | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentPlaybackPosition, setCurrentPlaybackPosition] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [searchStatus, setSearchStatus] = useState<'idle' | 'not_found' | 'loading' | 'error' | 'success'>('idle')
    const [isPaginating, setIsPaginating] = useState(false)
    const [lastSearchedTerm, setLastSearchedTerm] = useState(initialQuery)

    // Initialize audio element
    useEffect(() => {
        const audio = typeof window !== 'undefined' ? new Audio() : null
        setAudioElement(audio)
    }, [])

    // Set up audio event listeners
    useEffect(() => {
        if (!audioElement) return

        const handleEnded = () => setIsPlaying(false)
        audioElement.addEventListener('ended', handleEnded)

        return () => {
            audioElement.removeEventListener('ended', handleEnded)
        }
    }, [audioElement])

    useEffect(() => {
        if (audioElement) {
            const updateProgress = () => {
                setCurrentPlaybackPosition(audioElement.currentTime)
            }

            const handleEnded = () => {
                setIsPlaying(false)
                setCurrentPlaybackPosition(0)
            }

            audioElement.addEventListener('timeupdate', updateProgress)
            audioElement.addEventListener('loadedmetadata', () => {
                setDuration(audioElement.duration)
            })
            audioElement.addEventListener('ended', handleEnded)

            return () => {
                audioElement.removeEventListener('timeupdate', updateProgress)
                audioElement.removeEventListener('loadedmetadata', () => { })
                audioElement.removeEventListener('ended', handleEnded)
            }
        }
    }, [audioElement])

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchTerm.trim()) return

        setIsLoading(true)
        setError(null)
        setCurrentPage(1)
        setHasSearched(true)
        setSearchStatus('loading')
        setResults([])
        setLastSearchedTerm(searchTerm)

        try {
            const newParams = new URLSearchParams(searchParams?.toString())
            newParams.set('q', searchTerm)
            router.push(`/podcast-shows?${newParams.toString()}`)

            const response = await fetchPodcastShowClips(searchTerm, 1, PAGE_SIZE)
            setResults(response.results)
            setHasMore(response.hasMore)
            setTotalResults(response.total)
            setSearchStatus(response.results.length > 0 ? 'success' : 'not_found')
        } catch (err) {
            console.error('Search error:', err)
            setError(err instanceof Error ? `Error: ${err.message}` : 'An unexpected error occurred')
            setSearchStatus('error')
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm, router, searchParams])

    // Initial search if query is in URL
    useEffect(() => {
        if (initialQuery && !results.length) {
            const syntheticEvent = { preventDefault: () => { } } as React.FormEvent
            setHasSearched(true)
            setLastSearchedTerm(initialQuery)
            handleSearch(syntheticEvent)
        }
    }, [initialQuery, handleSearch, results.length])

    // Group results by episode
    const groupedResults = results.reduce((groups, clip) => {
        const episodeId = clip.episodeId
        if (!groups[episodeId]) {
            groups[episodeId] = {
                episodeTitle: clip.episodeTitle,
                podcastShowTitle: clip.podcastShowTitle,
                podcastShowThumbnailFirebaseUrl: clip.podcastShowThumbnailFirebaseUrl,
                clips: []
            }
        }
        groups[episodeId].clips.push(clip)
        return groups
    }, {} as Record<string, {
        episodeTitle: string,
        podcastShowTitle: string,
        podcastShowThumbnailFirebaseUrl: string | undefined,
        clips: Digest[]
    }>)

    const handlePlay = (clip: Digest) => {
        if (audioElement) {
            if (currentlyPlaying?.clipId !== clip.clipId) {
                audioElement.src = clip.firebaseAudioTokenUrl
                audioElement.load()
            }
            audioElement.play()
            setCurrentlyPlaying(clip)
            setIsPlaying(true)
        }
    }

    const handlePause = () => {
        if (audioElement) {
            audioElement.pause()
            setIsPlaying(false)
        }
    }

    const togglePlayPause = () => {
        if (audioElement) {
            if (isPlaying) {
                handlePause()
            } else {
                audioElement.play()
                setIsPlaying(true)
            }
        }
    }

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPosition = Number(e.target.value)
        setCurrentPlaybackPosition(newPosition)
        if (audioElement) {
            audioElement.currentTime = newPosition
        }
    }

    const handleDownload = async () => {
        if (currentlyPlaying) {
            try {
                const response = await fetch(`/api/download?url=${encodeURIComponent(currentlyPlaying.firebaseAudioTokenUrl)}`);
                if (!response.ok) throw new Error('Download failed');
                const blob = await response.blob();
                const fileName = `${currentlyPlaying.clipTitle}.mp3`;
                saveAs(blob, fileName);
            } catch (error) {
                console.error('Download error:', error);
                setError('Failed to download the audio file.');
            }
        }
    }

    const loadMore = async () => {
        if (isLoadingMore) return

        setIsLoadingMore(true)
        setIsPaginating(true)
        try {
            console.log(`Loading page ${currentPage + 1}...`)
            const response = await fetchPodcastShowClips(searchTerm, currentPage + 1, PAGE_SIZE)
            setResults(prevResults => [...prevResults, ...response.results])
            setHasMore(response.hasMore)
            setCurrentPage(prev => prev + 1)
        } catch (err) {
            console.error('Error loading more results:', err)
            setError(err instanceof Error ? `Error: ${err.message}` : 'An unexpected error occurred')
        } finally {
            setIsLoadingMore(false)
            setIsPaginating(false)
        }
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-4 pb-28">
            <h1 className="text-3xl font-bold mb-2">Search Podcasts</h1>
            <p className="text-lg text-muted-foreground mb-6">Find our most recent clips from your favorite podcasts.</p>
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                    <Input
                        type="search"
                        placeholder="Search podcast shows..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow rounded-md px-4 py-2 bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Returns clips from the last 30 days
                </p>
            </form>

            <div className="my-4">
                {searchStatus === 'loading' && !isPaginating && (
                    <div className="text-center py-4 text-primary">
                        Searching for &quot;{lastSearchedTerm}&quot;...
                    </div>
                )}

                {searchStatus === 'not_found' && hasSearched && (
                    <div className="text-center py-4 text-muted-foreground">
                        No podcast shows found matching &quot;{lastSearchedTerm}&quot;. Please try a different search term.
                    </div>
                )}

                {searchStatus === 'error' && (
                    <div className="text-center py-4 text-destructive">
                        {error?.includes('404')
                            ? `The podcast show "${lastSearchedTerm}" could not be found.`
                            : error || 'An unexpected error occurred while searching. Please try again.'}
                    </div>
                )}

                {searchStatus === 'success' && (
                    <div className="mb-4 text-sm text-muted-foreground">
                        {`Found ${totalResults} matches for "${lastSearchedTerm}". Showing ${results.length} of ${totalResults} results.`}
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {searchStatus === 'success' && Object.entries(groupedResults).map(([episodeId, group]) => (
                    <div key={episodeId} className="bg-card rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            {group.podcastShowThumbnailFirebaseUrl && (
                                <div className="relative w-16 h-16">
                                    <Image
                                        src={group.podcastShowThumbnailFirebaseUrl}
                                        alt={group.podcastShowTitle}
                                        fill
                                        className="rounded-md object-cover"
                                    />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold">{group.podcastShowTitle}</h3>
                                <p className="text-sm text-muted-foreground">{group.episodeTitle}</p>
                            </div>
                        </div>
                        <div className="space-y-4 ml-20">
                            {group.clips.map((clip) => (
                                <div key={clip.clipId} className="border-l-2 border-muted pl-4">
                                    <Link
                                        href={`/clip/${clip.clipId}`}
                                        className="block text-primary hover:underline"
                                    >
                                        {clip.clipTitle}
                                    </Link>
                                    {clip.clipSummary && (
                                        <p className="mt-2 text-sm text-muted-foreground">{clip.clipSummary}</p>
                                    )}
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {clip.indexed_timestamp && (
                                            <span>Transcribed {formatDistanceToNow(new Date(clip.indexed_timestamp), { addSuffix: true })}</span>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => currentlyPlaying?.clipId === clip.clipId ? togglePlayPause() : handlePlay(clip)}
                                        >
                                            {currentlyPlaying?.clipId === clip.clipId && isPlaying ? 'Pause' : 'Play'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {currentlyPlaying && (
                <div className="fixed bottom-0 left-0 w-full bg-muted p-4 flex items-center justify-between z-50">
                    <div className="flex items-center gap-4">
                        {currentlyPlaying.podcastShowThumbnailFirebaseUrl && (
                            <Image
                                src={currentlyPlaying.podcastShowThumbnailFirebaseUrl}
                                alt={currentlyPlaying.clipTitle}
                                width={50}
                                height={50}
                                className="rounded-lg object-cover"
                                style={{ aspectRatio: "50/50", objectFit: "cover" }}
                            />
                        )}
                        <div>
                            <h4 className="text-lg font-semibold">
                                <Link href={`/clip/${currentlyPlaying.clipId}`} className="hover:underline">
                                    {currentlyPlaying.clipTitle}
                                </Link>
                            </h4>
                            <p className="text-sm text-muted-foreground">{currentlyPlaying.podcastShowTitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-1 max-w-2xl ml-4">
                        <Button variant="ghost" size="icon" onClick={togglePlayPause}>
                            {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleDownload}>
                            <DownloadIcon className="w-5 h-5" />
                        </Button>
                        <div className="w-full">
                            <input
                                type="range"
                                min={0}
                                max={duration}
                                value={currentPlaybackPosition}
                                onChange={handleProgressChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {hasMore && searchStatus === 'success' && (
                <div className="mt-8 text-center">
                    <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="w-full max-w-xs"
                    >
                        {isLoadingMore ? 'Loading more results...' : `Load More (${results.length} of ${totalResults})`}
                    </Button>
                </div>
            )}
        </div>
    )
}

function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
        </svg>
    )
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    )
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    )
}
