"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReceiveClientsLinks from "./ReceiveClientsLinks";

export default function ReceiveClients() {
  return (
    <Card className="h-full rounded-md">
      <CardHeader>
        <CardTitle className="flex flex-row items-center justify-between text-base md:text-lg">
          Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="">
        <ReceiveClientsLinks />
      </CardContent>
    </Card>
  );
}
