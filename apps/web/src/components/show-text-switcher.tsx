import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect } from "react";
import { useTextContext } from "@/contexts/text-show-context";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function ShowTextSwitcher() {
  const { isShowing, toggleShow } = useTextContext();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        toggleShow();
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [toggleShow]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              className="h-7 w-7 cursor-pointer border-none"
              onClick={toggleShow}
              size="icon"
              variant="outline"
            />
          }
        >
          {isShowing ? (
            <EyeIcon className="size-4 transition-all" />
          ) : (
            <EyeOffIcon className="size-4 transition-all" />
          )}
          <span className="sr-only">
            {isShowing ? "Mostrar" : "Ocultar"} valores
          </span>
        </TooltipTrigger>

        <TooltipContent align="center" side="bottom">
          {isShowing ? "Mostrar" : "Ocultar"} valores{"  "}
          <kbd className="ml-1.5 rounded bg-primary-foreground px-1 text-primary text-xs sm:inline">
            F2
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
