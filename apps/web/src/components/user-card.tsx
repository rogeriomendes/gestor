"use client";

import { ChevronDownIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "./ui/item";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export default function UserCard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground [&_svg]:size-6"
                size="lg"
              />
            }
          >
            <ItemMedia className="rounded-full bg-sidebar-accent">
              <UserIcon className="m-1" />
            </ItemMedia>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{session.user.name}</span>
              <span className="truncate text-xs">{session.user.email}</span>
            </div>
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <Item size="xs">
                  <ItemMedia className="rounded-full bg-sidebar-accent">
                    <UserIcon className="m-1 size-6" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                    <ItemTitle className="truncate" title={session.user.name}>
                      {session.user.name}
                    </ItemTitle>
                    <ItemDescription
                      className="truncate"
                      title={session.user.email}
                    >
                      {session.user.email}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Conta</DropdownMenuItem>
              <DropdownMenuItem>Faturamento</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Configurações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
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
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
