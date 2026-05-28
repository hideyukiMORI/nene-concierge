<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListUsersHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListUsersUseCase $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $output = $this->useCase->execute();

        $items = array_map(
            static fn (ListUsersItem $i): array => [
                'id'         => $i->id,
                'email'      => $i->email,
                'role'       => $i->role,
                'status'     => $i->status,
                'created_at' => $i->createdAt,
                'updated_at' => $i->updatedAt,
            ],
            $output->items,
        );

        return $this->response->create(['data' => $items]);
    }
}
