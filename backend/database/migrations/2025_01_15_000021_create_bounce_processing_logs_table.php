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
            $table->foreignId('bounce_credential_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('domain_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('message_id')->nullable(); // Email message ID
            $table->string('bounce_email')->index(); // The bounced email address
            $table->enum('bounce_type', ['hard', 'soft', 'complaint', 'unsubscribe', 'other'])->index();
            $table->string('bounce_reason')->nullable();
            $table->text('raw_message')->nullable(); // Store raw email for debugging
            $table->json('parsed_data')->nullable(); // Parsed bounce information
            $table->boolean('added_to_suppression')->default(false);
            $table->enum('processing_status', ['pending', 'processed', 'failed', 'ignored'])->default('pending');
            $table->text('processing_notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['bounce_type', 'created_at']);
            $table->index(['processing_status']);
            $table->index(['user_id', 'created_at']);
            $table->index(['added_to_suppression']);
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
