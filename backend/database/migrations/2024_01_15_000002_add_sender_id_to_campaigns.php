<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // No-op: This migration is intentionally left blank.
        // Sender/content shuffling uses sender_ids/content_ids arrays and pivot tables.
    }

    public function down(): void
    {
        // No-op: Nothing to revert.
    }
};

