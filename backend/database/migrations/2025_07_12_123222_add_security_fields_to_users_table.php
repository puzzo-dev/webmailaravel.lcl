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
        Schema::table('users', function (Blueprint $table) {
            $table->string('two_factor_secret')->nullable()->after('password');
            $table->boolean('two_factor_enabled')->default(false)->after('two_factor_secret');
            $table->timestamp('two_factor_enabled_at')->nullable()->after('two_factor_enabled');
            $table->json('backup_codes')->nullable()->after('two_factor_enabled_at');
            $table->timestamp('last_password_change')->nullable()->after('backup_codes');
            $table->string('billing_status')->default('inactive')->after('last_password_change');
            $table->timestamp('last_payment_at')->nullable()->after('billing_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_secret',
                'two_factor_enabled',
                'two_factor_enabled_at',
                'backup_codes',
                'last_password_change',
                'billing_status',
                'last_payment_at'
            ]);
        });
    }
}; 
 
 
 
 
 