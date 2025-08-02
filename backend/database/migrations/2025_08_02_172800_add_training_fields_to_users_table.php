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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('training_enabled')->default(false)->after('last_payment_at');
            $table->enum('training_mode', ['manual', 'automatic'])->default('automatic')->after('training_enabled');
            $table->decimal('manual_training_percentage', 5, 2)->default(10.00)->after('training_mode');
            $table->timestamp('last_manual_training_at')->nullable()->after('manual_training_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'training_enabled',
                'training_mode',
                'manual_training_percentage',
                'last_manual_training_at'
            ]);
        });
    }
};
