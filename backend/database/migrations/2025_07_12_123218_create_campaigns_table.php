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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->index();
            $table->string('name');
            $table->string('subject');
            $table->enum('status', ['DRAFT', 'RUNNING', 'PAUSED', 'STOPPED', 'COMPLETED'])->default('DRAFT');
            $table->json('sender_ids');
            $table->json('content_ids');
            $table->string('recipient_list_path');
            $table->string('sent_list_path')->nullable();
            $table->integer('recipient_count')->default(0);
            $table->integer('total_sent')->default(0);
            $table->integer('total_failed')->default(0);
            $table->boolean('enable_content_switching')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
