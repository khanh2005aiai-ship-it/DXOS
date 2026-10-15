interface PaginationProps {
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
}

export function Pagination({ hasMore, onLoadMore, isLoading }: PaginationProps) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center py-4">
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className="btn-secondary"
      >
        {isLoading ? 'Đang tải thêm...' : 'Tải thêm'}
      </button>
    </div>
  );
}
