<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class GetUserByIdHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetUserByIdUseCase $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id         = (int) ($parameters['id'] ?? 0);

        $user = $this->useCase->execute($id);

        return $this->response->create([
            'id'         => $user->id,
            'email'      => $user->email,
            'role'       => $user->role,
            'status'     => $user->status,
            'created_at' => $user->createdAt,
            'updated_at' => $user->updatedAt,
        ]);
    }
}
