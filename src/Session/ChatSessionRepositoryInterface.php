<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

interface ChatSessionRepositoryInterface
{
    public function findById(string $id, int $organizationId): ?ChatSession;

    public function save(ChatSession $session): void;

    public function update(ChatSession $session): void;

    /**
     * List sessions for an organization (preview sessions excluded).
     *
     * @return list<ChatSession>
     */
    public function listByOrganization(
        int     $organizationId,
        ?string $outcome       = null,
        ?bool   $hasConversion = null,
        ?int    $scenarioId    = null,
        int     $limit         = 50,
        int     $offset        = 0,
    ): array;

    public function countByOrganization(
        int     $organizationId,
        ?string $outcome       = null,
        ?bool   $hasConversion = null,
        ?int    $scenarioId    = null,
    ): int;
}
