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
            $table->string('unsubscribe_list_path')->nullable()->after('sent_list_path');
            $table->enum('unsubscribe_list_format', ['txt', 'csv', 'xls', 'xlsx'])->default('txt')->after('unsubscribe_list_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn(['unsubscribe_list_path', 'unsubscribe_list_format']);
        });
    }
}; 