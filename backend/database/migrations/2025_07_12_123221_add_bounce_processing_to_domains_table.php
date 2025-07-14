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
        Schema::table('domains', function (Blueprint $table) {
            // Bounce processing settings
            $table->boolean('enable_bounce_processing')->default(false)->after('complaint_rate');
            $table->enum('bounce_protocol', ['imap', 'pop3'])->nullable()->after('enable_bounce_processing');
            $table->string('bounce_host')->nullable()->after('bounce_protocol');
            $table->integer('bounce_port')->nullable()->after('bounce_host');
            $table->string('bounce_username')->nullable()->after('bounce_port');
            $table->text('bounce_password')->nullable()->after('bounce_username');
            $table->boolean('bounce_ssl')->default(true)->after('bounce_password');
            $table->string('bounce_mailbox')->default('INBOX')->after('bounce_ssl');
            $table->integer('bounce_check_interval')->default(300)->after('bounce_mailbox'); // 5 minutes
            $table->timestamp('last_bounce_check')->nullable()->after('bounce_check_interval');
            $table->json('bounce_processing_rules')->nullable()->after('last_bounce_check');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn([
                'enable_bounce_processing',
                'bounce_protocol',
                'bounce_host',
                'bounce_port',
                'bounce_username',
                'bounce_password',
                'bounce_ssl',
                'bounce_mailbox',
                'bounce_check_interval',
                'last_bounce_check',
                'bounce_processing_rules'
            ]);
        });
    }
}; 