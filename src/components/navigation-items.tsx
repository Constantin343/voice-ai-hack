'use client';

import { cn } from "@/lib/utils";
import { BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { posts } from "@/data/posts";

interface NavigationItemsProps {
  onItemClick?: () => void;
}

export function NavigationItems({ onItemClick }: NavigationItemsProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col flex-1">
      {/* Main navigation */}
      <div className="px-3 py-2">
        <Link
          href="/knowledgebase"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-x-2 text-base font-semibold px-4 py-3 rounded-lg transition-colors",
            pathname === '/knowledgebase' 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-muted"
          )}
        >
          <BookOpen className="h-5 w-5" />
          Knowledge Base
        </Link>
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center px-6">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Posts</span>
        </div>
      </div>

      {/* Posts list */}
      <div className="px-3 py-2">
        <div className="space-y-1">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-x-2 text-base px-4 py-3 rounded-lg transition-colors",
                pathname === `/post/${post.id}`
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted"
              )}
            >
              <MessageSquare className="h-5 w-5" />
              {post.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 