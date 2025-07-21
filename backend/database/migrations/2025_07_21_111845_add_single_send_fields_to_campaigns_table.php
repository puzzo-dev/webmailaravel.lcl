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
        Schema::table('campaigns', function (Blueprint $table) {
            $table->enum('type', ['bulk', 'single'])->default('bulk')->after('name');
            $table->string('single_recipient_email')->nullable()->after('recipient_list_path');
            $table->text('bcc_recipients')->nullable()->after('single_recipient_email');
            $table->foreignId('single_sender_id')->nullable()->constrained('senders')->after('sender_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropForeign(['single_sender_id']);
            $table->dropColumn(['type', 'single_recipient_email', 'bcc_recipients', 'single_sender_id']);
        });
    }
};
