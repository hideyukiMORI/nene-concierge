<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class GetScenarioHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetScenarioUseCase  $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $scenarioId = (int) $request->getAttribute('id', 0);

        $result = $this->useCase->execute($scenarioId, $orgId);

        return $this->response->create($this->toArray($result));
    }

    /** @return array<string, mixed> */
    private function toArray(GetScenarioResult $result): array
    {
        return [
            'id'          => $result->scenario->id,
            'name'        => $result->scenario->name,
            'description' => $result->scenario->description,
            'status'      => $result->scenario->status->value,
            'created_at'  => $result->scenario->createdAt,
            'updated_at'  => $result->scenario->updatedAt,
            'nodes'       => array_map(
                static fn (ScenarioNode $n): array => [
                    'node_id'    => $n->nodeId,
                    'type'       => $n->type->value,
                    'label'      => $n->label,
                    'data'       => $n->data,
                    'position_x' => $n->positionX,
                    'position_y' => $n->positionY,
                ],
                $result->nodes,
            ),
            'edges'       => array_map(
                static fn (ScenarioEdge $e): array => [
                    'source_node_id' => $e->sourceNodeId,
                    'target_node_id' => $e->targetNodeId,
                    'label'          => $e->label,
                ],
                $result->edges,
            ),
        ];
    }
}
