<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Removed - we don't want single sender_id and content_id
        // We'll use the existing sender_ids and content_ids arrays
    }

    public function down(): void
    {
        // No changes to revert
    }
};
