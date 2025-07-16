CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "email" varchar not null,
  "email_verified_at" datetime,
  "password" varchar not null,
  "remember_token" varchar,
  "role" varchar not null default 'user',
  "country" varchar,
  "city" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "username" varchar not null,
  "name" varchar,
  "two_factor_secret" varchar,
  "two_factor_enabled" tinyint(1) not null default '0',
  "two_factor_enabled_at" datetime,
  "backup_codes" text,
  "last_password_change" datetime,
  "billing_status" varchar not null default 'inactive',
  "last_payment_at" datetime,
  "telegram_chat_id" varchar,
  "telegram_notifications_enabled" tinyint(1) not null default '0',
  "telegram_verified_at" datetime
);
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE INDEX "users_country_index" on "users"("country");
CREATE INDEX "users_city_index" on "users"("city");
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" text not null,
  "queue" text not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE UNIQUE INDEX "users_username_unique" on "users"("username");
CREATE TABLE IF NOT EXISTS "domains"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "name" varchar not null,
  "is_active" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  "total_sent" integer not null default '0',
  "health_score" numeric not null default '100',
  "health_status" varchar check("health_status" in('excellent', 'good', 'fair', 'poor')) not null default 'excellent',
  "last_monitored" datetime,
  "last_training_check" datetime,
  "max_msg_rate" integer not null default '100',
  "provider" varchar,
  "reputation_score" numeric not null default '0',
  "risk_level" varchar check("risk_level" in('low', 'medium', 'high')) not null default 'low',
  "bounce_rate" numeric not null default '0',
  "complaint_rate" numeric not null default '0',
  "delivery_rate" numeric not null default '0',
  "last_reputation_check" datetime,
  "reputation_data" text,
  "enable_bounce_processing" tinyint(1) not null default '0',
  "bounce_protocol" varchar check("bounce_protocol" in('imap', 'pop3')),
  "bounce_host" varchar,
  "bounce_port" integer,
  "bounce_username" varchar,
  "bounce_password" text,
  "bounce_ssl" tinyint(1) not null default '1',
  "bounce_mailbox" varchar not null default 'INBOX',
  "bounce_check_interval" integer not null default '300',
  "last_bounce_check" datetime,
  "bounce_processing_rules" text,
  foreign key("user_id") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "campaigns"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "name" varchar not null,
  "subject" varchar not null,
  "status" varchar check("status" in('DRAFT', 'RUNNING', 'PAUSED', 'STOPPED', 'COMPLETED')) not null default 'DRAFT',
  "sender_ids" text not null,
  "content_ids" text not null,
  "recipient_list_path" varchar not null,
  "sent_list_path" varchar,
  "recipient_count" integer not null default '0',
  "total_sent" integer not null default '0',
  "total_failed" integer not null default '0',
  "enable_content_switching" tinyint(1) not null default '0',
  "created_at" datetime,
  "updated_at" datetime,
  "opens" integer not null default '0',
  "clicks" integer not null default '0',
  "bounces" integer not null default '0',
  "complaints" integer not null default '0',
  "open_rate" numeric not null default '0',
  "click_rate" numeric not null default '0',
  "bounce_rate" numeric not null default '0',
  "complaint_rate" numeric not null default '0',
  "started_at" datetime,
  "completed_at" datetime,
  "template_variables" text,
  "enable_template_variables" tinyint(1) not null default '0',
  "enable_open_tracking" tinyint(1) not null default '1',
  "enable_click_tracking" tinyint(1) not null default '1',
  "enable_unsubscribe_link" tinyint(1) not null default '1',
  "recipient_field_mapping" text,
  "unsubscribe_list_path" varchar,
  "unsubscribe_list_format" varchar check("unsubscribe_list_format" in('txt', 'csv', 'xls', 'xlsx')) not null default 'txt',
  foreign key("user_id") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "senders"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "domain_id" integer not null,
  "name" varchar not null,
  "email" varchar not null,
  "is_active" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id"),
  foreign key("domain_id") references "domains"("id")
);
CREATE TABLE IF NOT EXISTS "contents"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "campaign_id" integer,
  "name" varchar not null,
  "subject" varchar not null,
  "body" text,
  "html_body" text,
  "text_body" text,
  "is_active" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id"),
  foreign key("campaign_id") references "campaigns"("id")
);
CREATE TABLE IF NOT EXISTS "reputation_histories"(
  "id" integer primary key autoincrement not null,
  "domain_id" integer not null,
  "date" date not null,
  "reputation_score" numeric not null default '0',
  "risk_level" varchar check("risk_level" in('low', 'medium', 'high')) not null default 'low',
  "bounce_rate" numeric not null default '0',
  "complaint_rate" numeric not null default '0',
  "delivery_rate" numeric not null default '0',
  "total_emails_sent" integer not null default '0',
  "total_bounces" integer not null default '0',
  "total_complaints" integer not null default '0',
  "fbl_data" text,
  "diagnostic_data" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("domain_id") references "domains"("id") on delete cascade
);
CREATE UNIQUE INDEX "reputation_histories_domain_id_date_unique" on "reputation_histories"(
  "domain_id",
  "date"
);
CREATE INDEX "reputation_histories_date_reputation_score_index" on "reputation_histories"(
  "date",
  "reputation_score"
);
CREATE INDEX "reputation_histories_risk_level_index" on "reputation_histories"(
  "risk_level"
);
CREATE TABLE IF NOT EXISTS "api_keys"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "name" varchar not null,
  "key" varchar not null,
  "secret_hash" text not null,
  "permissions" text,
  "last_used_at" datetime,
  "expires_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "api_keys_user_id_key_index" on "api_keys"("user_id", "key");
