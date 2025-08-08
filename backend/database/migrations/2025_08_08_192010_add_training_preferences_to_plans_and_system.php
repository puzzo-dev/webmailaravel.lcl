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

        // Add system-wide training settings
        SystemConfig::set('TRAINING_DEFAULT_MODE', 'automatic', 'Default training mode for new plans');
        SystemConfig::set('TRAINING_ALLOW_USER_OVERRIDE', true, 'Allow users to override training mode in their account settings');
        SystemConfig::set('TRAINING_AUTOMATIC_THRESHOLD', 100, 'Number of emails before automatic training kicks in');
        SystemConfig::set('TRAINING_MANUAL_APPROVAL_REQUIRED', false, 'Require admin approval for manual training changes');
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
        SystemConfig::where('key', 'TRAINING_ALLOW_USER_OVERRIDE')->delete();
        SystemConfig::where('key', 'TRAINING_AUTOMATIC_THRESHOLD')->delete();
        SystemConfig::where('key', 'TRAINING_MANUAL_APPROVAL_REQUIRED')->delete();
    }
};
