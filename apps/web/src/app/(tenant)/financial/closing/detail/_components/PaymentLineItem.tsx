import { Maximize2Icon } from "lucide-react";
import type { ReactNode } from "react";

interface PaymentLineItemProps {
  amount: string | number;
  children?: ReactNode;
  label: string | null;
  onClick?: () => void;
  prefix?: string;
  suffix?: string;
}

export function PaymentLineItem({
  label,
  amount,
  prefix = "",
  suffix = "",
  onClick,
  children,
}: PaymentLineItemProps) {
  const content = (
    <div className="flex flex-row justify-between">
      <div className="flex flex-row items-center">
        {onClick && <Maximize2Icon className="mr-2 size-3.5" />}
        {children}
        {label && label}
      </div>
      <div className="ml-2">
        {prefix}
        {amount}
        {suffix}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div
        className="cursor-pointer rounded-md p-1.5 hover:bg-muted/50"
        onClick={onClick}
      >
        {content}
      </div>
    );
  }

  return content;
}
