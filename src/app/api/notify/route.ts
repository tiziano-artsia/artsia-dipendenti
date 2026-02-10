// Esempio in app/api/notify/route.ts
import { EmployeeModel, connectDB } from "@/lib/db";

export async function POST(req: Request) {
    const { employeeId, title, body } = await req.json();

    await connectDB();

    // Trova employee e incrementa badge
    const employee = await EmployeeModel.findOneAndUpdate(
        { id: employeeId },
        {
            $inc: { badgeCount: 1 },
            $set: { updatedAt: new Date() }
        },
        { new: true }
    );

    if (!employee?.pushToken) {
        return Response.json({ error: 'Push token non trovato' }, { status: 404 });
    }

    // Invia notifica con badge
    const payload = {
        to: employee.pushToken,
        notification: {
            title,
            body
        },
        data: {
            type: 'turno',
            employeeId
        },
        // ✅ Badge APNs
        aps: {
            badge: employee.badgeCount
        }
    };

    // Invia tramite servizio push (FCM/APNs)
    // await sendPushNotification(payload);

    return Response.json({ success: true, badge: employee.badgeCount });
}
