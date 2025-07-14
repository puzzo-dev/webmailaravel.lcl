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
        Schema::create('suppression_lists', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->enum('type', ['unsubscribe', 'fbl', 'bounce', 'complaint', 'manual'])->default('unsubscribe');
            $table->string('source')->nullable(); // campaign_id, fbl_file, manual, etc.
            $table->text('reason')->nullable(); // reason for suppression
            $table->json('metadata')->nullable(); // additional data like IP, user agent, etc.
            $table->timestamp('suppressed_at');
            $table->timestamps();

            // Indexes for performance
            $table->index(['email']);
            $table->index(['type']);
            $table->index(['suppressed_at']);
            $table->index(['source']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppression_lists');
    }
}; 