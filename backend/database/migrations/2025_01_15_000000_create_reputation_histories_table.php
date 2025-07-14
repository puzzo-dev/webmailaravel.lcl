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
        Schema::create('reputation_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('reputation_score', 5, 2)->default(0);
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low');
            $table->decimal('bounce_rate', 5, 2)->default(0);
            $table->decimal('complaint_rate', 5, 2)->default(0);
            $table->decimal('delivery_rate', 5, 2)->default(0);
            $table->integer('total_emails_sent')->default(0);
            $table->integer('total_bounces')->default(0);
            $table->integer('total_complaints')->default(0);
            $table->json('fbl_data')->nullable();
            $table->json('diagnostic_data')->nullable();
            $table->timestamps();

            $table->unique(['domain_id', 'date']);
            $table->index(['date', 'reputation_score']);
            $table->index(['risk_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reputation_histories');
    }
}; 
 
 
 
 
 