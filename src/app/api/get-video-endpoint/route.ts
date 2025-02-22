import { NextResponse } from 'next/server';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import '../../../utils/firebase-admin'; // Initialize Firebase Admin

const CLOUD_RUN_URL = 'https://video-generator-58271045053.us-central1.run.app';

export async function GET() {
    try {
        // Get Firebase Admin instance
        const app = getApp();
        const auth = getAuth(app);

        // Generate a custom token
        const token = await auth.createCustomToken('video-service');

        // Return the authenticated URL
        return NextResponse.json({ 
            url: `${CLOUD_RUN_URL}?token=${token}`,
            success: true 
        });
    } catch (error: Error | unknown) {
        console.error('Error generating video endpoint:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { error: errorMessage, success: false },
            { status: 500 }
        );
    }
}
