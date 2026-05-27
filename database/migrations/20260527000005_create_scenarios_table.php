<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateScenariosTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('scenarios')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('name', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('description', 'text', ['null' => true, 'default' => null])
            ->addColumn('status', 'enum', ['values' => ['draft', 'published'], 'null' => false, 'default' => 'draft'])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->create();
    }
}
