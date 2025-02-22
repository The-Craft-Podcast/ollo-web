'use client'

import { Suspense } from 'react'
import { PodcastShowSearchComponent } from '@/components/podcast-show-search-component';

export default function PodcastShowSearchPage() {
    return (
        <div className="min-h-screen p-8">
            <main className="max-w-6xl mx-auto">
                <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
                    <PodcastShowSearchComponent />
                </Suspense>
            </main>
        </div>
    );
}
