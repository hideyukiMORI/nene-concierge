<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use NeNeConcierge\Scenario\ScenarioNodeType;

/**
 * The engine's outward-facing representation of a node after execution.
 *
 * Returned to the visitor via the HTTP response so the embed widget knows
 * what to render next, which choices are available, and whether the session
 * has ended.
 */
final readonly class NodeView
{
    /**
     * @param list<ChoiceView> $choices
     */
    public function __construct(
        public string           $nodeId,
        public ScenarioNodeType $type,
        public string           $label,
        /** @var array<string, mixed> */
        public array            $data,
        public array            $choices,
        public bool             $isTerminal,
    ) {
    }
}
