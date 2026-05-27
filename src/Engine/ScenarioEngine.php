<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use NeNeConcierge\Action\ActionDispatcher;
use NeNeConcierge\Action\ActionException;
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
 * Supported node types: message, condition, action, end.
 *
 * Condition nodes:
 *   - data_json contains {conditions: [...], match: "all"|"any"}
 *   - Engine evaluates against session variables
 *   - The first matching outgoing edge is followed automatically
 *   - branch_taken is recorded in session_node_events
 *
 * Variable collection:
 *   - message nodes with data.collect_variable set receive the visitor's
 *     answer (passed in StepSessionHandler) and store it in sessions.variables_json
 *
 * Variable interpolation:
 *   - {{variable_name}} in node labels is expanded before returning NodeView
 */
final readonly class ScenarioEngine
{
    public function __construct(
        private ScenarioRepositoryInterface         $scenarios,
        private ScenarioNodeRepositoryInterface     $nodes,
        private ScenarioEdgeRepositoryInterface     $edges,
        private ChatSessionRepositoryInterface      $sessions,
        private SessionNodeEventRepositoryInterface $events,
        private ConditionEvaluator                  $conditionEvaluator,
        private VariableInterpolator                $interpolator,
        private ActionDispatcher                    $actionDispatcher,
    ) {
    }

    /**
     * Start a new session for the given published scenario.
     *
     * @param bool $preview When true, creates a preview session (outcome = Preview, excluded from analytics)
     *
     * @throws EngineException
     */
    public function start(int $scenarioId, int $organizationId, bool $preview = false): StartSessionResult
    {
        $scenario = $this->scenarios->findById($scenarioId, $organizationId);

        if ($scenario === null) {
            throw new EngineException("Scenario {$scenarioId} not found.");
        }

        if (!$preview && $scenario->status !== ScenarioStatus::Published) {
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
        $outcome   = $preview ? SessionOutcome::Preview : SessionOutcome::Active;

        $session = new ChatSession(
            id:             $sessionId,
            organizationId: $organizationId,
            scenarioId:     $scenarioId,
            currentNodeId:  $startNode->nodeId,
            outcome:        $outcome,
            hasConversion:  false,
            startedAt:      $now,
        );

        $this->sessions->save($session);

        $nodeView = $this->buildNodeView($startNode, $allEdges, [], null);

        $this->recordEnter($sessionId, $organizationId, $scenarioId, $startNode->nodeId, $now, $nodeView->isTerminal, null);

        if ($nodeView->isTerminal && $outcome !== SessionOutcome::Preview) {
            $this->closeSession($session, SessionOutcome::Completed, $now);
        }

        return new StartSessionResult($sessionId, $nodeView);
    }

    /**
     * Advance the session to the next node.
     *
     * For message nodes with data.collect_variable set, $answer is stored
     * as a session variable keyed by data.collect_variable.
     *
     * For condition nodes, the engine automatically selects the first matching
     * edge regardless of $chosenEdgeTarget (which should be empty).
     *
     * @throws EngineException
     */
    public function step(
        string  $sessionId,
        int     $organizationId,
        string  $chosenEdgeTarget,
        ?string $answer = null,
    ): StepSessionResult {
        $session = $this->sessions->findById($sessionId, $organizationId);

        if ($session === null) {
            throw new EngineException("Session {$sessionId} not found.");
        }

        if ($session->outcome !== SessionOutcome::Active && $session->outcome !== SessionOutcome::Preview) {
            throw new EngineException("Session {$sessionId} is no longer active.");
        }

        $currentNodeId = $session->currentNodeId;

        if ($currentNodeId === null) {
            throw new EngineException("Session {$sessionId} has no current node.");
        }

        $currentNode = $this->nodes->findByNodeId($currentNodeId, $session->scenarioId, $organizationId);

        if ($currentNode === null) {
            throw new EngineException("Current node '{$currentNodeId}' not found in scenario {$session->scenarioId}.");
        }

        // Collect variable from answer if this node has collect_variable set
        $variables = $session->variables;

        if ($answer !== null && isset($currentNode->data['collect_variable'])) {
            $varName             = (string) $currentNode->data['collect_variable'];
            $variables[$varName] = $answer;
        }

        // Determine next node
        $outgoing = $this->edges->findOutgoingEdges($currentNodeId, $session->scenarioId, $organizationId);

        [$nextNodeId, $branchTaken] = $this->resolveNextNode(
            $currentNode,
            $outgoing,
            $chosenEdgeTarget,
            $variables,
        );

        $nextNode = $this->nodes->findByNodeId($nextNodeId, $session->scenarioId, $organizationId);

        if ($nextNode === null) {
            throw new EngineException("Node '{$nextNodeId}' not found in scenario {$session->scenarioId}.");
        }

        $now      = date('Y-m-d H:i:s.v');
        $allEdges = $this->edges->findByScenario($session->scenarioId, $organizationId);
        $nodeView = $this->buildNodeView($nextNode, $allEdges, $variables, $branchTaken);

        $isPreview    = $session->outcome === SessionOutcome::Preview;
        $hasConversion = $session->hasConversion;

        // Execute action node synchronously; set has_conversion on success
        if ($nextNode->type === ScenarioNodeType::Action && !$isPreview) {
            try {
                $this->actionDispatcher->dispatch(
                    $nextNode->data,
                    $organizationId,
                    $sessionId,
                    $session->scenarioId,
                    $nextNode->nodeId,
                );
                $hasConversion = true;
            } catch (ActionException) {
                // Action failed — logged by dispatcher; session continues
            }
        }

        $finalOutcome = match (true) {
            $isPreview            => SessionOutcome::Preview,
            $nodeView->isTerminal => SessionOutcome::Completed,
            default               => SessionOutcome::Active,
        };

        $updatedSession = new ChatSession(
            id:             $sessionId,
            organizationId: $organizationId,
            scenarioId:     $session->scenarioId,
            currentNodeId:  $nextNode->nodeId,
            outcome:        $finalOutcome,
            hasConversion:  $hasConversion,
            startedAt:      $session->startedAt,
            variables:      $variables,
            endedAt:        ($nodeView->isTerminal && !$isPreview) ? date('Y-m-d H:i:s') : null,
        );

        $this->sessions->update($updatedSession);

        $this->recordEnter($sessionId, $organizationId, $session->scenarioId, $nextNode->nodeId, $now, $nodeView->isTerminal, $branchTaken);

        return new StepSessionResult($nodeView, $finalOutcome);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolve the next node ID and the branch label taken.
     *
     * For condition nodes: evaluate conditions → follow first matching edge.
     * For message/end nodes: validate the chosen edge target.
     *
     * @param list<ScenarioEdge>    $outgoing
     * @param array<string, string> $variables
     *
     * @return array{string, string|null}  [nextNodeId, branchTaken|null]
     *
     * @throws EngineException
     */
    private function resolveNextNode(
        ScenarioNode $currentNode,
        array        $outgoing,
        string       $chosenEdgeTarget,
        array        $variables,
    ): array {
        if ($currentNode->type === ScenarioNodeType::Condition) {
            return $this->resolveConditionBranch($currentNode, $outgoing, $variables);
        }

        // action nodes auto-follow their single outgoing edge
        if ($currentNode->type === ScenarioNodeType::Action && $outgoing !== []) {
            $edge = $outgoing[0];

            return [$edge->targetNodeId, null];
        }

        // message / end: validate chosen target
        $edge = $this->findEdgeByTarget($outgoing, $chosenEdgeTarget);

        if ($edge === null) {
            throw new EngineException("No edge from '{$currentNode->nodeId}' to '{$chosenEdgeTarget}'.");
        }

        return [$edge->targetNodeId, null];
    }

    /**
     * @param list<ScenarioEdge>    $outgoing
     * @param array<string, string> $variables
     *
     * @return array{string, string|null}
     *
     * @throws EngineException
     */
    private function resolveConditionBranch(
        ScenarioNode $node,
        array        $outgoing,
        array        $variables,
    ): array {
        // Try each outgoing edge in order; the first whose label condition matches wins.
        // Edge labels on condition nodes name the branch ("yes", "no", "default", …).
        // For a two-branch condition the convention is:
        //   edge label "true"/"yes"  → condition met
        //   edge label "false"/"no"  → fallback
        // The engine checks each edge whose label is NOT "false"/"no"/"default" first,
        // then falls back to one of those.

        $mainEdges     = [];
        $fallbackEdges = [];

        foreach ($outgoing as $edge) {
            if (in_array($edge->label, ['false', 'no', 'default', null], true)) {
                $fallbackEdges[] = $edge;
            } else {
                $mainEdges[] = $edge;
            }
        }

        // Evaluate condition against variables
        $conditionMet = $this->conditionEvaluator->evaluate($node->data, $variables);

        if ($conditionMet && $mainEdges !== []) {
            $edge = $mainEdges[0];

            return [$edge->targetNodeId, $edge->label ?? 'true'];
        }

        if ($fallbackEdges !== []) {
            $edge = $fallbackEdges[0];

            return [$edge->targetNodeId, $edge->label ?? 'false'];
        }

        throw new EngineException("Condition node '{$node->nodeId}' has no matching outgoing edge.");
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
     * @param list<ScenarioEdge>    $allEdges
     * @param array<string, string> $variables
     */
    private function buildNodeView(
        ScenarioNode $node,
        array        $allEdges,
        array        $variables,
        ?string      $branchTaken,
    ): NodeView {
        $isTerminal = $node->type === ScenarioNodeType::End;
        $outgoing   = array_filter($allEdges, static fn (ScenarioEdge $e) => $e->sourceNodeId === $node->nodeId);

        $choices = array_values(array_map(
            static fn (ScenarioEdge $e) => new ChoiceView($e->targetNodeId, $e->label),
            $outgoing,
        ));

        // Interpolate {{variable_name}} in the label
        $label = $this->interpolator->interpolate($node->label, $variables);

        return new NodeView(
            nodeId:     $node->nodeId,
            type:       $node->type,
            label:      $label,
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
        string  $sessionId,
        int     $organizationId,
        int     $scenarioId,
        string  $nodeId,
        string  $enteredAt,
        bool    $isTerminal,
        ?string $branchTaken,
    ): void {
        $exitedAt = $isTerminal ? date('Y-m-d H:i:s.v') : null;

        $this->events->record(new SessionNodeEvent(
            sessionId:      $sessionId,
            organizationId: $organizationId,
            scenarioId:     $scenarioId,
            nodeId:         $nodeId,
            enteredAt:      $enteredAt,
            exitedAt:       $exitedAt,
            branchTaken:    $branchTaken,
        ));
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
            variables:      $session->variables,
            endedAt:        $now,
        );

        $this->sessions->update($closed);
    }

    private function generateUuid(): string
    {
        $bytes    = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
