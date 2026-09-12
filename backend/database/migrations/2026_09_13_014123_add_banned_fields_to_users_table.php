<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('banned_at')->nullable()->after('remember_token');
            $table->foreignId('banned_by')->nullable()->constrained('users')->nullOnDelete()->after('banned_at');
            $table->text('ban_reason')->nullable()->after('banned_by');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['banned_by']);
            $table->dropColumn(['banned_at', 'banned_by', 'ban_reason']);
        });
    }
};
