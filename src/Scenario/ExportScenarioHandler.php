<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/scenarios/{id}/export
 *
 * Returns a portable JSON export of the scenario.
 * The export document can be used with ImportScenarioHandler to
 * reproduce the scenario in any organization.
 */
final readonly class ExportScenarioHandler implements RequestHandlerInterface
{
    public function __construct(
        private ExportScenarioUseCase $useCase,
        private JsonResponseFactory   $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $scenarioId = (int) Router::param($request, 'id');

        $doc = $this->useCase->execute($scenarioId, $orgId);

        return $this->response->create([
            'schema_version' => ScenarioExportDocument::SCHEMA_VERSION,
            'exported_at'    => $doc->exportedAt,
            'scenario'       => [
                'name'        => $doc->name,
                'description' => $doc->description,
                'nodes'       => $doc->nodes,
                'edges'       => $doc->edges,
            ],
        ]);
    }
}
