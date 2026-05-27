<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSessionsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('sessions', ['id' => false, 'primary_key' => 'id'])
            ->addColumn('id', 'char', ['limit' => 36, 'null' => false])
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('scenario_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('current_node_id', 'string', ['limit' => 64, 'null' => true, 'default' => null])
            ->addColumn('outcome', 'enum', [
                'values' => ['active', 'completed', 'dropped', 'converted'],
                'null' => false,
                'default' => 'active',
            ])
            ->addColumn('has_conversion', 'boolean', ['null' => false, 'default' => false])
            ->addColumn('started_at', 'datetime', ['null' => false])
            ->addColumn('ended_at', 'datetime', ['null' => true, 'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->addIndex(['scenario_id'])
            ->create();
    }
}
