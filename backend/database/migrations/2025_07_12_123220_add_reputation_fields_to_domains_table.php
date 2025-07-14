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
            $table->decimal('reputation_score', 5, 2)->default(0)->after('status');
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low')->after('reputation_score');
            $table->decimal('bounce_rate', 5, 2)->default(0)->after('risk_level');
            $table->decimal('complaint_rate', 5, 2)->default(0)->after('bounce_rate');
            $table->decimal('delivery_rate', 5, 2)->default(0)->after('complaint_rate');
            $table->timestamp('last_reputation_check')->nullable()->after('delivery_rate');
            $table->json('reputation_data')->nullable()->after('last_reputation_check');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn([
                'reputation_score',
                'risk_level',
                'bounce_rate',
                'complaint_rate',
                'delivery_rate',
                'last_reputation_check',
                'reputation_data'
            ]);
        });
    }
}; 
 
 
 
 
 