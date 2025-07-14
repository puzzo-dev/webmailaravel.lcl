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
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('payment_id');
            $table->decimal('payment_amount', 10, 2)->nullable()->after('payment_method');
            $table->string('payment_currency', 3)->default('USD')->after('payment_amount');
            $table->timestamp('payment_date')->nullable()->after('payment_currency');
            $table->string('payment_reference')->nullable()->after('payment_date');
            $table->text('manual_payment_notes')->nullable()->after('payment_reference');
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->after('manual_payment_notes');
            $table->timestamp('last_extension_at')->nullable()->after('admin_user_id');
            $table->foreignId('last_extension_by')->nullable()->constrained('users')->after('last_extension_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['admin_user_id', 'last_extension_by']);
            $table->dropColumn([
                'payment_method',
                'payment_amount',
                'payment_currency',
                'payment_date',
                'payment_reference',
                'manual_payment_notes',
                'admin_user_id',
                'last_extension_at',
                'last_extension_by'
            ]);
        });
    }
}; 