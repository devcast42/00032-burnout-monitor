import DoctorNavigation from "@/components/DoctorNavigation";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-950 pb-20">
            {children}
            <DoctorNavigation />
        </div>
    );
}
