<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

interface ActionLogRepositoryInterface
{
    public function append(ActionLog $log): void;

    /** @return list<ActionLog> */
    public function findBySession(string $sessionId, int $organizationId): array;

    /**
     * List action logs for an organization with optional filters.
     *
     * @return list<ActionLog>
     */
    public function listByOrganization(
        int     $organizationId,
        ?string $adapter    = null,
        ?string $status     = null,
        ?int    $scenarioId = null,
        int     $limit      = 50,
        int     $offset     = 0,
    ): array;

    public function countByOrganization(
        int     $organizationId,
        ?string $adapter    = null,
        ?string $status     = null,
        ?int    $scenarioId = null,
    ): int;
}
