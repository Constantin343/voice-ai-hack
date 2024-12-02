import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {createClient} from "@/utils/supabase/client";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {LogOut, Settings} from "lucide-react";
import {useMemo, useState, useEffect} from "react";
import { useSidebar } from "@/contexts/SidebarContext";

export function UserProfile() {
  const router = useRouter();
  const { setIsOpen } = useSidebar();
  const supabase = useMemo(() => {
    return createClient()
  }, []);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData(user)
      }
    }
    fetchUser()
  }, [supabase.auth])

  const handleSignOut = async () => {
    console.log("signing out")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error);
    } else {
      router.push('/');
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push('/settings');
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <div 
          className="flex items-center gap-x-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={userData?.user_metadata?.picture || "/avatar-placeholder.jpg"} />
            <AvatarFallback>
              {userData?.user_metadata?.name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium">{userData?.user_metadata?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{userData?.user_metadata?.email || 'No email'}</p>
          </div>
          <Settings className="h-4 w-4 ml-2 text-muted-foreground" />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut}>Sign out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}