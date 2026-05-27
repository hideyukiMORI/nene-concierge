<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListScenariosHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListScenariosUseCase $useCase,
        private JsonResponseFactory  $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId  = (int) $request->getAttribute('nene2.org.id', 0);
        $params = $request->getQueryParams();
        $limit  = max(1, min(100, (int) ($params['limit'] ?? 20)));
        $offset = max(0, (int) ($params['offset'] ?? 0));

        $result = $this->useCase->execute($orgId, $limit, $offset);

        return $this->response->create([
            'data' => array_map(
                static fn (Scenario $s): array => [
                    'id'          => $s->id,
                    'name'        => $s->name,
                    'description' => $s->description,
                    'status'      => $s->status->value,
                    'created_at'  => $s->createdAt,
                    'updated_at'  => $s->updatedAt,
                ],
                $result->items,
            ),
            'meta' => [
                'total'  => $result->total,
                'limit'  => $result->limit,
                'offset' => $result->offset,
            ],
        ]);
    }
}
