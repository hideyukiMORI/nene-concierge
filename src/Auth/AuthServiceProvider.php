<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use LogicException;
use Nene2\Auth\TokenIssuerInterface;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class AuthServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                UserRepositoryInterface::class,
                static function (ContainerInterface $container): UserRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);
                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('DatabaseQueryExecutorInterface service is invalid.');
                    }
                    return new PdoUserRepository($query);
                },
            )
            // ── LoginUseCase / LoginHandler ─────────────────────────────────
            ->set(
                LoginUseCase::class,
                static function (ContainerInterface $container): LoginUseCase {
                    $users       = $container->get(UserRepositoryInterface::class);
                    $tokenIssuer = $container->get('nene-concierge.token_issuer');
                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('UserRepositoryInterface service is invalid.');
                    }
                    if (!$tokenIssuer instanceof TokenIssuerInterface) {
                        throw new LogicException('TokenIssuerInterface service is invalid.');
                    }
                    return new LoginUseCase($users, $tokenIssuer);
                },
            )
            ->set(
                LoginHandler::class,
                static function (ContainerInterface $container): LoginHandler {
                    $useCase  = $container->get(LoginUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);
                    if (!$useCase instanceof LoginUseCase) {
                        throw new LogicException('LoginUseCase service is invalid.');
                    }
                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JsonResponseFactory service is invalid.');
                    }
                    return new LoginHandler($useCase, $response);
                },
            )
            // ── User CRUD UseCases ──────────────────────────────────────────
            ->set(
                ListUsersUseCase::class,
                static function (ContainerInterface $container): ListUsersUseCase {
                    $users = $container->get(UserRepositoryInterface::class);
                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('UserRepositoryInterface service is invalid.');
                    }
                    return new ListUsersUseCase($users);
                },
            )
            ->set(
                GetUserByIdUseCase::class,
                static function (ContainerInterface $container): GetUserByIdUseCase {
                    $users = $container->get(UserRepositoryInterface::class);
                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('UserRepositoryInterface service is invalid.');
                    }
                    return new GetUserByIdUseCase($users);
                },
            )
            ->set(
                CreateUserUseCase::class,
                static function (ContainerInterface $container): CreateUserUseCase {
                    $users = $container->get(UserRepositoryInterface::class);
                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('UserRepositoryInterface service is invalid.');
                    }
                    return new CreateUserUseCase($users);
                },
            )
            ->set(
                UpdateUserUseCase::class,
                static function (ContainerInterface $container): UpdateUserUseCase {
                    $users = $container->get(UserRepositoryInterface::class);
                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('UserRepositoryInterface service is invalid.');
                    }
                    return new UpdateUserUseCase($users);
                },
            )
            ->set(
                DeleteUserUseCase::class,
                static function (ContainerInterface $container): DeleteUserUseCase {
                    $users = $container->get(UserRepositoryInterface::class);
                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('UserRepositoryInterface service is invalid.');
                    }
                    return new DeleteUserUseCase($users);
                },
            )
            // ── User CRUD Handlers ──────────────────────────────────────────
            ->set(
                ListUsersHandler::class,
                static function (ContainerInterface $container): ListUsersHandler {
                    $useCase  = $container->get(ListUsersUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);
                    if (!$useCase instanceof ListUsersUseCase) {
                        throw new LogicException('ListUsersUseCase service is invalid.');
                    }
                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JsonResponseFactory service is invalid.');
                    }
                    return new ListUsersHandler($useCase, $response);
                },
            )
            ->set(
                GetUserByIdHandler::class,
                static function (ContainerInterface $container): GetUserByIdHandler {
                    $useCase  = $container->get(GetUserByIdUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);
                    if (!$useCase instanceof GetUserByIdUseCase) {
                        throw new LogicException('GetUserByIdUseCase service is invalid.');
                    }
                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JsonResponseFactory service is invalid.');
                    }
                    return new GetUserByIdHandler($useCase, $response);
                },
            )
            ->set(
                CreateUserHandler::class,
                static function (ContainerInterface $container): CreateUserHandler {
                    $useCase  = $container->get(CreateUserUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);
                    if (!$useCase instanceof CreateUserUseCase) {
                        throw new LogicException('CreateUserUseCase service is invalid.');
                    }
                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JsonResponseFactory service is invalid.');
                    }
                    return new CreateUserHandler($useCase, $response);
                },
            )
            ->set(
                UpdateUserHandler::class,
                static function (ContainerInterface $container): UpdateUserHandler {
                    $useCase  = $container->get(UpdateUserUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);
                    if (!$useCase instanceof UpdateUserUseCase) {
                        throw new LogicException('UpdateUserUseCase service is invalid.');
                    }
                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JsonResponseFactory service is invalid.');
                    }
                    return new UpdateUserHandler($useCase, $response);
                },
            )
            ->set(
                DeleteUserHandler::class,
                static function (ContainerInterface $container): DeleteUserHandler {
                    $useCase  = $container->get(DeleteUserUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);
                    if (!$useCase instanceof DeleteUserUseCase) {
                        throw new LogicException('DeleteUserUseCase service is invalid.');
                    }
                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JsonResponseFactory service is invalid.');
                    }
                    return new DeleteUserHandler($useCase, $response);
                },
            )
            // ── Domain exception handlers ───────────────────────────────────
            ->set(
                InvalidCredentialsExceptionHandler::class,
                static function (ContainerInterface $container): InvalidCredentialsExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('ProblemDetailsResponseFactory service is invalid.');
                    }
                    return new InvalidCredentialsExceptionHandler($problemDetails);
                },
            )
            ->set(
                UserNotFoundExceptionHandler::class,
                static function (ContainerInterface $container): UserNotFoundExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('ProblemDetailsResponseFactory service is invalid.');
                    }
                    return new UserNotFoundExceptionHandler($problemDetails);
                },
            )
            ->set(
                UserEmailConflictExceptionHandler::class,
                static function (ContainerInterface $container): UserEmailConflictExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('ProblemDetailsResponseFactory service is invalid.');
                    }
                    return new UserEmailConflictExceptionHandler($problemDetails);
                },
            )
            ->set(
                UserOperationForbiddenExceptionHandler::class,
                static function (ContainerInterface $container): UserOperationForbiddenExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('ProblemDetailsResponseFactory service is invalid.');
                    }
                    return new UserOperationForbiddenExceptionHandler($problemDetails);
                },
            )
            // ── Route registrar ─────────────────────────────────────────────
            ->set(
                'nene-concierge.route_registrar.auth',
                static function (ContainerInterface $container): AuthRouteRegistrar {
                    $loginHandler  = $container->get(LoginHandler::class);
                    $listUsers     = $container->get(ListUsersHandler::class);
                    $getUser       = $container->get(GetUserByIdHandler::class);
                    $createUser    = $container->get(CreateUserHandler::class);
                    $updateUser    = $container->get(UpdateUserHandler::class);
                    $deleteUser    = $container->get(DeleteUserHandler::class);
                    if (!$loginHandler instanceof LoginHandler) {
                        throw new LogicException('LoginHandler service is invalid.');
                    }
                    if (!$listUsers instanceof ListUsersHandler) {
                        throw new LogicException('ListUsersHandler service is invalid.');
                    }
                    if (!$getUser instanceof GetUserByIdHandler) {
                        throw new LogicException('GetUserByIdHandler service is invalid.');
                    }
                    if (!$createUser instanceof CreateUserHandler) {
                        throw new LogicException('CreateUserHandler service is invalid.');
                    }
                    if (!$updateUser instanceof UpdateUserHandler) {
                        throw new LogicException('UpdateUserHandler service is invalid.');
                    }
                    if (!$deleteUser instanceof DeleteUserHandler) {
                        throw new LogicException('DeleteUserHandler service is invalid.');
                    }
                    return new AuthRouteRegistrar(
                        $loginHandler,
                        $listUsers,
                        $getUser,
                        $createUser,
                        $updateUser,
                        $deleteUser,
                    );
                },
            );
    }
}
