<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('sender_id')->nullable()->constrained()->onDelete('cascade');
            $table->integer('daily_limit')->default(50);
            $table->integer('warmup_days')->default(30);
            $table->decimal('ramp_up_rate', 5, 2)->default(10.00);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_analysis')->nullable();
            $table->decimal('current_reputation', 5, 2)->default(0);
            $table->decimal('bounce_rate', 5, 2)->default(0);
            $table->decimal('fbl_rate', 5, 2)->default(0);
            $table->decimal('spam_complaint_rate', 5, 2)->default(0);
            $table->decimal('delivery_rate', 5, 2)->default(0);
            $table->integer('analysis_frequency')->default(24);
            $table->integer('min_daily_limit')->default(1);
            $table->integer('max_daily_limit')->default(1000);
            $table->decimal('reputation_threshold', 5, 2)->default(60.00);
            $table->decimal('adjustment_factor', 5, 2)->default(10.00);
            $table->timestamp('last_adjustment')->nullable();
            $table->string('training_status')->default('warmup');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_configs');
    }
};
