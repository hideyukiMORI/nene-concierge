<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateNodesTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('nodes')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('scenario_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('node_id', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('type', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('label', 'string', ['limit' => 255, 'null' => false, 'default' => ''])
            ->addColumn('data_json', 'text', ['null' => true, 'default' => null])
            ->addColumn('position_x', 'float', ['null' => false, 'default' => 0])
            ->addColumn('position_y', 'float', ['null' => false, 'default' => 0])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['scenario_id', 'node_id'], ['unique' => true])
            ->addIndex(['organization_id', 'scenario_id'])
            ->create();
    }
}
