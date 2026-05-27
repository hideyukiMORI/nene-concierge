<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateEdgesTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('edges')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('scenario_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('source_node_id', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('target_node_id', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('label', 'string', ['limit' => 255, 'null' => false, 'default' => ''])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id', 'scenario_id'])
            ->create();
    }
}
