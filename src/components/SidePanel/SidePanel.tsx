"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";


export default function SidePanel() {
    const pathname = usePathname();
    const links = [
        { href: "/dashboard", label: "Home" },
        { href: "/dashboard/workspace", label: "Workspace" },
        { href: "/dashboard/collection", label: "Collection" },
        { href: "/dashboard/notes", label: "Notes" },
        { href: "/dashboard/chat", label: "Chat" },
    ];

    return (
        <div className="w-[300px] h-screen flex item-center justify-around flex-col p-10 overflow-y-auto bg-black text-white border-r-2 border-[#696E79]">
            <div className="height-[200px] border-[#696E79]-2 border-b-2 pb-4 mb-4">
                <h1 className="text-[#01C38D] text-2xl" >Company Name</h1>
            </div>

            <div className="flex flex-col gap-4">
                {/* <p className="text-[#01C38D] text-2xl">Home</p> */}
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`px-2 py-1 rounded ${pathname === link.href ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                            }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className="border-t-2 border-[#696E79] pt-4">
                <p className="text-[#01C38D]">Muhammad Usama</p>
            </div>

        </div>
    );
}