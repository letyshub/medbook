interface BulkSelectionControlsProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function BulkSelectionControls({
  totalCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
}: BulkSelectionControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm">
        {selectedCount} of {totalCount} selected
      </span>
      <div className="flex space-x-3">
        <button
          onClick={onSelectAll}
          disabled={selectedCount === totalCount}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Select All
        </button>
        <button
          onClick={onDeselectAll}
          disabled={selectedCount === 0}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Deselect All
        </button>
      </div>
    </div>
  );
}
