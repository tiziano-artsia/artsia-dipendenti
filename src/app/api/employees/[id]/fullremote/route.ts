import { NextRequest, NextResponse } from "next/server";
import { connectDB, EmployeeModel } from "@/lib/db";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const { fullRemote } = await req.json();
    await connectDB();

    await EmployeeModel.updateOne(
        { id: Number(id) },
        { $set: { fullRemote: Boolean(fullRemote) } }
    );

    return NextResponse.json({ success: true });
}
