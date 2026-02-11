import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore: () => void;
  loadingMessage?: string;
  loadMoreMessage?: string;
  noMoreDataMessage?: string;
  className?: string;
}

export function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais itens para carregar",
  className = "",
}: LoadMoreButtonProps) {
  const showLoadMore = hasNextPage;

  if (!showLoadMore) {
    return null;
  }

  return (
    <div className="my-4 flex flex-col items-center justify-center">
      <Button
        className={`w-full max-w-xs ${className}`}
        disabled={!hasNextPage || isFetchingNextPage}
        onClick={onLoadMore}
        variant="ghost"
      >
        {isFetchingNextPage ? (
          <>
            <Loader2Icon className="mr-3 size-6 animate-spin" />
            {loadingMessage}
          </>
        ) : hasNextPage ? (
          loadMoreMessage
        ) : (
          noMoreDataMessage
        )}
      </Button>
    </div>
  );
}
