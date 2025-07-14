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
            // Template variable settings
            $table->json('template_variables')->nullable()->after('enable_content_switching');
            $table->boolean('enable_template_variables')->default(false)->after('template_variables');
            
            // Tracking options
            $table->boolean('enable_open_tracking')->default(true)->after('enable_template_variables');
            $table->boolean('enable_click_tracking')->default(true)->after('enable_open_tracking');
            $table->boolean('enable_unsubscribe_link')->default(true)->after('enable_click_tracking');
            
            // Template variable mapping for recipient data
            $table->json('recipient_field_mapping')->nullable()->after('enable_unsubscribe_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'template_variables',
                'enable_template_variables',
                'enable_open_tracking',
                'enable_click_tracking',
                'enable_unsubscribe_link',
                'recipient_field_mapping'
            ]);
        });
    }
}; 