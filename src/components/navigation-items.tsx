'use client';

import { cn } from "@/lib/utils";
import { BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Tables } from "@/lib/database.types";

interface NavigationItemsProps {
  onItemClick?: () => void;
}

export function NavigationItems({ onItemClick }: NavigationItemsProps) {
  const pathname = usePathname();
  const [posts, setPosts] = useState<Tables<'content_items'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/db/read');
        const data = await response.json();
        console.log('Fetched posts:', data);
        
        if (data.content_items) {
          setPosts(data.content_items);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading posts...</span>
          </div>
        ) : (
          <div className="space-y-1">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-x-2 text-base px-4 py-3 rounded-lg transition-colors group",
                  pathname === `/post/${post.id}`
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                )}
              >
                <div className="flex-shrink-0 w-5 h-5">
                  <MessageSquare className="w-full h-full" />
                </div>
                <span className="flex-1 truncate">{post.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 