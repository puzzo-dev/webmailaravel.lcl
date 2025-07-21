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
        Schema::table('senders', function (Blueprint $table) {
            $table->integer('daily_limit')->default(10)->after('is_active');
            $table->integer('current_daily_sent')->default(0)->after('daily_limit');
            $table->date('last_reset_date')->nullable()->after('current_daily_sent');
            $table->decimal('reputation_score', 5, 2)->default(50.00)->after('last_reset_date');
            $table->timestamp('last_training_at')->nullable()->after('reputation_score');
            $table->json('training_data')->nullable()->after('last_training_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('senders', function (Blueprint $table) {
            $table->dropColumn([
                'daily_limit',
                'current_daily_sent',
                'last_reset_date',
                'reputation_score',
                'last_training_at',
                'training_data'
            ]);
        });
    }
};
