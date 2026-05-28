<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AuthRouteRegistrar
{
    public function __construct(
        private LoginHandler $loginHandler,
        private ListUsersHandler $listUsersHandler,
        private GetUserByIdHandler $getUserHandler,
        private CreateUserHandler $createUserHandler,
        private UpdateUserHandler $updateUserHandler,
        private DeleteUserHandler $deleteUserHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $loginHandler = $this->loginHandler;
        $listUsers    = $this->listUsersHandler;
        $getUser      = $this->getUserHandler;
        $createUser   = $this->createUserHandler;
        $updateUser   = $this->updateUserHandler;
        $deleteUser   = $this->deleteUserHandler;

        $router->post('/api/v1/auth/login', static fn (ServerRequestInterface $r) => $loginHandler->handle($r));

        // User management (requires Capability::ManageUsers; enforced by CapabilityMiddleware)
        $router->get('/api/v1/users', static fn (ServerRequestInterface $r) => $listUsers->handle($r));
        $router->get('/api/v1/users/{id}', static fn (ServerRequestInterface $r) => $getUser->handle($r));
        $router->post('/api/v1/users', static fn (ServerRequestInterface $r) => $createUser->handle($r));
        $router->patch('/api/v1/users/{id}', static fn (ServerRequestInterface $r) => $updateUser->handle($r));
        $router->delete('/api/v1/users/{id}', static fn (ServerRequestInterface $r) => $deleteUser->handle($r));
    }
}
