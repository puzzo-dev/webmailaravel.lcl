<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Add missing columns that the model expects
            $table->datetime('expiry')->nullable()->after('status');
            $table->datetime('paid_at')->nullable()->after('payment_date');
            $table->text('notes')->nullable()->after('manual_payment_notes');
            $table->unsignedBigInteger('processed_by')->nullable()->after('admin_user_id');
        });

        // Copy data from existing columns to new columns
        DB::statement('UPDATE subscriptions SET expiry = ends_at WHERE ends_at IS NOT NULL');
        DB::statement('UPDATE subscriptions SET paid_at = payment_date WHERE payment_date IS NOT NULL');
        DB::statement('UPDATE subscriptions SET notes = manual_payment_notes WHERE manual_payment_notes IS NOT NULL');
        DB::statement('UPDATE subscriptions SET processed_by = admin_user_id WHERE admin_user_id IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['expiry', 'paid_at', 'notes', 'processed_by']);
        });
    }
};
