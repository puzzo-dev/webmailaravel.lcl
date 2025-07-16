<?php

namespace App\Traits;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Traits\LoggingTrait;
use App\Traits\CacheManagementTrait;
use App\Traits\ValidationTrait;
use App\Models\SystemConfig;

trait TelegramTrait
{
    use LoggingTrait, CacheManagementTrait, ValidationTrait;
} 