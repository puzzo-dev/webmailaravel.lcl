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
        Schema::create('backups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('filename');
            $table->string('path');
            $table->bigInteger('size')->default(0);
            $table->string('type')->default('database');
            $table->string('status')->default('pending');
            $table->string('compression')->nullable();
            $table->string('encryption')->nullable();
            $table->string('checksum')->nullable();
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('restored_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('restored_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['status', 'created_at']);
            $table->index(['type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backups');
    }
};
