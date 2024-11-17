'use client'

import Image from 'next/image';
import { Button } from "@/components/ui/button";


export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center mt-8">
        <Image src="/appIcon.png" alt="Logo" width={200} height={200} />
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <a href="/search">
              Search for Clips
            </a>
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
