<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /api/v1/public/sessions
 *
 * Starts a new visitor chat session for the resolved scenario.
 * This is a public endpoint (no JWT required); org resolution
 * still runs via OrgResolverMiddleware.
 */
final readonly class StartSessionHandler implements RequestHandlerInterface
{
    public function __construct(
        private ScenarioEngine      $engine,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $body       = (array) ($request->getParsedBody() ?? []);
        $scenarioId = (int) ($body['scenario_id'] ?? 0);

        if ($scenarioId === 0) {
            // Try query param fallback
            $params     = $request->getQueryParams();
            $scenarioId = (int) ($params['scenario_id'] ?? 0);
        }

        $result = $this->engine->start($scenarioId, $orgId);

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
