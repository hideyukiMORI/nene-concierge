<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAppearancesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('appearances');
        $table
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('color_primary', 'string', ['limit' => 7,   'null' => false, 'default' => '#2563eb'])
            ->addColumn('color_secondary', 'string', ['limit' => 7,   'null' => false, 'default' => '#ffffff'])
            ->addColumn('position', 'enum', [
                'values'  => ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
                'null'    => false,
                'default' => 'bottom-right',
            ])
            ->addColumn('trigger_type', 'enum', [
                'values'  => ['page_load', 'scroll', 'exit_intent', 'manual'],
                'null'    => false,
                'default' => 'page_load',
            ])
            ->addColumn('icon_url', 'string', ['limit' => 512, 'null' => true,  'default' => null])
            ->addColumn('welcome_text', 'string', ['limit' => 255, 'null' => true,  'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addIndex(['organization_id'], ['unique' => true])
            ->addForeignKey('organization_id', 'organizations', 'id', ['delete' => 'CASCADE', 'update' => 'NO_ACTION'])
            ->create();
    }
}
