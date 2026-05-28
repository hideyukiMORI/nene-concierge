<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class DeleteUserHandler implements RequestHandlerInterface
{
    public function __construct(
        private DeleteUserUseCase $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id         = (int) ($parameters['id'] ?? 0);

        $claims          = (array) ($request->getAttribute('nene2.auth.claims') ?? []);
        $requesterUserId = isset($claims['user_id']) ? (int) $claims['user_id'] : null;

        $this->useCase->execute($id, $requesterUserId);

        return $this->response->create([], 204);
    }
}
