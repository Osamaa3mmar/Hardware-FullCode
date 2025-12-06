import { Play, Trash2, Package, Loader2, SkipForward } from "lucide-react";

const QueueControls = ({
  queueStats,
  onProcess,
  onProcessNext,
  onClear,
  isProcessing = false,
}) => {
  const {
    total = 0,
    pending = 0,
    processing = 0,
    completed = 0,
    failed = 0,
  } = queueStats || {};

  return (
    <div className="bg-base-200 rounded-2xl p-6 shadow-xl border border-base-300">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat bg-base-300 rounded-lg p-4">
          <div className="stat-title text-xs">Total Items</div>
          <div className="stat-value text-2xl">{total}</div>
        </div>

        <div className="stat bg-base-300 rounded-lg p-4">
          <div className="stat-title text-xs">Pending</div>
          <div className="stat-value text-2xl text-warning">{pending}</div>
        </div>

        <div className="stat bg-base-300 rounded-lg p-4">
          <div className="stat-title text-xs">Processing</div>
          <div className="stat-value text-2xl text-info">{processing}</div>
        </div>

        <div className="stat bg-base-300 rounded-lg p-4">
          <div className="stat-title text-xs">Completed</div>
          <div className="stat-value text-2xl text-success">{completed}</div>
        </div>

        <div className="stat bg-base-300 rounded-lg p-4">
          <div className="stat-title text-xs">Failed</div>
          <div className="stat-value text-2xl text-error">{failed}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onProcessNext}
          disabled={pending === 0 || isProcessing}
          className="btn btn-secondary gap-2"
        >
          <SkipForward className="w-5 h-5" />
          Draw Next
        </button>

        <button
          onClick={onProcess}
          disabled={pending === 0 || isProcessing}
          className="btn btn-primary flex-1 gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Queue...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Process Queue ({pending} items)
            </>
          )}
        </button>

        <button
          onClick={onClear}
          disabled={total === 0 || isProcessing}
          className="btn btn-error btn-outline gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Clear All
        </button>
      </div>

      {/* Info Message */}
      {pending > 0 && !isProcessing && (
        <div className="alert alert-info mt-4">
          <Package className="w-5 h-5" />
          <span className="text-sm">
            {pending} item{pending !== 1 ? "s" : ""} ready to be processed.
            Click "Process Queue" to start drawing.
          </span>
        </div>
      )}

      {isProcessing && (
        <div className="alert alert-warning mt-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">
            Processing queue... Please wait until all items are completed.
          </span>
        </div>
      )}

      {total === 0 && (
        <div className="alert mt-4">
          <Package className="w-5 h-5" />
          <span className="text-sm">
            Queue is empty. Generate G-code from Image or Text mode and add it
            to the queue.
          </span>
        </div>
      )}
    </div>
  );
};

export default QueueControls;
