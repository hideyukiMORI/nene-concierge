<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

/**
 * Records a visitor's entry and exit from a single node during a session.
 *
 * Used for both canvas heatmap analytics and MCP tool context retrieval (ADR 0005).
 * Millisecond-precision timestamps (DATETIME(3)) are stored as strings.
 * A null exited_at indicates the visitor is currently at this node or dropped off here.
 */
final readonly class SessionNodeEvent
{
    public function __construct(
        public string  $sessionId,
        public int     $organizationId,
        public int     $scenarioId,
        public string  $nodeId,
        public string  $enteredAt,
        public ?string $exitedAt     = null,
        public ?string $branchTaken  = null,
        public ?int    $id           = null,
    ) {
    }
}
