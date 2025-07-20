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
        Schema::create('smtp_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('host');
            $table->integer('port');
            $table->string('username');
            $table->text('password');
            $table->enum('encryption', ['tls', 'ssl', 'none'])->default('tls');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['domain_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('smtp_configs');
    }
}; 