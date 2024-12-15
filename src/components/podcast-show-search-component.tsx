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

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchTerm.trim()) return

        setIsLoading(true)
        setError(null)
        try {
            // Update URL with search query
            const newParams = new URLSearchParams(searchParams?.toString())
            newParams.set('q', searchTerm)
            router.push(`/podcast-shows?${newParams.toString()}`)
            
            const response = await fetchPodcastShowClips(searchTerm)
            setResults(response.results)
            setHasMore(response.hasMore)
            setTotalResults(response.total)
        } catch (err) {
            setError(err instanceof Error ? `Error: ${err.message}` : 'An unexpected error occurred')
            console.error('Search error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm, router, searchParams])

    // Initial search if query is in URL
    useEffect(() => {
        if (initialQuery && !results.length) {
            const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
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

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-4 pb-28">
            <h1 className="text-3xl font-bold mb-2">Search Podcasts</h1>
            <p className="text-lg text-muted-foreground mb-6">Find our most recent clips from your favorite podcasts.</p>
            <form onSubmit={handleSearch} className="mb-6">
                <div className="space-y-2">
                    <Input
                        type="search"
                        placeholder="Search podcast shows..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow rounded-md px-4 py-2 bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-sm text-muted-foreground">
                        Returns clips from the last 30 days
                    </p>
                </div>
            </form>

            {isLoading && (
                <div className="text-center py-4">Loading...</div>
            )}

            {error && (
                <div className="text-red-500 py-4">{error}</div>
            )}

            {!isLoading && !error && results.length === 0 && searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                    No podcast shows found matching "{searchTerm}"
                </div>
            )}

            {!isLoading && !error && results.length > 0 && (
                <div className="mb-4 text-sm text-muted-foreground">
                    {results.length === 50 && hasMore 
                        ? `Showing first 50 results of ${totalResults} matches.`
                        : `Found ${totalResults} matching clips`
                    }
                </div>
            )}

            <div className="space-y-8">
                {Object.entries(groupedResults).map(([episodeId, group]) => (
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
        </div>
    )
}
