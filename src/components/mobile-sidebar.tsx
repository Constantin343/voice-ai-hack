'use client';

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavigationItems } from "./navigation-items";
import { UserProfile } from "./user-profile";
import Link from 'next/link';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useSidebar } from "@/contexts/SidebarContext";

export function MobileSidebar() {
    const { isOpen, setIsOpen } = useSidebar();

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full">
                <VisuallyHidden>
                    <h2>Mobile Sidebar Menu</h2>
                </VisuallyHidden>
                <VisuallyHidden>
                    <p>Navigate through the menu items and access your profile here.</p>
                </VisuallyHidden>

                <div className="flex flex-col h-full">
                    <div className="p-6 border-b">
                        <Link href="/home" className="block" onClick={() => setIsOpen(false)}>
                            <h2 className="text-2xl font-bold">publyc</h2>
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <NavigationItems onItemClick={() => setIsOpen(false)} />
                    </div>

                    <div className="mt-auto">
                        <UserProfile />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}