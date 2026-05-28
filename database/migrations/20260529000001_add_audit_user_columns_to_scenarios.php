<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAuditUserColumnsToScenarios extends AbstractMigration
{
    public function change(): void
    {
        $this->table('scenarios')
            ->addColumn('created_by_user_id', 'integer', ['null' => true, 'signed' => false, 'default' => null, 'after' => 'status'])
            ->addColumn('updated_by_user_id', 'integer', ['null' => true, 'signed' => false, 'default' => null, 'after' => 'created_by_user_id'])
            ->update();
    }
}
