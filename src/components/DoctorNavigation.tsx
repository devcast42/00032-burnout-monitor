"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Calendar, User as UserIcon } from "lucide-react";

export default function DoctorNavigation() {
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        { id: "home", label: "Home", icon: Home, path: "/doctor" },
        { id: "appointments", label: "Pacientes", icon: Calendar, path: "/doctor/appointments" },
        { id: "profile", label: "Perfil", icon: UserIcon, path: "/doctor/profile" },
    ];

    const getActiveTab = () => {
        if (pathname === "/doctor") return "home";
        if (pathname.startsWith("/doctor/appointments")) return "appointments";
        if (pathname.startsWith("/doctor/profile")) return "profile";
        return "";
    };

    const activeTab = getActiveTab();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-lg safe-area-bottom">
            <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => router.push(tab.path)}
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                            }`}
                    >
                        <tab.icon size={24} />
                        <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
