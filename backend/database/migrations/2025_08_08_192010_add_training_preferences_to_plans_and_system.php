<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Intentional no-op — training preferences are stored in system_configs table, not plans_and_system
    }

    public function down(): void
    {
        // No-op
    }
};
