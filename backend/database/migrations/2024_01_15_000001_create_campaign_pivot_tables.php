<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('campaign_sender')) {
            Schema::create('campaign_sender', function (Blueprint $table) {
                $table->id();
                $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
                $table->foreignId('sender_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                $table->unique(['campaign_id', 'sender_id']);
            });
        }

        if (!Schema::hasTable('campaign_content')) {
            Schema::create('campaign_content', function (Blueprint $table) {
                $table->id();
                $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
                $table->foreignId('content_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                $table->unique(['campaign_id', 'content_id']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('campaign_sender')) {
            Schema::dropIfExists('campaign_sender');
        }
        if (Schema::hasTable('campaign_content')) {
            Schema::dropIfExists('campaign_content');
        }
    }
};
