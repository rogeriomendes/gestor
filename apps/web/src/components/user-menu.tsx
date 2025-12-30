import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link href="/">
        <Button variant="outline">Sign In</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex-1"
        render={
          <Button
            className="peer/menu-button flex h-10 items-center gap-3 rounded-md p-2 text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:text-sm"
            variant="outline"
          />
        }
      >
        {session.user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
            variant="destructive"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
