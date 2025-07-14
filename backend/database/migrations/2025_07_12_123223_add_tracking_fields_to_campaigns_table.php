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
            $table->integer('opens')->default(0)->after('total_failed');
            $table->integer('clicks')->default(0)->after('opens');
            $table->integer('bounces')->default(0)->after('clicks');
            $table->integer('complaints')->default(0)->after('bounces');
            $table->decimal('open_rate', 5, 2)->default(0.00)->after('complaints');
            $table->decimal('click_rate', 5, 2)->default(0.00)->after('open_rate');
            $table->decimal('bounce_rate', 5, 2)->default(0.00)->after('click_rate');
            $table->decimal('complaint_rate', 5, 2)->default(0.00)->after('bounce_rate');
            $table->timestamp('started_at')->nullable()->after('complaint_rate');
            $table->timestamp('completed_at')->nullable()->after('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'opens', 'clicks', 'bounces', 'complaints',
                'open_rate', 'click_rate', 'bounce_rate', 'complaint_rate',
                'started_at', 'completed_at'
            ]);
        });
    }
}; 