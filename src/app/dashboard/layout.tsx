import Header from '@/components/Header';
export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <main className="flex-1 min-h-screen bg-gray-50 p-6 lg:p-12">
                {children}
            </main>
        </>
    );
}
