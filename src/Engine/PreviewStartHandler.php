<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /api/v1/scenarios/{id}/preview/start
 *
 * Starts an admin preview session (outcome = 'preview').
 * Preview sessions are excluded from analytics queries.
 * Requires JWT Bearer + ManageScenarios capability.
 * Works on both draft and published scenarios.
 */
final readonly class PreviewStartHandler implements RequestHandlerInterface
{
    public function __construct(
        private ScenarioEngine      $engine,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $scenarioId = (int) Router::param($request, 'id');

        $result = $this->engine->start($scenarioId, $orgId, preview: true);

        return $this->response->create(
            [
                'session_id' => $result->sessionId,
                'node'       => $this->nodeToArray($result->node),
            ],
            201,
        );
    }

    /** @return array<string, mixed> */
    private function nodeToArray(NodeView $node): array
    {
        return [
            'node_id'     => $node->nodeId,
            'type'        => $node->type->value,
            'label'       => $node->label,
            'data'        => $node->data,
            'choices'     => array_map(
                static fn (ChoiceView $c): array => [
                    'target_node_id' => $c->targetNodeId,
                    'label'          => $c->label,
                ],
                $node->choices,
            ),
            'is_terminal' => $node->isTerminal,
        ];
    }
}
