import { NextRequest, NextResponse } from "next/server";
import { EmployeeModel, connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        // ✅ Verifica autenticazione JWT
        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
        }

        const { pushToken } = await req.json();

        if (!pushToken) {
            return NextResponse.json({ error: "Token mancante" }, { status: 400 });
        }

        await connectDB();

        // Salva push token
        await EmployeeModel.updateOne(
            { id: user.id },
            {
                $set: {
                    pushToken,
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Push token salvato per user ${user.id}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("❌ Errore salvataggio push token:", error);
        return NextResponse.json({ error: "Errore server" }, { status: 500 });
    }
}
