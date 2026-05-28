<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/scenario-revisions/{id}
 *
 * Returns a single revision with its snapshot JSON parsed, and the immediately
 * preceding revision (so the frontend can compute a diff).
 */
final readonly class GetScenarioRevisionHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetScenarioRevisionUseCase $useCase,
        private JsonResponseFactory        $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);
        $id    = (int) Router::param($request, 'id');

        $result = $this->useCase->execute($id, $orgId);

        return $this->response->create([
            'revision' => $this->serialize($result->revision),
            'previous' => $result->previous !== null ? $this->serialize($result->previous) : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(ScenarioRevision $r): array
    {
        return [
            'id'              => $r->id,
            'scenario_id'     => $r->scenarioId,
            'organization_id' => $r->organizationId,
            'revision_no'     => $r->revisionNo,
            'user_id'         => $r->userId,
            'user_email'      => $r->userEmail,
            'operation'       => $r->operation,
            'name'            => $r->name,
            'description'     => $r->description,
            'status'          => $r->status,
            'node_count'      => $r->nodeCount,
            'edge_count'      => $r->edgeCount,
            'snapshot'        => $this->parseSnapshot($r->snapshotJson),
            'created_at'      => $r->createdAt,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parseSnapshot(?string $json): ?array
    {
        if ($json === null || $json === '') {
            return null;
        }
        try {
            $decoded = json_decode($json, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }
}
