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
            if (!Schema::hasColumn('domains', 'total_sent')) {
                $table->integer('total_sent')->default(0)->after('reputation_data');
            }
            if (!Schema::hasColumn('domains', 'health_score')) {
                $table->decimal('health_score', 5, 2)->default(100)->after(Schema::hasColumn('domains', 'total_sent') ? 'total_sent' : 'reputation_data');
            }
            if (!Schema::hasColumn('domains', 'health_status')) {
                $table->enum('health_status', ['excellent', 'good', 'fair', 'poor'])->default('excellent')->after('health_score');
            }
            if (!Schema::hasColumn('domains', 'last_monitored')) {
                $table->timestamp('last_monitored')->nullable()->after('health_status');
            }
            if (!Schema::hasColumn('domains', 'last_training_check')) {
                $table->timestamp('last_training_check')->nullable()->after('last_monitored');
            }
            if (!Schema::hasColumn('domains', 'max_msg_rate')) {
                $table->integer('max_msg_rate')->default(100)->after('last_training_check');
            }
            if (!Schema::hasColumn('domains', 'provider')) {
                $table->string('provider')->nullable()->after('max_msg_rate');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn([
                'total_sent',
                'health_score',
                'health_status',
                'last_monitored',
                'last_training_check',
                'max_msg_rate',
                'provider'
            ]);
        });
    }
};
