import { NextRequest, NextResponse } from "next/server";
import { connectDB, EmployeeModel } from "@/lib/db";






export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await connectDB();

    const employee = await EmployeeModel.findOne({ id: Number(id) }).lean();
    if (!employee) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

    return NextResponse.json({
        success: true,
        fullRemote: employee.fullRemote === true || (employee.fullRemote as any) === "true"
    });
}




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

