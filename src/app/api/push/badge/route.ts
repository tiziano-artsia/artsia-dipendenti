import { NextRequest, NextResponse } from "next/server";
import { EmployeeModel, connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";

// GET badge count
export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
        }

        await connectDB();

        const employee = await EmployeeModel.findOne(
            { id: user.id },
            { badgeCount: 1 }
        ).lean();

        return NextResponse.json({
            badgeCount: employee?.badgeCount || 0
        });

    } catch (error) {
        console.error("❌ Errore get badge:", error);
        return NextResponse.json({ error: "Errore server" }, { status: 500 });
    }
}

// POST - Set badge count
export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
        }

        const { count } = await req.json();

        await connectDB();

        await EmployeeModel.updateOne(
            { id: user.id },
            {
                $set: {
                    badgeCount: Math.max(0, count || 0),
                    updatedAt: new Date()
                }
            }
        );

        console.log(`🔢 Badge aggiornato a ${count} per user ${user.id}`);

        return NextResponse.json({ success: true, count });

    } catch (error) {
        console.error("❌ Errore set badge:", error);
        return NextResponse.json({ error: "Errore server" }, { status: 500 });
    }
}
