<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

interface SessionNodeEventRepositoryInterface
{
    public function record(SessionNodeEvent $event): void;

    /** @return list<SessionNodeEvent> */
    public function findBySession(string $sessionId, int $organizationId): array;
}
