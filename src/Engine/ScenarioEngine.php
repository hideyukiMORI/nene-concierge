<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioEdgeRepositoryInterface;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeRepositoryInterface;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioRepositoryInterface;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Session\ChatSession;
use NeNeConcierge\Session\ChatSessionRepositoryInterface;
use NeNeConcierge\Session\SessionNodeEvent;
use NeNeConcierge\Session\SessionNodeEventRepositoryInterface;
use NeNeConcierge\Session\SessionOutcome;

/**
 * Scenario execution state machine.
 *
 * Start node detection: the node with no incoming edges (no explicit start_node_id column).
 * Phase 1 supports: message + end node types only.
 */
final readonly class ScenarioEngine
{
    public function __construct(
        private ScenarioRepositoryInterface         $scenarios,
        private ScenarioNodeRepositoryInterface     $nodes,
        private ScenarioEdgeRepositoryInterface     $edges,
        private ChatSessionRepositoryInterface      $sessions,
        private SessionNodeEventRepositoryInterface $events,
    ) {
    }

    /**
     * Start a new session for the given published scenario.
     *
     * @throws EngineException
     */
    public function start(int $scenarioId, int $organizationId): StartSessionResult
    {
        $scenario = $this->scenarios->findById($scenarioId, $organizationId);

        if ($scenario === null) {
            throw new EngineException("Scenario {$scenarioId} not found.");
        }

        if ($scenario->status !== ScenarioStatus::Published) {
            throw new EngineException("Scenario {$scenarioId} is not published.");
        }

        $allNodes = $this->nodes->findByScenario($scenarioId, $organizationId);
        $allEdges = $this->edges->findByScenario($scenarioId, $organizationId);

        if ($allNodes === []) {
            throw new EngineException("Scenario {$scenarioId} has no nodes.");
        }

        $startNode = $this->findStartNode($allNodes, $allEdges);

        $sessionId = $this->generateUuid();
        $now       = date('Y-m-d H:i:s');

        $session = new ChatSession(
            id:             $sessionId,
            organizationId: $organizationId,
            scenarioId:     $scenarioId,
            currentNodeId:  $startNode->nodeId,
            outcome:        SessionOutcome::Active,
            hasConversion:  false,
            startedAt:      $now,
        );

        $this->sessions->save($session);

        $nodeView = $this->buildNodeView($startNode, $allEdges, $startNode->type === ScenarioNodeType::End);

        $this->recordEnter($sessionId, $organizationId, $scenarioId, $startNode->nodeId, $now, $nodeView->isTerminal);

        if ($nodeView->isTerminal) {
            $this->closeSession($session, SessionOutcome::Completed, $now);
        }

        return new StartSessionResult($sessionId, $nodeView);
    }

    /**
     * Advance the session to the next node by following an edge (choice).
     *
     * @throws EngineException
     */
    public function step(string $sessionId, int $organizationId, string $chosenEdgeTarget): StepSessionResult
    {
        $session = $this->sessions->findById($sessionId, $organizationId);

        if ($session === null) {
            throw new EngineException("Session {$sessionId} not found.");
        }

        if ($session->outcome !== SessionOutcome::Active) {
            throw new EngineException("Session {$sessionId} is no longer active.");
        }

        $currentNodeId = $session->currentNodeId;

        if ($currentNodeId === null) {
            throw new EngineException("Session {$sessionId} has no current node.");
        }

        // Validate the chosen target is a real outgoing edge
        $outgoing = $this->edges->findOutgoingEdges($currentNodeId, $session->scenarioId, $organizationId);
        $edge     = $this->findEdgeByTarget($outgoing, $chosenEdgeTarget);

        if ($edge === null) {
            throw new EngineException("No edge from '{$currentNodeId}' to '{$chosenEdgeTarget}'.");
        }

        $nextNode = $this->nodes->findByNodeId($chosenEdgeTarget, $session->scenarioId, $organizationId);

        if ($nextNode === null) {
            throw new EngineException("Node '{$chosenEdgeTarget}' not found in scenario {$session->scenarioId}.");
        }

        $now          = date('Y-m-d H:i:s.v');
        $allEdges     = $this->edges->findByScenario($session->scenarioId, $organizationId);
        $nodeView     = $this->buildNodeView($nextNode, $allEdges, $nextNode->type === ScenarioNodeType::End);
        $finalOutcome = $nodeView->isTerminal ? SessionOutcome::Completed : SessionOutcome::Active;

        $updatedSession = new ChatSession(
            id:             $sessionId,
            organizationId: $organizationId,
            scenarioId:     $session->scenarioId,
            currentNodeId:  $nextNode->nodeId,
            outcome:        $finalOutcome,
            hasConversion:  $session->hasConversion,
            startedAt:      $session->startedAt,
            endedAt:        $nodeView->isTerminal ? date('Y-m-d H:i:s') : null,
        );

        $this->sessions->update($updatedSession);

        $this->recordEnter($sessionId, $organizationId, $session->scenarioId, $nextNode->nodeId, $now, $nodeView->isTerminal);

        return new StepSessionResult($nodeView, $finalOutcome);
    }

    /**
     * Find the start node: the node with no incoming edges.
     *
     * @param list<ScenarioNode> $nodes
     * @param list<ScenarioEdge> $edges
     *
     * @throws EngineException
     */
    private function findStartNode(array $nodes, array $edges): ScenarioNode
    {
        $targetNodeIds = array_map(static fn (ScenarioEdge $e) => $e->targetNodeId, $edges);
        $targetSet     = array_flip($targetNodeIds);

        foreach ($nodes as $node) {
            if (!isset($targetSet[$node->nodeId])) {
                return $node;
            }
        }

        throw new EngineException('No start node found (all nodes have incoming edges — possible cycle).');
    }

    /**
     * @param list<ScenarioEdge> $allEdges
     */
    private function buildNodeView(ScenarioNode $node, array $allEdges, bool $isTerminal): NodeView
    {
        $outgoing = array_filter($allEdges, static fn (ScenarioEdge $e) => $e->sourceNodeId === $node->nodeId);
        $choices  = array_values(array_map(
            static fn (ScenarioEdge $e) => new ChoiceView($e->targetNodeId, $e->label),
            $outgoing,
        ));

        return new NodeView(
            nodeId:     $node->nodeId,
            type:       $node->type,
            label:      $node->label,
            data:       $node->data,
            choices:    $choices,
            isTerminal: $isTerminal,
        );
    }

    /**
     * @param list<ScenarioEdge> $outgoing
     */
    private function findEdgeByTarget(array $outgoing, string $target): ?ScenarioEdge
    {
        foreach ($outgoing as $edge) {
            if ($edge->targetNodeId === $target) {
                return $edge;
            }
        }

        return null;
    }

    private function recordEnter(
        string $sessionId,
        int    $organizationId,
        int    $scenarioId,
        string $nodeId,
        string $enteredAt,
        bool   $isTerminal,
    ): void {
        // End nodes record exited_at immediately (not a drop-off)
        $exitedAt = $isTerminal ? date('Y-m-d H:i:s.v') : null;

        $this->events->record(new SessionNodeEvent(
            sessionId:      $sessionId,
            organizationId: $organizationId,
            scenarioId:     $scenarioId,
            nodeId:         $nodeId,
            enteredAt:      $enteredAt,
            exitedAt:       $exitedAt,
        ));
    }

    private function generateUuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // version 4
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // variant RFC 4122

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }

    private function closeSession(ChatSession $session, SessionOutcome $outcome, string $now): void
    {
        $closed = new ChatSession(
            id:             $session->id,
            organizationId: $session->organizationId,
            scenarioId:     $session->scenarioId,
            currentNodeId:  $session->currentNodeId,
            outcome:        $outcome,
            hasConversion:  $session->hasConversion,
            startedAt:      $session->startedAt,
            endedAt:        $now,
        );

        $this->sessions->update($closed);
    }
}
