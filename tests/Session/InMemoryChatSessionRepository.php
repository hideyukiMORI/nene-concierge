<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Session;

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

    /** @return list<ChatSession> */
    public function listByOrganization(
        int     $organizationId,
        ?string $outcome       = null,
        ?bool   $hasConversion = null,
        ?int    $scenarioId    = null,
        int     $limit         = 50,
        int     $offset        = 0,
    ): array {
        $result = [];

        foreach ($this->store as $session) {
            if ($session->organizationId !== $organizationId) {
                continue;
            }

            if ($session->outcome->value === 'preview') {
                continue;
            }

            if ($outcome !== null && $session->outcome->value !== $outcome) {
                continue;
            }

            if ($hasConversion !== null && $session->hasConversion !== $hasConversion) {
                continue;
            }

            if ($scenarioId !== null && $session->scenarioId !== $scenarioId) {
                continue;
            }

            $result[] = $session;
        }

        /** @var list<ChatSession> */
        return array_slice($result, $offset, $limit);
    }

    public function countByOrganization(
        int     $organizationId,
        ?string $outcome       = null,
        ?bool   $hasConversion = null,
        ?int    $scenarioId    = null,
    ): int {
        return count($this->listByOrganization($organizationId, $outcome, $hasConversion, $scenarioId, PHP_INT_MAX, 0));
    }
}
