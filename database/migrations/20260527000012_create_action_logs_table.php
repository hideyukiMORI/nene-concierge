<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Records every action node execution attempt.
 *
 * status: 'success' | 'failure'
 * adapter: 'http' | 'email' | 'slack' | 'chatwork'
 * error_message is populated on failure.
 */
final class CreateActionLogsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('action_logs')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('session_id', 'char', ['limit' => 36, 'null' => false])
            ->addColumn('scenario_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('node_id', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('adapter', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('status', 'enum', ['values' => ['success', 'failure'], 'null' => false])
            ->addColumn('error_message', 'text', ['null' => true, 'default' => null])
            ->addColumn('executed_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->addIndex(['session_id'])
            ->addIndex(['organization_id', 'scenario_id', 'executed_at'])
            ->create();
    }
}
