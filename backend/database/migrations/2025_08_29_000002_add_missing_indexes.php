<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add missing indexes for performance (idempotent — skips existing indexes)
        $this->addIndexIfExists('subscriptions', 'user_id', 'subscriptions_user_id_index');
        $this->addIndexIfExists('senders', 'user_id', 'senders_user_id_index');
        $this->addIndexIfExists('campaigns', 'status', 'campaigns_status_index');
        $this->addIndexIfExists('campaigns', 'user_id', 'campaigns_user_id_index');
        $this->addIndexIfExists('bounce_processing_logs', 'bounce_credential_id', 'bpl_bounce_credential_id_index');
        $this->addIndexIfExists('email_tracking', 'campaign_id', 'email_tracking_campaign_id_index');
        $this->addIndexIfExists('email_tracking', 'sender_id', 'email_tracking_sender_id_index');
        $this->addIndexIfExists('click_tracking', 'email_tracking_id', 'click_tracking_email_tracking_id_index');
        $this->addIndexIfExists('suppression_lists', 'user_id', 'suppression_lists_user_id_index');
        $this->addIndexIfExists('bounce_credentials', 'user_id', 'bounce_credentials_user_id_index');
    }

    public function down(): void
    {
        $this->dropIndexIfExists('subscriptions', 'subscriptions_user_id_index');
        $this->dropIndexIfExists('senders', 'senders_user_id_index');
        $this->dropIndexIfExists('campaigns', 'campaigns_status_index');
        $this->dropIndexIfExists('campaigns', 'campaigns_user_id_index');
        $this->dropIndexIfExists('bounce_processing_logs', 'bpl_bounce_credential_id_index');
        $this->dropIndexIfExists('email_tracking', 'email_tracking_campaign_id_index');
        $this->dropIndexIfExists('email_tracking', 'email_tracking_sender_id_index');
        $this->dropIndexIfExists('click_tracking', 'click_tracking_email_tracking_id_index');
        $this->dropIndexIfExists('suppression_lists', 'suppression_lists_user_id_index');
        $this->dropIndexIfExists('bounce_credentials', 'bounce_credentials_user_id_index');
    }

    private function addIndexIfExists(string $table, string $column, string $indexName): void
    {
        if (Schema::hasTable($table) && Schema::hasColumn($table, $column) && !Schema::hasIndex($table, $indexName)) {
            Schema::table($table, function (Blueprint $t) use ($column, $indexName) {
                $t->index($column, $indexName);
            });
        }
    }

    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if (Schema::hasIndex($table, $indexName)) {
            Schema::table($table, function (Blueprint $t) use ($indexName) {
                $t->dropIndex($indexName);
            });
        }
    }
};
