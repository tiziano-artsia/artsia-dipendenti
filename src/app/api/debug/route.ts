import {NextResponse} from "next/server";
import mongoose from "mongoose";

export async function GET() {
    return NextResponse.json({
        timestamp: new Date().toISOString(),
        env: {
            MONGODB_URI: !!process.env.MONGODB_URI,
            JWT_SECRET: !!process.env.JWT_SECRET
        },
        mongoose: mongoose.connection.readyState
    });
}

