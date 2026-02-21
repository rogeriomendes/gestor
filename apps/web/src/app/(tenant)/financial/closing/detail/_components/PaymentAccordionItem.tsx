import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PaymentAccordionItemProps {
  amount: string | number;
  children: ReactNode;
  className?: string;
  color?: string;
  icon: React.ComponentType<{ className?: string }> | undefined;
  title: string;
  value: string;
}

export function PaymentAccordionItem({
  value,
  icon: Icon,
  title,
  amount,
  color = "",
  children,
  className,
}: PaymentAccordionItemProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <div className={`flex items-center ${color}`}>
          <div className="mr-4 flex flex-row items-center">
            {Icon && <Icon className="mr-2 size-4" />}
            {title}
          </div>
        </div>
        <div className={`flex items-center ${color}`}>
          <div className="mr-4">{amount}</div>
          {/* <ChevronDownIcon
            className={`size-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 ${color}`}
          /> */}
          <ChevronDownIcon
            className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
            data-slot="accordion-trigger-icon"
          />
          <ChevronUpIcon
            className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
            data-slot="accordion-trigger-icon"
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className={`mx-1.5 space-y-2 ${className}`}>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
