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
        Schema::create('bounce_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('domain_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('email')->index(); // The bounce email address
            $table->enum('protocol', ['imap', 'pop3'])->default('imap');
            $table->string('host');
            $table->integer('port')->default(993);
            $table->string('username');
            $table->text('password'); // Will be encrypted
            $table->enum('encryption', ['ssl', 'tls', 'none'])->default('ssl');
            $table->boolean('is_default')->default(false); // User's default bounce config
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable(); // Additional IMAP/POP3 settings
            $table->timestamp('last_checked_at')->nullable();
            $table->integer('processed_count')->default(0);
            $table->json('last_error')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'is_default']);
            $table->index(['domain_id']);
            $table->index(['is_active', 'last_checked_at']);
            
            // Constraints
            $table->unique(['user_id', 'domain_id'], 'unique_user_domain_bounce');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bounce_credentials');
    }
};
