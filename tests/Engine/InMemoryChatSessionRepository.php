<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Session\ChatSession;
use NeNeConcierge\Session\ChatSessionRepositoryInterface;

final class InMemoryChatSessionRepository implements ChatSessionRepositoryInterface
{
    /** @var array<string, ChatSession> */
    private array $store = [];

    public function findById(string $id, int $organizationId): ?ChatSession
    {
        $session = $this->store[$id] ?? null;

        if ($session === null || $session->organizationId !== $organizationId) {
            return null;
        }

        return $session;
    }

    public function save(ChatSession $session): void
    {
        $this->store[$session->id] = $session;
    }

    public function update(ChatSession $session): void
    {
        $this->store[$session->id] = $session;
    }
}
