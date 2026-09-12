<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('senders', function (Blueprint $table) {
            $table->text('dkim_private_key')->nullable()->after('training_data');
            $table->string('dkim_selector')->nullable()->after('dkim_private_key');
            $table->timestamp('dns_verified_at')->nullable()->after('dkim_selector');
        });
    }

    public function down(): void
    {
        Schema::table('senders', function (Blueprint $table) {
            $table->dropColumn(['dkim_private_key', 'dkim_selector', 'dns_verified_at']);
        });
    }
};
