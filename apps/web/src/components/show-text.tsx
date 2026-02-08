import { useTextContext } from "@/contexts/text-show-context";

export function ShowText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isShowing } = useTextContext();

  return isShowing ? (
    <span className="flex flex-row items-center gap-2">
      R${" "}
      <span className="relative inline-flex size-2 rounded-full bg-current" />
      <span className="relative inline-flex size-2 rounded-full bg-current" />
      <span className="relative inline-flex size-2 rounded-full bg-current" />
      <span className="relative inline-flex size-2 rounded-full bg-current" />
      <span className="relative inline-flex size-2 rounded-full bg-current" />
    </span>
  ) : (
    <span className={className}>{children}</span>
  );
}
