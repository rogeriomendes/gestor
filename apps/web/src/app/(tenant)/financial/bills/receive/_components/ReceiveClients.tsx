"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReceiveClientsLinks from "./ReceiveClientsLinks";

export default function ReceiveClients() {
  return (
    <Card className="h-full rounded-md" size="sm">
      <CardHeader>
        <CardTitle className="flex flex-row items-center justify-between group-data-[size=sm]/card:text-base group-data-[size=sm]/card:md:text-lg">
          Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReceiveClientsLinks />
      </CardContent>
    </Card>
  );
}
