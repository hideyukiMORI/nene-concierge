<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class UpdateScenarioHandler implements RequestHandlerInterface
{
    public function __construct(
        private UpdateScenarioUseCase $useCase,
        private JsonResponseFactory   $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $scenarioId = (int) Router::param($request, 'id');
        $body       = JsonRequestBodyParser::parse($request);

        $status = null;

        if (isset($body['status'])) {
            $status = ScenarioStatus::from((string) $body['status']);
        }

        $input = new UpdateScenarioInput(
            scenarioId:  $scenarioId,
            name:        isset($body['name']) ? trim((string) $body['name']) : null,
            description: isset($body['description']) ? (string) $body['description'] : null,
            status:      $status,
            nodes:       isset($body['nodes']) ? array_values((array) $body['nodes']) : null,
            edges:       isset($body['edges']) ? array_values((array) $body['edges']) : null,
        );

        $this->useCase->execute($input, $orgId);

        return $this->response->create([], 204);
    }
}
