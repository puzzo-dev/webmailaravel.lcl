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
        Schema::create('bounce_processing_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('message_id')->nullable();
            $table->string('from_email')->nullable();
            $table->string('to_email')->nullable();
            $table->text('bounce_reason')->nullable();
            $table->enum('bounce_type', ['hard', 'soft', 'block', 'spam'])->default('hard');
            $table->enum('status', ['processed', 'failed', 'skipped'])->default('processed');
            $table->text('error_message')->nullable();
            $table->json('raw_message')->nullable();
            $table->timestamp('processed_at')->useCurrent();
            $table->timestamps();
            
            $table->index(['domain_id', 'processed_at']);
            $table->index(['to_email', 'bounce_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bounce_processing_logs');
    }
}; 