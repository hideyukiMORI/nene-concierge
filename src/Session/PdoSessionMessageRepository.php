<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoSessionMessageRepository implements SessionMessageRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function append(SessionMessage $message): void
    {
        $this->query->insert(
            'INSERT INTO messages (organization_id, session_id, node_id, role, content, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())',
            [
                $message->organizationId,
                $message->sessionId,
                $message->nodeId,
                $message->role->value,
                $message->content,
            ],
        );
    }

    /** @return list<SessionMessage> */
    public function findBySession(string $sessionId, int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM messages WHERE session_id = ? AND organization_id = ? ORDER BY id ASC',
            [$sessionId, $organizationId],
        );

        return array_map($this->hydrate(...), $rows);
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): SessionMessage
    {
        return new SessionMessage(
            sessionId:      (string) $row['session_id'],
            organizationId: (int) $row['organization_id'],
            role:           MessageRole::from((string) $row['role']),
            content:        (string) $row['content'],
            createdAt:      (string) $row['created_at'],
            nodeId:         isset($row['node_id']) ? (string) $row['node_id'] : null,
            id:             isset($row['id']) ? (int) $row['id'] : null,
        );
    }
}
