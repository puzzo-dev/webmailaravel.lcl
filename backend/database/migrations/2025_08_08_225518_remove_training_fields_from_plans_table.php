<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Remove training fields - training is a global system setting, not per-plan
            $table->dropColumn(['training_mode', 'allow_manual_training']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Add them back if needed (but they shouldn't be here)
            $table->enum('training_mode', ['automatic', 'manual'])->default('automatic');
            $table->boolean('allow_manual_training')->default(true);
        });
    }
};
