<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Session\SessionNodeEvent;
use NeNeConcierge\Session\SessionNodeEventRepositoryInterface;

final class InMemorySessionNodeEventRepository implements SessionNodeEventRepositoryInterface
{
    /** @var list<SessionNodeEvent> */
    private array $store = [];

    public function record(SessionNodeEvent $event): void
    {
        $this->store[] = $event;
    }

    /** @return list<SessionNodeEvent> */
    public function findBySession(string $sessionId, int $organizationId): array
    {
        return array_values(array_filter(
            $this->store,
            static fn (SessionNodeEvent $e) => $e->sessionId === $sessionId && $e->organizationId === $organizationId,
        ));
    }
}
