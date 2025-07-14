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
        Schema::create('email_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->string('recipient_email');
            $table->string('email_id')->unique(); // Unique identifier for tracking
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamp('bounced_at')->nullable();
            $table->timestamp('complained_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('device_type')->nullable(); // mobile, desktop, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['campaign_id', 'sent_at']);
            $table->index(['email_id']);
            $table->index(['recipient_email']);
            $table->index(['opened_at']);
            $table->index(['clicked_at']);
            $table->index(['bounced_at']);
            $table->index(['complained_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_tracking');
    }
}; 