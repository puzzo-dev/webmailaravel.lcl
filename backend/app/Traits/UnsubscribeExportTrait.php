use App\Traits\LoggingTrait;
use App\Traits\CacheManagementTrait;
use App\Traits\ValidationTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\UnsubscribeExport;
use App\Models\EmailTracking;
use App\Models\Campaign;
use Carbon\Carbon;

trait UnsubscribeExportTrait
{
    use LoggingTrait, CacheManagementTrait, ValidationTrait, FileProcessingTrait;
} 