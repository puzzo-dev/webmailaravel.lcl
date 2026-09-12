<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bounce_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('email')->index();
            $table->enum('protocol', ['imap', 'pop3'])->default('imap');
            $table->string('host');
            $table->integer('port')->default(993);
            $table->string('username');
            $table->text('password');
            $table->enum('encryption', ['ssl', 'tls', 'none'])->default('ssl');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->integer('processed_count')->default(0);
            $table->json('last_error')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_default']);
            $table->index(['is_active', 'last_checked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bounce_credentials');
    }
};
