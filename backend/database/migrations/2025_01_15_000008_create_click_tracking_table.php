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
        Schema::create('click_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('email_tracking_id')->constrained('email_tracking')->onDelete('cascade');
            $table->string('link_id'); // Unique identifier for the link
            $table->text('original_url'); // The original URL that was clicked
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->timestamp('clicked_at');
            $table->timestamps();

            // Indexes for performance
            $table->index(['email_tracking_id']);
            $table->index(['link_id']);
            $table->index(['clicked_at']);
            $table->index(['ip_address']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('click_tracking');
    }
}; 