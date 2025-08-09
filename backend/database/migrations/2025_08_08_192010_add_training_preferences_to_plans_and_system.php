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
        // Add training preferences to plans
        Schema::table('plans', function (Blueprint $table) {
            $table->enum('training_mode', ['automatic', 'manual'])->default('automatic')->after('features');
            $table->boolean('allow_manual_training')->default(true)->after('training_mode');
        });

        // Add system-wide training settings (ADMIN ONLY)
        SystemConfig::set('TRAINING_DEFAULT_MODE', 'manual', 'Default training mode for new plans');
        SystemConfig::set('TRAINING_MANUAL_START_LIMIT', 50, 'Starting daily limit for new senders (manual mode)');
        SystemConfig::set('TRAINING_MANUAL_INCREASE_PERCENTAGE', 10, 'Percentage increase every interval (manual mode)');
        SystemConfig::set('TRAINING_MANUAL_INCREASE_INTERVAL_DAYS', 2, 'Days between limit increases (manual mode)');
        SystemConfig::set('TRAINING_MANUAL_MAX_LIMIT', 500, 'Maximum daily limit for senders (manual mode)');
        SystemConfig::set('TRAINING_AUTOMATIC_THRESHOLD', 100, 'Number of emails before automatic training kicks in');
        SystemConfig::set('TRAINING_ADMIN_ONLY', true, 'Training settings are admin-only (no user override)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['training_mode', 'allow_manual_training']);
        });

        // Remove system config entries
        SystemConfig::where('key', 'TRAINING_DEFAULT_MODE')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_START_LIMIT')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_INCREASE_PERCENTAGE')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_INCREASE_INTERVAL_DAYS')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_MAX_LIMIT')->delete();
        SystemConfig::where('key', 'TRAINING_AUTOMATIC_THRESHOLD')->delete();
        SystemConfig::where('key', 'TRAINING_ADMIN_ONLY')->delete();
    }
};
