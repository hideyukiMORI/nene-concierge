<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSessionNodeEventsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('session_node_events')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('session_id', 'char', ['limit' => 36, 'null' => false])
            ->addColumn('scenario_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('node_id', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('entered_at', 'datetime', ['null' => false, 'precision' => 3])
            ->addColumn('exited_at', 'datetime', ['null' => true, 'default' => null, 'precision' => 3])
            ->addColumn('branch_taken', 'string', ['limit' => 64, 'null' => true, 'default' => null])
            ->addIndex(['organization_id'])
            ->addIndex(['session_id'])
            ->addIndex(['organization_id', 'scenario_id', 'node_id', 'entered_at'])
            ->create();
    }
}
