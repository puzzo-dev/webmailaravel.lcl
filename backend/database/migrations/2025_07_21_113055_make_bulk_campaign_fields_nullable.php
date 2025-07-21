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
            $table->string('recipient_list_path')->nullable()->change();
            $table->string('sent_list_path')->nullable()->change();
            $table->string('unsubscribe_list_path')->nullable()->change();
            $table->string('unsubscribe_list_format')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('recipient_list_path')->nullable(false)->change();
            $table->string('sent_list_path')->nullable(false)->change();
            $table->string('unsubscribe_list_path')->nullable(false)->change();
            $table->string('unsubscribe_list_format')->nullable(false)->change();
        });
    }
};
