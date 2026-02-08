"use client";

import { ChevronDownIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ReceiveClientsLinks from "./ReceiveClientsLinks";

export default function ReceiveClientsMobile() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  const clientId = searchParams.get("clientId");

  useEffect(() => {
    if (clientId) {
      setOpen(false);
    }
  }, [clientId]);

  return (
    <Collapsible
      className="grid h-full rounded-md"
      onOpenChange={setOpen}
      open={open}
    >
      <CollapsibleTrigger className="flex items-center rounded-md border bg-card p-3 text-base text-card-foreground shadow hover:bg-accent [&[data-state=open]>svg:last-of-type]:rotate-180 [&[data-state=open]]:bg-accent">
        Clientes
        <ChevronDownIcon className="ml-auto size-5 text-muted-foreground transition duration-300" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out mt-2 grid gap-2 rounded-md border bg-popover p-2 text-accent-foreground data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out">
          <ReceiveClientsLinks />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
