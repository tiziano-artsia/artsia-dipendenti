import { NextRequest, NextResponse } from 'next/server';
import { connectDB, AbsenceModel } from '@/lib/db';

export async function GET(req: NextRequest) {
    console.log('🔍 API hit');

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    try {
        await connectDB();

        if (date) {
            const count = await AbsenceModel.countDocuments({
                type: 'smartworking',
                status: 'approved',
                dataInizio: date
            });

            return NextResponse.json({ success: true, date, count });
        }

        if (year && month) {
            const monthStr = month.toString().padStart(2, '0');

            const counts = await AbsenceModel.aggregate([
                {
                    $match: {
                        type: 'smartworking',
                        status: 'approved',
                        dataInizio: { $regex: `^${year}-${monthStr}`, $options: 'i' }
                    }
                },
                { $group: { _id: '$dataInizio', count: { $sum: 1 } } }
            ]);

            const countsMap = counts.reduce((acc: any, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {});

            return NextResponse.json({
                success: true,
                year,
                month,
                counts: countsMap
            });
        }

        return NextResponse.json(
            { error: 'date OR (year+month) required' },
            { status: 400 }
        );

    } catch (error) {
        console.error('❌ Smart count:', error);

        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}