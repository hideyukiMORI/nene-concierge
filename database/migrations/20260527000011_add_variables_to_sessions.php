<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Adds session variable storage and 'preview' outcome to the sessions table.
 *
 * variables_json stores key-value pairs collected from visitor answers
 * at message nodes with data.collect_variable set.
 *
 * 'preview' outcome marks admin-driven preview sessions that are ephemeral
 * and excluded from analytics queries.
 */
final class AddVariablesToSessions extends AbstractMigration
{
    public function up(): void
    {
        $this->table('sessions')
            ->addColumn('variables_json', 'text', ['null' => false, 'default' => '{}', 'after' => 'has_conversion'])
            ->save();

        // Extend the outcome enum to include 'preview'
        $this->execute(
            "ALTER TABLE sessions MODIFY COLUMN outcome ENUM('active','completed','dropped','converted','preview') NOT NULL DEFAULT 'active'"
        );
    }

    public function down(): void
    {
        $this->table('sessions')
            ->removeColumn('variables_json')
            ->save();

        $this->execute(
            "ALTER TABLE sessions MODIFY COLUMN outcome ENUM('active','completed','dropped','converted') NOT NULL DEFAULT 'active'"
        );
    }
}
