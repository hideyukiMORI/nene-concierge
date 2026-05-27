<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateMessagesTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('messages')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('session_id', 'char', ['limit' => 36, 'null' => false])
            ->addColumn('node_id', 'string', ['limit' => 64, 'null' => true, 'default' => null])
            ->addColumn('role', 'enum', ['values' => ['bot', 'visitor'], 'null' => false, 'default' => 'bot'])
            ->addColumn('content', 'text', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addIndex(['session_id'])
            ->create();
    }
}
