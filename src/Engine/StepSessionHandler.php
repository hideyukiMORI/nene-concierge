<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /api/v1/public/sessions/{session_id}/step
 *
 * Advances a visitor's session by choosing an edge.
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
        $sessionId = (string) $request->getAttribute('session_id', '');
        $body      = JsonRequestBodyParser::parse($request);

        $errors         = [];
        $chosenTarget   = trim((string) ($body['target_node_id'] ?? ''));

        if ($chosenTarget === '') {
            $errors[] = new ValidationError('target_node_id', 'target_node_id is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $result = $this->engine->step($sessionId, $orgId, $chosenTarget);

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
