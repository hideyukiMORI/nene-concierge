<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /api/v1/public/sessions/{session_id}/step
 *
 * Advances a visitor's session by choosing an edge.
 * For condition nodes, target_node_id is not required (the engine
 * evaluates conditions automatically); pass an empty string or omit it.
 * Public endpoint — no JWT required.
 */
final readonly class StepSessionHandler implements RequestHandlerInterface
{
    public function __construct(
        private ScenarioEngine      $engine,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId     = (int) $request->getAttribute('nene2.org.id', 0);
        $sessionId = (string) Router::param($request, 'session_id');
        $body      = JsonRequestBodyParser::parse($request);

        $errors         = [];
        $chosenTarget   = trim((string) ($body['target_node_id'] ?? ''));
        $answer         = isset($body['answer']) && $body['answer'] !== '' ? (string) $body['answer'] : null;

        // target_node_id is required for message nodes; condition nodes auto-route
        // Validation deferred — engine throws EngineException if target is invalid for a message node
        if ($chosenTarget === '' && $answer === null) {
            $errors[] = new ValidationError('target_node_id', 'target_node_id is required for non-condition nodes.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

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
