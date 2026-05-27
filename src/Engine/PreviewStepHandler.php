<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /api/v1/scenarios/{id}/preview/step/{session_id}
 *
 * Advances an admin preview session.
 * Requires JWT Bearer + ManageScenarios capability.
 */
final readonly class PreviewStepHandler implements RequestHandlerInterface
{
    public function __construct(
        private ScenarioEngine      $engine,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId     = (int) $request->getAttribute('nene2.org.id', 0);
        $sessionId = (string) $request->getAttribute('session_id', '');
        $body      = JsonRequestBodyParser::parse($request);

        $chosenTarget = trim((string) ($body['target_node_id'] ?? ''));
        $answer       = isset($body['answer']) && $body['answer'] !== '' ? (string) $body['answer'] : null;

        $result = $this->engine->step($sessionId, $orgId, $chosenTarget, $answer);

        return $this->response->create([
            'outcome' => $result->outcome->value,
            'node'    => $this->nodeToArray($result->node),
        ]);
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
