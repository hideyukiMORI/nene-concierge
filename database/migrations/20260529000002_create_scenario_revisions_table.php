<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateScenarioRevisionsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('scenario_revisions')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('scenario_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('revision_no', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('user_id', 'integer', ['null' => true, 'signed' => false, 'default' => null])
            ->addColumn('user_email', 'string', ['limit' => 255, 'null' => true, 'default' => null])
            ->addColumn('operation', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('name', 'string', ['limit' => 255, 'null' => true, 'default' => null])
            ->addColumn('description', 'text', ['null' => true, 'default' => null])
            ->addColumn('status', 'string', ['limit' => 32, 'null' => true, 'default' => null])
            ->addColumn('node_count', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('edge_count', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('snapshot_json', 'text', ['null' => true, 'limit' => \Phinx\Db\Adapter\MysqlAdapter::TEXT_LONG, 'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addIndex(['scenario_id', 'revision_no'])
            ->addIndex(['organization_id', 'scenario_id'])
            ->create();
    }
}
