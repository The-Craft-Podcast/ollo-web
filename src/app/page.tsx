'use client'

import Image from 'next/image';
import { Button } from "@/components/ui/button";


export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center mt-8">
        <Image src="/appIconGif.gif" alt="Logo" width={400} height={400} />
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button asChild>
            <a href="/search">
              Search Clips
            </a>
          </Button>
          <Button asChild>
            <a href="/podcast-shows">
              Search Shows
            </a>
          </Button>
          <Button asChild>
            <a href="/render-video">
              Generate Video
          </Button>
          <Button asChild>
            <a href="/transcribe">
              Transcribe Audio
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
