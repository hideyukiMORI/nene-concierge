<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * PUT /api/v1/scenarios/{id}/graph
 *
 * Replaces the entire node/edge graph for a scenario.
 * Returns 204 No Content on success.
 */
final readonly class SaveScenarioGraphHandler implements RequestHandlerInterface
{
    public function __construct(
        private SaveScenarioGraphUseCase $useCase,
        private JsonResponseFactory      $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $scenarioId = (int) $request->getAttribute('id', 0);

        /** @var array<string, mixed> $body */
        $body  = (array) $request->getParsedBody();
        $errors = [];

        // ── nodes ──────────────────────────────────────────────────────────────
        $rawNodes = isset($body['nodes']) && is_array($body['nodes']) ? $body['nodes'] : [];
        $nodeInputs = [];

        foreach ($rawNodes as $i => $raw) {
            if (!is_array($raw)) {
                $errors[] = new ValidationError("nodes.{$i}", 'Must be an object.', 'invalid');
                continue;
            }

            $nodeId = isset($raw['node_id']) ? (string) $raw['node_id'] : '';
            if ($nodeId === '') {
                $errors[] = new ValidationError("nodes.{$i}.node_id", 'Required.', 'required');
            }

            $typeRaw = isset($raw['type']) ? (string) $raw['type'] : '';
            $type    = ScenarioNodeType::tryFrom($typeRaw);
            if ($type === null) {
                $errors[] = new ValidationError(
                    "nodes.{$i}.type",
                    'Must be one of: message, condition, action, end.',
                    'invalid',
                );
                $type = ScenarioNodeType::Message; // never used; silence PHPStan
            }

            $label = isset($raw['label']) ? (string) $raw['label'] : '';
            $data  = isset($raw['data']) && is_array($raw['data']) ? $raw['data'] : [];
            $posX  = isset($raw['position_x']) ? (float) $raw['position_x'] : 0.0;
            $posY  = isset($raw['position_y']) ? (float) $raw['position_y'] : 0.0;

            if ($errors === []) {
                $nodeInputs[] = new SaveScenarioGraphNodeInput(
                    nodeId:    $nodeId,
                    type:      $type,
                    label:     $label,
                    data:      $data,
                    positionX: $posX,
                    positionY: $posY,
                );
            }
        }

        // ── edges ──────────────────────────────────────────────────────────────
        $rawEdges = isset($body['edges']) && is_array($body['edges']) ? $body['edges'] : [];
        $edgeInputs = [];

        foreach ($rawEdges as $i => $raw) {
            if (!is_array($raw)) {
                $errors[] = new ValidationError("edges.{$i}", 'Must be an object.', 'invalid');
                continue;
            }

            $source = isset($raw['source_node_id']) ? (string) $raw['source_node_id'] : '';
            $target = isset($raw['target_node_id']) ? (string) $raw['target_node_id'] : '';

            if ($source === '') {
                $errors[] = new ValidationError("edges.{$i}.source_node_id", 'Required.', 'required');
            }

            if ($target === '') {
                $errors[] = new ValidationError("edges.{$i}.target_node_id", 'Required.', 'required');
            }

            $label = isset($raw['label']) ? (string) $raw['label'] : null;

            if ($errors === []) {
                $edgeInputs[] = new SaveScenarioGraphEdgeInput(
                    sourceNodeId: $source,
                    targetNodeId: $target,
                    label:        $label !== '' ? $label : null,
                );
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $this->useCase->execute(new SaveScenarioGraphInput(
            scenarioId:     $scenarioId,
            organizationId: $orgId,
            nodes:          $nodeInputs,
            edges:          $edgeInputs,
        ));

        return $this->response->create([], 204);
    }
}
