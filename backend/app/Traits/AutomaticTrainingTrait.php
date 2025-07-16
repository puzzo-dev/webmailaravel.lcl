use App\Traits\LoggingTrait;
use App\Traits\CacheManagementTrait;
use App\Traits\ValidationTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\AutomaticTraining;
use App\Models\Campaign;
use App\Models\EmailTracking;
use Carbon\Carbon;

trait AutomaticTrainingTrait
{
    use LoggingTrait, CacheManagementTrait, ValidationTrait, FileProcessingTrait; 