<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\SystemConfig;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add manual training configuration settings
        SystemConfig::set('TRAINING_MANUAL_START_LIMIT', 50, 'Starting daily limit for manual training (emails per sender per day)');
        SystemConfig::set('TRAINING_MANUAL_INCREASE_PERCENTAGE', 10, 'Percentage increase for manual training every interval');
        SystemConfig::set('TRAINING_MANUAL_INCREASE_INTERVAL_DAYS', 2, 'Days between manual training increases');
        SystemConfig::set('TRAINING_MANUAL_MAX_LIMIT', 500, 'Maximum daily limit for manual training (emails per sender per day)');
        
        // Update default mode to manual since PMTA isn't ready
        SystemConfig::set('TRAINING_DEFAULT_MODE', 'manual', 'Default training mode: automatic or manual');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove manual training settings
        SystemConfig::where('key', 'TRAINING_MANUAL_START_LIMIT')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_INCREASE_PERCENTAGE')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_INCREASE_INTERVAL_DAYS')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_MAX_LIMIT')->delete();
        
        // Revert default mode
        SystemConfig::set('TRAINING_DEFAULT_MODE', 'automatic', 'Default training mode: automatic or manual');
    }
};
