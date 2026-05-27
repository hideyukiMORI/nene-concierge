<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Session;

use NeNeConcierge\Session\SessionMessage;
use NeNeConcierge\Session\SessionMessageRepositoryInterface;

final class InMemorySessionMessageRepository implements SessionMessageRepositoryInterface
{
    /** @var list<SessionMessage> */
    private array $store = [];

    private int $nextId = 1;

    public function append(SessionMessage $message): void
    {
        $this->store[] = new SessionMessage(
            sessionId:      $message->sessionId,
            organizationId: $message->organizationId,
            role:           $message->role,
            content:        $message->content,
            createdAt:      $message->createdAt,
            nodeId:         $message->nodeId,
            id:             $this->nextId++,
        );
    }

    /** @return list<SessionMessage> */
    public function findBySession(string $sessionId, int $organizationId): array
    {
        $result = [];

        foreach ($this->store as $message) {
            if ($message->sessionId === $sessionId && $message->organizationId === $organizationId) {
                $result[] = $message;
            }
        }

        return $result;
    }
}
