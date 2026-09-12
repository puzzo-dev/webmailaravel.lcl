<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_tracking', function (Blueprint $table) {
            $table->string('unsubscribe_token')->nullable()->unique()->after('email_id');
            $table->index('unsubscribe_token');
        });
    }

    public function down(): void
    {
        Schema::table('email_tracking', function (Blueprint $table) {
            $table->dropIndex(['unsubscribe_token']);
            $table->dropColumn('unsubscribe_token');
        });
    }
};