CREATE INDEX "api_keys_expires_at_index" on "api_keys"("expires_at");
CREATE UNIQUE INDEX "api_keys_key_unique" on "api_keys"("key");
CREATE TABLE IF NOT EXISTS "security_logs"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "event" varchar not null,
  "metadata" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "security_logs_user_id_event_index" on "security_logs"(
  "user_id",
  "event"
);
CREATE INDEX "security_logs_created_at_index" on "security_logs"("created_at");
CREATE TABLE IF NOT EXISTS "email_tracking"(
  "id" integer primary key autoincrement not null,
  "campaign_id" integer not null,
  "recipient_email" varchar not null,
  "email_id" varchar not null,
  "sent_at" datetime,
  "opened_at" datetime,
  "clicked_at" datetime,
  "bounced_at" datetime,
  "complained_at" datetime,
  "ip_address" varchar,
  "user_agent" text,
  "country" varchar,
  "city" varchar,
  "device_type" varchar,
  "browser" varchar,
  "os" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("campaign_id") references "campaigns"("id") on delete cascade
);
CREATE INDEX "email_tracking_campaign_id_sent_at_index" on "email_tracking"(
  "campaign_id",
  "sent_at"
);
CREATE INDEX "email_tracking_email_id_index" on "email_tracking"("email_id");
CREATE INDEX "email_tracking_recipient_email_index" on "email_tracking"(
  "recipient_email"
);
CREATE INDEX "email_tracking_opened_at_index" on "email_tracking"("opened_at");
CREATE INDEX "email_tracking_clicked_at_index" on "email_tracking"(
  "clicked_at"
);
CREATE INDEX "email_tracking_bounced_at_index" on "email_tracking"(
  "bounced_at"
);
CREATE INDEX "email_tracking_complained_at_index" on "email_tracking"(
  "complained_at"
);
CREATE UNIQUE INDEX "email_tracking_email_id_unique" on "email_tracking"(
  "email_id"
);
CREATE TABLE IF NOT EXISTS "click_tracking"(
  "id" integer primary key autoincrement not null,
  "email_tracking_id" integer not null,
  "link_id" varchar not null,
  "original_url" text not null,
  "ip_address" varchar,
  "user_agent" text,
  "country" varchar,
  "city" varchar,
  "device_type" varchar,
  "browser" varchar,
  "os" varchar,
  "clicked_at" datetime not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("email_tracking_id") references "email_tracking"("id") on delete cascade
);
CREATE INDEX "click_tracking_email_tracking_id_index" on "click_tracking"(
  "email_tracking_id"
);
CREATE INDEX "click_tracking_link_id_index" on "click_tracking"("link_id");
CREATE INDEX "click_tracking_clicked_at_index" on "click_tracking"(
  "clicked_at"
);
CREATE INDEX "click_tracking_ip_address_index" on "click_tracking"(
  "ip_address"
);
CREATE TABLE IF NOT EXISTS "suppression_lists"(
  "id" integer primary key autoincrement not null,
  "email" varchar not null,
  "type" varchar check("type" in('unsubscribe', 'fbl', 'bounce', 'complaint', 'manual')) not null default 'unsubscribe',
  "source" varchar,
  "reason" text,
  "metadata" text,
  "suppressed_at" datetime not null,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "suppression_lists_email_index" on "suppression_lists"("email");
CREATE INDEX "suppression_lists_type_index" on "suppression_lists"("type");
CREATE INDEX "suppression_lists_suppressed_at_index" on "suppression_lists"(
  "suppressed_at"
);
CREATE INDEX "suppression_lists_source_index" on "suppression_lists"("source");
CREATE UNIQUE INDEX "suppression_lists_email_unique" on "suppression_lists"(
  "email"
);
CREATE TABLE IF NOT EXISTS "bounce_processing_logs"(
  "id" integer primary key autoincrement not null,
  "domain_id" integer not null,
  "message_id" varchar,
  "from_email" varchar,
  "to_email" varchar,
  "bounce_reason" text,
  "bounce_type" varchar check("bounce_type" in('hard', 'soft', 'block', 'spam')) not null default 'hard',
  "status" varchar check("status" in('processed', 'failed', 'skipped')) not null default 'processed',
  "error_message" text,
  "raw_message" text,
  "processed_at" datetime not null default CURRENT_TIMESTAMP,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("domain_id") references "domains"("id") on delete cascade
);
CREATE INDEX "bounce_processing_logs_domain_id_processed_at_index" on "bounce_processing_logs"(
  "domain_id",
  "processed_at"
);
CREATE INDEX "bounce_processing_logs_to_email_bounce_type_index" on "bounce_processing_logs"(
  "to_email",
  "bounce_type"
);
CREATE TABLE IF NOT EXISTS "subscriptions"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "plan_name" varchar not null,
  "status" varchar not null default('active'),
  "starts_at" datetime not null,
  "ends_at" datetime not null,
  "payment_id" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "payment_method" varchar,
  "payment_amount" numeric,
  "payment_currency" varchar not null default 'USD',
  "payment_date" datetime,
  "payment_reference" varchar,
  "manual_payment_notes" text,
  "admin_user_id" integer,
  "last_extension_at" datetime,
  "last_extension_by" integer,
  foreign key("user_id") references users("id") on delete cascade on update no action,
  foreign key("admin_user_id") references "users"("id"),
  foreign key("last_extension_by") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "devices"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "device_id" varchar not null,
  "device_name" varchar not null,
  "ip_address" varchar not null,
  "last_seen" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  "trusted" tinyint(1) not null default '0',
  "trusted_at" datetime,
  "device_type" varchar,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "devices_user_id_device_id_index" on "devices"(
  "user_id",
  "device_id"
);
CREATE INDEX "devices_last_seen_index" on "devices"("last_seen");
CREATE UNIQUE INDEX "devices_device_id_unique" on "devices"("device_id");
CREATE TABLE IF NOT EXISTS "campaign_content"(
  "id" integer primary key autoincrement not null,
  "campaign_id" integer not null,
  "content_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("campaign_id") references "campaigns"("id") on delete cascade,
  foreign key("content_id") references "contents"("id") on delete cascade
);
CREATE UNIQUE INDEX "campaign_content_campaign_id_content_id_unique" on "campaign_content"(
  "campaign_id",
  "content_id"
);
CREATE TABLE IF NOT EXISTS "campaign_sender"(
  "id" integer primary key autoincrement not null,
  "campaign_id" integer not null,
  "sender_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("campaign_id") references "campaigns"("id") on delete cascade,
  foreign key("sender_id") references "senders"("id") on delete cascade
);
CREATE UNIQUE INDEX "campaign_sender_campaign_id_sender_id_unique" on "campaign_sender"(
  "campaign_id",
  "sender_id"
);
CREATE TABLE IF NOT EXISTS "personal_access_tokens"(
  "id" integer primary key autoincrement not null,
  "tokenable_type" varchar not null,
  "tokenable_id" integer not null,
  "name" text not null,
  "token" varchar not null,
  "abilities" text,
  "last_used_at" datetime,
  "expires_at" datetime,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" on "personal_access_tokens"(
  "tokenable_type",
  "tokenable_id"
);
CREATE UNIQUE INDEX "personal_access_tokens_token_unique" on "personal_access_tokens"(
  "token"
);
CREATE TABLE IF NOT EXISTS "system_configs"(
  "id" integer primary key autoincrement not null,
  "key" varchar not null,
  "value" text,
  "description" varchar,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "system_configs_key_unique" on "system_configs"("key");
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "password_resets"(
  "id" integer primary key autoincrement not null,
  "email" varchar not null,
  "token" varchar not null,
  "expires_at" datetime not null,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "password_resets_email_index" on "password_resets"("email");
CREATE UNIQUE INDEX "password_resets_token_unique" on "password_resets"(
  "token"
);
CREATE TABLE IF NOT EXISTS "notifications"(
  "id" varchar not null,
  "type" varchar not null,
  "notifiable_type" varchar not null,
  "notifiable_id" integer not null,
  "data" text not null,
  "read_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  primary key("id")
);
CREATE INDEX "notifications_notifiable_type_notifiable_id_index" on "notifications"(
  "notifiable_type",
  "notifiable_id"
);

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'0002_01_01_000001_add_username_to_users_table',1);
INSERT INTO migrations VALUES(5,'2025_01_14_000000_create_domains_table',1);
INSERT INTO migrations VALUES(6,'2025_01_14_000001_create_campaigns_table',1);
INSERT INTO migrations VALUES(7,'2025_01_14_000002_create_senders_table',1);
INSERT INTO migrations VALUES(8,'2025_01_14_000003_create_contents_table',1);
INSERT INTO migrations VALUES(9,'2025_01_15_000000_add_name_to_users_table',1);
INSERT INTO migrations VALUES(10,'2025_01_15_000000_create_reputation_histories_table',1);
INSERT INTO migrations VALUES(11,'2025_01_15_000001_add_monitoring_fields_to_domains_table',1);
INSERT INTO migrations VALUES(12,'2025_01_15_000002_create_api_keys_table',1);
INSERT INTO migrations VALUES(13,'2025_01_15_000003_create_security_logs_table',1);
INSERT INTO migrations VALUES(14,'2025_01_15_000007_create_email_tracking_table',1);
INSERT INTO migrations VALUES(15,'2025_01_15_000008_create_click_tracking_table',1);
INSERT INTO migrations VALUES(16,'2025_01_15_000009_create_suppression_lists_table',1);
INSERT INTO migrations VALUES(17,'2025_01_15_000012_create_bounce_processing_logs_table',1);
INSERT INTO migrations VALUES(18,'2025_07_12_123220_add_reputation_fields_to_domains_table',1);
INSERT INTO migrations VALUES(19,'2025_07_12_123221_add_bounce_processing_to_domains_table',1);
INSERT INTO migrations VALUES(20,'2025_07_12_123222_add_security_fields_to_users_table',1);
INSERT INTO migrations VALUES(21,'2025_07_12_123223_add_tracking_fields_to_campaigns_table',1);
INSERT INTO migrations VALUES(22,'2025_07_12_123224_add_template_variables_and_tracking_options_to_campaigns_table',1);
INSERT INTO migrations VALUES(23,'2025_07_12_123225_add_unsubscribe_file_fields_to_campaigns_table',1);
INSERT INTO migrations VALUES(24,'2025_07_12_123226_create_subscriptions_table',1);
INSERT INTO migrations VALUES(25,'2025_07_12_123227_add_manual_billing_fields_to_subscriptions_table',1);
INSERT INTO migrations VALUES(26,'2025_07_12_123630_create_permission_tables',1);
INSERT INTO migrations VALUES(27,'2025_07_12_130000_add_telegram_fields_to_users_table',1);
INSERT INTO migrations VALUES(28,'2025_07_12_135444_create_devices_table',1);
INSERT INTO migrations VALUES(29,'2025_07_12_141304_create_campaign_content_table',1);
INSERT INTO migrations VALUES(30,'2025_07_12_141508_create_campaign_sender_table',1);
INSERT INTO migrations VALUES(31,'2025_07_13_072237_drop_roles_and_permissions_tables',1);
INSERT INTO migrations VALUES(32,'2025_07_13_183149_create_personal_access_tokens_table',1);
INSERT INTO migrations VALUES(33,'2025_07_14_080824_create_system_configs_table',1);
INSERT INTO migrations VALUES(34,'2025_07_14_205246_create_sessions_table',1);
INSERT INTO migrations VALUES(35,'2025_07_15_213426_create_password_resets_table',2);
INSERT INTO migrations VALUES(36,'2025_07_15_220747_add_trusted_field_to_devices_table',3);
INSERT INTO migrations VALUES(37,'2025_07_16_120923_create_notifications_table',4);
